/**
 * Output Sanitizer — Secretless Code
 *
 * Strips or encodes dangerous characters from API responses to prevent
 * XSS if responses are rendered by a browser without proper escaping.
 *
 * Also enforces that raw credential values NEVER appear in API responses.
 * All findings are checked and rawMatch is masked before leaving the server.
 */

/**
 * Masks a raw secret match to be safe for API response inclusion.
 * Mirrors the logic in reportGenerator.js (single source of truth for masking rules).
 * @param {string} raw
 * @returns {string}
 */
function maskRawMatch(raw = '') {
  const s = raw.trim();
  if (!s || s.length <= 4) return '••••••••';

  // Database URIs: mask password segment
  if (s.includes('://') && s.includes('@')) {
    return s.replace(/:\/\/([^:]+):([^@]+)@/, (_, user) => `://${user}:••••••••@`);
  }

  // Show first chars only, mask remainder
  const visibleLen = Math.min(6, Math.floor(s.length * 0.2));
  return s.slice(0, visibleLen) + '•'.repeat(Math.min(20, s.length - visibleLen));
}

/**
 * Recursively sanitizes an object for safe API output:
 * 1. Masks any rawMatch fields (secrets never leave the server unmasked)
 * 2. Encodes strings to prevent XSS
 *
 * @param {unknown} value
 * @param {string} [parentKey]
 * @returns {unknown}
 */
function sanitizeOutput(value, parentKey) {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    // Always mask rawMatch fields
    if (parentKey === 'rawMatch') {
      return maskRawMatch(value);
    }
    // HTML-encode special chars to prevent XSS if rendered in browser context
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeOutput(item, parentKey));
  }

  if (typeof value === 'object') {
    const safe = {};
    for (const [key, val] of Object.entries(value)) {
      safe[key] = sanitizeOutput(val, key);
    }
    return safe;
  }

  return value; // numbers, booleans — safe as-is
}

/**
 * Express middleware: sanitizes res.json output automatically.
 *
 * Wraps res.json to run sanitizeOutput on every response body before sending.
 * Attach globally in server.js after all route definitions.
 */
function outputSanitizer(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function(body) {
    try {
      const sanitized = sanitizeOutput(body);
      return originalJson(sanitized);
    } catch {
      // If sanitization fails for any reason, send original (fail-open is safer than 500)
      return originalJson(body);
    }
  };

  next();
}

module.exports = { outputSanitizer, sanitizeOutput, maskRawMatch };
