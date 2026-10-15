const express = require('express');
const prisma = require('../utils/db');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory fallback cache in case external PostgreSQL database is reconnecting
const inMemoryScans = [];

/**
 * Helper to record a scan into Prisma DB or in-memory fallback
 */
async function saveScanRecord({ repoUrl, repoName, status, findingsCount, findings, scanDurationMs, isDemo, ipHash, userId }) {
  const record = {
    id: require('crypto').randomUUID(),
    repoUrl,
    repoName: repoName || repoUrl.replace('https://github.com/', ''),
    status: status || 'completed',
    findingsCount: findingsCount || (findings ? findings.length : 0),
    findings: findings || [],
    scanDurationMs: scanDurationMs || 0,
    isDemo: Boolean(isDemo),
    ipHash: ipHash || null,
    userId: userId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    if (process.env.DATABASE_URL) {
      const saved = await prisma.scan.create({
        data: {
          id: record.id,
          repoUrl: record.repoUrl,
          repoName: record.repoName,
          status: record.status,
          findingsCount: record.findingsCount,
          findings: record.findings,
          scanDurationMs: record.scanDurationMs,
          isDemo: record.isDemo,
          ipHash: record.ipHash,
          userId: record.userId,
        },
      });
      return saved;
    }
  } catch (err) {
    logger.warn('[Database] Unable to write scan to Prisma DB, keeping in memory cache', {
      error: err.message,
    });
  }

  // Prepend to in-memory cache
  inMemoryScans.unshift(record);
  if (inMemoryScans.length > 100) inMemoryScans.pop();
  return record;
}

/**
 * GET /api/v1/scans
 * Returns list of recent scans
 */
router.get('/scans', async (req, res) => {
  try {
    let scans = [];
    if (process.env.DATABASE_URL) {
      try {
        scans = await prisma.scan.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            repoUrl: true,
            repoName: true,
            status: true,
            findingsCount: true,
            findings: true,
            scanDurationMs: true,
            isDemo: true,
            createdAt: true,
          },
        });
      } catch (dbErr) {
        logger.warn('[Database] Query failed, falling back to cache', { error: dbErr.message });
      }
    }

    if (!scans || scans.length === 0) {
      scans = inMemoryScans.slice(0, 50);
    }

    return res.status(200).json({
      success: true,
      data: {
        total: scans.length,
        scans,
      },
    });
  } catch (err) {
    logger.error('[Scans History] Error fetching scans', { error: err.message });
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve scan history.' },
    });
  }
});

/**
 * GET /api/v1/scans/:id
 * Returns single scan by ID
 */
router.get('/scans/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let scan = null;
    if (process.env.DATABASE_URL) {
      try {
        scan = await prisma.scan.findUnique({ where: { id } });
      } catch {
        // Fallback
      }
    }

    if (!scan) {
      scan = inMemoryScans.find((s) => s.id === id);
    }

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scan record not found.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: scan,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve scan.' },
    });
  }
});

/**
 * GET /api/v1/scans/private/:userId
 * Returns private scan history for a specific user (requires authentication)
 */
router.get('/scans/private/:userId', async (req, res) => {
  const { userId } = req.params;
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to access private scan history.',
      },
    });
  }

  // Verify Bearer token presence
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing Bearer token.',
      },
    });
  }

  try {
    let scans = [];
    if (process.env.DATABASE_URL) {
      try {
        scans = await prisma.scan.findMany({
          where: { userId },
          take: 50,
          orderBy: { createdAt: 'desc' },
        });
      } catch (dbErr) {
        logger.warn('[Database] Query failed for private scans', { error: dbErr.message });
      }
    }

    if (!scans || scans.length === 0) {
      scans = inMemoryScans.filter((s) => s.userId === userId);
    }

    return res.status(200).json({
      success: true,
      data: {
        userId,
        total: scans.length,
        scans,
      },
    });
  } catch (err) {
    logger.error('[Scans History] Error fetching private scans', { error: err.message });
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve user scan history.' },
    });
  }
});

module.exports = { router, saveScanRecord, inMemoryScans };
