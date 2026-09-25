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
 * Deduplicates findings from multiple engines.
 * Treats findings at the same file + line as duplicates, keeping the higher severity one.
 */
function deduplicateFindings(findings) {
  const seen = new Map();
  for (const f of findings) {
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
        return { findings, engineUsed: 'gitleaks' };
      }
      console.warn('[Engine] Gitleaks not found — falling back to builtin scanner.');
      return { findings: builtin.scan(targetDir), engineUsed: 'builtin-fallback' };
    }

    // ── Explicit: TruffleHog only ───────────────────────────────────────────
    case 'trufflehog': {
      if (await truffleHog.isAvailable()) {
        const findings = await truffleHog.scan(targetDir);
        return { findings, engineUsed: 'trufflehog' };
      }
      console.warn('[Engine] TruffleHog not found — falling back to builtin scanner.');
      return { findings: builtin.scan(targetDir), engineUsed: 'builtin-fallback' };
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
          console.warn('[Engine] Gitleaks error in "both" mode:', err.message);
        }
      }

      if (await truffleHog.isAvailable()) {
        try {
          const findings = await truffleHog.scan(targetDir);
          results.push(...findings);
          enginesUsed.push('trufflehog');
        } catch (err) {
          console.warn('[Engine] TruffleHog error in "both" mode:', err.message);
        }
      }

      if (enginesUsed.length === 0) {
        console.warn('[Engine] Neither Gitleaks nor TruffleHog available — using builtin.');
        return { findings: builtin.scan(targetDir), engineUsed: 'builtin-fallback' };
      }

      const deduplicated = deduplicateFindings(results);
      return {
        findings: deduplicated,
        engineUsed: enginesUsed.join('+')
      };
    }

    // ── Auto: Try each engine in priority order ─────────────────────────────
    case 'auto':
    default: {
      // 1st priority: Gitleaks (most widely adopted, fastest)
      if (await gitleaks.isAvailable()) {
        try {
          const findings = await gitleaks.scan(targetDir, reportPath);
          return { findings, engineUsed: 'gitleaks' };
        } catch (err) {
          console.warn('[Engine] Gitleaks failed, trying TruffleHog:', err.message);
        }
      }

      // 2nd priority: TruffleHog (deeper detection, verifies credentials)
      if (await truffleHog.isAvailable()) {
        try {
          const findings = await truffleHog.scan(targetDir);
          return { findings, engineUsed: 'trufflehog' };
        } catch (err) {
          console.warn('[Engine] TruffleHog failed, falling back to builtin:', err.message);
        }
      }

      // 3rd priority: Built-in regex scanner (always available, no binary needed)
      console.warn('[Engine] No CLI scanner available — using built-in heuristic scanner.');
      return { findings: builtin.scan(targetDir), engineUsed: 'builtin' };
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
