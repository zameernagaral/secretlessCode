/**
 * Report Generator — Secretless Code
 *
 * Generates a sanitized, masked JSON report from scan findings.
 * The report is safe to store externally — secrets are never stored raw.
 */

/**
 * Masks a raw secret string for safe external storage.
 * @param {string} secret
 * @returns {string}
 */
function maskSecret(secret = '') {
  const s = secret.trim();
  if (!s) return '••••••••';

  // Database URIs — mask password portion
  if (s.includes('://') && s.includes('@')) {
    return s.replace(/:\/\/([^:]+):([^@]+)@/, (_, user) => `://${user}:••••••••@`);
  }
  // Short values
  if (s.length <= 8) return '••••••••';

  // Show up to first 6 chars, mask rest
  const visibleLen = Math.min(6, Math.floor(s.length * 0.25));
  return s.slice(0, visibleLen) + '•'.repeat(Math.min(16, s.length - visibleLen));
}

/**
 * Builds a sanitized report object ready for external storage.
 * All rawMatch values are replaced with masked equivalents.
 *
 * @param {object} scanResult - Full scan result from scanner.js
 * @returns {object} Safe, masked report
 */
function buildReport(scanResult) {
  const {
    repo,
    scannedAt,
    scanDurationMs,
    engineUsed,
    engineConfig,
    repoSizeMB,
    summary,
    findings
  } = scanResult;

  return {
    reportVersion: '1.0',
    generatedAt: new Date().toISOString(),
    repository: repo,
    scannedAt,
    scanDurationMs,
    scannerEngine: engineUsed,
    engineConfig,
    repoSizeMB,
    summary,
    findings: findings.map(f => ({
      id: f.id,
      filePath: f.filePath,
      lineNumber: f.lineNumber,
      endLine: f.endLine,
      secretType: f.secretType,
      ruleId: f.ruleId,
      severity: f.severity,
      maskedValue: maskSecret(f.rawMatch),  // ← NEVER store raw secret
      verified: f.verified ?? null,         // TruffleHog verification result
      engine: f.engine
    })),
    disclaimer: 'All secret values are masked. This report does not contain any raw credentials.'
  };
}

/**
 * Serializes the report to a JSON Buffer ready for upload.
 * @param {object} report - Output of buildReport()
 * @returns {Buffer}
 */
function serializeReport(report) {
  return Buffer.from(JSON.stringify(report, null, 2), 'utf8');
}

/**
 * Generates a storage key (object path) for a report.
 * @param {string} repo - "owner/repo"
 * @param {string} scannedAt - ISO timestamp
 * @returns {string}
 */
function buildStorageKey(repo, scannedAt) {
  const date = new Date(scannedAt);
  const datePath = `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}`;
  const safeRepo = repo.replace('/', '_');
  const ts = date.getTime();
  return `reports/${datePath}/${safeRepo}_${ts}.json`;
}

module.exports = { buildReport, serializeReport, buildStorageKey };
