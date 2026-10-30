const path = require('path');
const logger = require('./../utils/logger');
/**
 * Engine Router — Secretless Code Scanning Engine Selector
 *
 * Selects the appropriate scanning engine based on SCAN_ENGINE env var.
 *
 * SCAN_ENGINE values:
 *   "gitleaks"   - Use Gitleaks v8 CLI only (falls back to builtin if not installed)
 *   "trufflehog" - Use TruffleHog v3 CLI only (falls back to builtin if not installed)
 *   "auto"       - Try Gitleaks → TruffleHog → builtin (best available)
 *   "both"       - Run Gitleaks AND TruffleHog, merge and deduplicate results
 *
 * Default: "auto"
 */

const gitleaks = require('./engines/gitleaks');
const truffleHog = require('./engines/truffleHog');
const builtin = require('./engines/builtin');

const SCAN_ENGINE = (process.env.SCAN_ENGINE || 'auto').toLowerCase().trim();

/**
 * Normalizes filePath in a finding to be repo-relative (removes temp directories).
 */
function normalizeFindingPath(f, targetDir) {
  if (!f || !f.filePath || f.filePath === 'unknown') return f;
  let filePath = f.filePath;
  if (targetDir && (path.isAbsolute(filePath) || filePath.includes(targetDir))) {
    filePath = path.relative(targetDir, path.resolve(targetDir, filePath)) || path.basename(filePath);
  }
  if (filePath.includes('secretless-')) {
    filePath = filePath.replace(/^.*\/secretless-(?:scan|extract|pr|upload)-[a-f0-9]+\//, '');
  }
  return { ...f, filePath };
}

/**
 * Deduplicates findings from multiple engines.
 * Treats findings at the same file + line as duplicates, keeping the higher severity one.
 */
function deduplicateFindings(findings, targetDir) {
  const seen = new Map();
  for (const raw of findings) {
    const f = targetDir ? normalizeFindingPath(raw, targetDir) : raw;
    const key = `${f.filePath}:${f.lineNumber}`;
    if (!seen.has(key)) {
      seen.set(key, f);
    } else {
      // Keep whichever has higher severity
      const existing = seen.get(key);
      const severityRank = { Critical: 3, High: 2, Medium: 1 };
      if ((severityRank[f.severity] || 0) > (severityRank[existing.severity] || 0)) {
        seen.set(key, f);
      }
    }
  }
  return Array.from(seen.values());
}

/**
 * Routes the scan to the configured engine(s).
 *
 * @param {string} targetDir - The cloned repository directory path
 * @param {string} reportPath - Temp file path for engines that write JSON reports
 * @returns {Promise<{ findings: Array, engineUsed: string }>}
 */
async function runScan(targetDir, reportPath) {
  switch (SCAN_ENGINE) {

    // ── Explicit: Gitleaks only ─────────────────────────────────────────────
    case 'gitleaks': {
      if (await gitleaks.isAvailable()) {
        const findings = await gitleaks.scan(targetDir, reportPath);
        return { findings: findings.map(f => normalizeFindingPath(f, targetDir)), engineUsed: 'gitleaks' };
      }
      logger.warn('[Engine] Gitleaks not found — falling back to builtin scanner.');
      return { findings: builtin.scan(targetDir).map(f => normalizeFindingPath(f, targetDir)), engineUsed: 'builtin-fallback' };
    }

    // ── Explicit: TruffleHog only ───────────────────────────────────────────
    case 'trufflehog': {
      if (await truffleHog.isAvailable()) {
        const findings = await truffleHog.scan(targetDir);
        return { findings: findings.map(f => normalizeFindingPath(f, targetDir)), engineUsed: 'trufflehog' };
      }
      logger.warn('[Engine] TruffleHog not found — falling back to builtin scanner.');
      return { findings: builtin.scan(targetDir).map(f => normalizeFindingPath(f, targetDir)), engineUsed: 'builtin-fallback' };
    }

    // ── Both: Run Gitleaks + TruffleHog, merge and deduplicate results ──────
    case 'both': {
      const results = [];
      const enginesUsed = [];

      if (await gitleaks.isAvailable()) {
        try {
          const findings = await gitleaks.scan(targetDir, reportPath);
          results.push(...findings);
          enginesUsed.push('gitleaks');
        } catch (err) {
          logger.warn('[Engine] Gitleaks error in "both" mode:', err.message);
        }
      }

      if (await truffleHog.isAvailable()) {
        try {
          const findings = await truffleHog.scan(targetDir);
          results.push(...findings);
          enginesUsed.push('trufflehog');
        } catch (err) {
          logger.warn('[Engine] TruffleHog error in "both" mode:', err.message);
        }
      }

      if (enginesUsed.length === 0) {
        logger.warn('[Engine] Neither Gitleaks nor TruffleHog available — using builtin.');
        return { findings: builtin.scan(targetDir).map(f => normalizeFindingPath(f, targetDir)), engineUsed: 'builtin-fallback' };
      }

      const deduplicated = deduplicateFindings(results, targetDir);
      return {
        findings: deduplicated,
        engineUsed: enginesUsed.join('+')
      };
    }

    // ── Auto: Try each engine in priority order ─────────────────────────────
    // ── Auto: Combine Gitleaks with Built-in heuristic engine (complete coverage) ─
    case 'auto':
    default: {
      const results = [];
      const enginesUsed = [];

      // 1st: Run Gitleaks if installed (detects Git history, AWS, Stripe, GitHub tokens)
      if (await gitleaks.isAvailable()) {
        try {
          const glFindings = await gitleaks.scan(targetDir, reportPath);
          results.push(...glFindings);
          enginesUsed.push('gitleaks');
        } catch (err) {
          logger.warn('[Engine] Gitleaks scan error in auto mode:', err.message);
        }
      }

      // 2nd: Run built-in heuristic scanner (catches MongoDB/PostgreSQL URIs, AI API keys)
      try {
        const biFindings = builtin.scan(targetDir);
        results.push(...biFindings);
        enginesUsed.push('builtin');
      } catch (err) {
        logger.warn('[Engine] Built-in scanner error in auto mode:', err.message);
      }

      const deduplicated = deduplicateFindings(results, targetDir);
      return {
        findings: deduplicated,
        engineUsed: enginesUsed.join('+') || 'builtin'
      };
    }
  }
}

/**
 * Returns the currently configured engine name for info/logging purposes.
 */
function getEngineConfig() {
  return SCAN_ENGINE;
}

module.exports = { runScan, getEngineConfig };
