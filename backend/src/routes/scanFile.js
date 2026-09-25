/**
 * File Upload Scan Route — Secretless Code
 * POST /api/scan/upload
 *
 * Accepts a ZIP or TAR.GZ archive of source code and scans it for secrets
 * using the configured scan engine (Gitleaks / TruffleHog / builtin).
 *
 * Flow:
 *   1. Validate file type (zip / tar.gz only) and size (MAX_UPLOAD_SIZE_MB)
 *   2. Extract archive to an isolated temp directory
 *   3. Run scan engine via engineRouter
 *   4. Guaranteed cleanup of temp dir and upload
 *   5. Return findings (rawMatch always masked)
 *   6. Optionally save report to cloud storage
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { runScan, getEngineConfig } = require('../services/engineRouter');
const { saveReport, getProviderName } = require('../services/storage/storageRouter');
const { validateBody } = require('../middlewares/validateSchema');
const logger = require('../utils/logger');

const router = express.Router();

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 20;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// ── Multer configuration ───────────────────────────────────────────────────────
// Store files in OS temp directory — never on persistent disk
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(os.tmpdir(), `secretless-upload-${crypto.randomBytes(6).toString('hex')}`);
      fs.mkdirSync(uploadDir, { recursive: true });
      req._uploadDir = uploadDir;    // track for cleanup
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Sanitize original filename — strip path traversal attempts
      const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, safe);
    }
  }),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1           // only one archive at a time
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-gzip',
      'application/x-compressed',
      'application/octet-stream'    // generic binary — validated by extension below
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.zip', '.tar', '.gz', '.tgz'];

    if (!allowedExts.includes(ext)) {
      return cb(new Error(`Unsupported file type: "${ext}". Allowed: .zip, .tar, .gz, .tgz`));
    }
    cb(null, true);
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) { err.stderr = stderr; return reject(err); }
      resolve({ stdout, stderr });
    });
  });
}

function cleanup(...paths) {
  for (const p of paths) {
    try {
      if (!p) continue;
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
      }
    } catch { /* best-effort */ }
  }
}

/**
 * Extracts a ZIP or TAR archive into targetDir.
 * Uses only system tools (unzip / tar) available in all environments.
 */
async function extractArchive(filePath, targetDir) {
  const ext = path.extname(filePath).toLowerCase();
  fs.mkdirSync(targetDir, { recursive: true });

  if (ext === '.zip') {
    try {
      await runCommand('unzip', ['-q', '-o', filePath, '-d', targetDir], { timeout: 15000 });
    } catch {
      // Fallback: Node.js cannot natively unzip without deps;
      // throw a clear error so the user knows to use tar.gz
      throw new Error('ZIP extraction failed. Try uploading a .tar.gz archive instead.');
    }
  } else if (['.gz', '.tgz', '.tar'].includes(ext)) {
    await runCommand(
      'tar',
      ['-xzf', filePath, '-C', targetDir, '--strip-components=1'],
      { timeout: 15000 }
    );
  } else {
    throw new Error(`Unsupported archive format: ${ext}`);
  }
}

// ── Route ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/scan/upload
 * multipart/form-data: file=<archive>, name=<optional display name>
 */
router.post(
  '/scan/upload',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: `File exceeds the maximum upload size of ${MAX_UPLOAD_MB}MB.`
            }
          });
        }
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message
          }
        });
      }
      if (err) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: err.message
          }
        });
      }
      next();
    });
  },
  async (req, res) => {
    const uploadedFile = req.file;
    const uploadDir = req._uploadDir;
    const extractDir = uploadDir ? path.join(os.tmpdir(), `secretless-extract-${crypto.randomBytes(6).toString('hex')}`) : null;
    const reportPath = path.join(os.tmpdir(), `secretless-upload-report-${crypto.randomBytes(6).toString('hex')}.json`);

    // Sanitize optional display name (max 200 chars, no path separators)
    const rawName = req.body?.name || uploadedFile?.originalname || 'uploaded-archive';
    const archiveName = String(rawName).replace(/[/\\]/g, '_').slice(0, 200);

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded. Send a multipart/form-data request with a "file" field containing a .zip or .tar.gz archive.'
        }
      });
    }

    const startTime = Date.now();

    try {
      // 1. Extract archive
      try {
        await extractArchive(uploadedFile.path, extractDir);
      } catch (extractErr) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'EXTRACT_FAILED',
            message: `Failed to extract archive: ${extractErr.message}`
          }
        });
      }

      // 2. Run scan engine
      const { findings, engineUsed } = await runScan(extractDir, reportPath);

      const summary = {
        total: findings.length,
        critical: findings.filter(f => f.severity === 'Critical').length,
        high: findings.filter(f => f.severity === 'High').length,
        medium: findings.filter(f => f.severity === 'Medium').length
      };

      const scanResult = {
        success: true,
        repo: archiveName,
        source: 'file-upload',
        scannedAt: new Date().toISOString(),
        scanDurationMs: Date.now() - startTime,
        engineUsed,
        engineConfig: getEngineConfig(),
        repoSizeMB: Number((uploadedFile.size / 1024 / 1024).toFixed(2)),
        summary,
        findings
      };

      // 3. Save masked report to cloud storage (non-blocking)
      const storagePromise = saveReport(scanResult).catch(() => ({ stored: false }));
      const storageResult = await Promise.race([
        storagePromise,
        new Promise(resolve => setTimeout(() => resolve({ stored: false, reason: 'timeout' }), 5000))
      ]);

      return res.status(200).json({
        success: true,
        data: {
          ...scanResult,
          report: storageResult.stored
            ? {
                stored: true,
                provider: storageResult.provider,
                key: storageResult.key,
                presignedUrl: storageResult.presignedUrl,
                expiresIn: storageResult.expiresIn
              }
            : { stored: false, provider: getProviderName(), reason: storageResult.reason }
        }
      });

    } catch (err) {
      logger.error('[Upload Scan] Failed', { archive: archiveName, error: err.message });
      return res.status(500).json({
        success: false,
        error: {
          code: 'SCAN_FAILED',
          message: err.message || 'An unexpected error occurred during file scan.'
        }
      });
    } finally {
      // 4. Guaranteed cleanup — always delete upload and extracted files
      cleanup(uploadDir, extractDir, reportPath);
    }
  }
);

module.exports = router;
