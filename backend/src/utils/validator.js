/**
 * Input Validation & Sanitization — Secretless Code
 * Hardened validation for all user-supplied inputs.
 * Mitigates: SSRF, command injection, path traversal, prototype pollution, XSS.
 */

// ── GitHub URL ─────────────────────────────────────────────────────────────────

// Strict pattern: only github.com HTTPS URLs, owner/repo chars only
const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\/([a-zA-Z0-9_.\-]{1,100}?)(?:\.git|\/)?$/;

// Block SSRF targets — internal IPs, localhost, metadata endpoints
const BLOCKED_HOSTS = [
  /localhost/i,
  /127\.\d+\.\d+\.\d+/,
  /0\.0\.0\.0/,
  /10\.\d+\.\d+\.\d+/,
  /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/,
  /192\.168\.\d+\.\d+/,
  /169\.254\.\d+\.\d+/,    // AWS metadata
  /::1/,                    // IPv6 loopback
  /metadata\.google\./i,
  /metadata\.internal/i
];

// Characters that must never appear in owner/repo (shell injection, path traversal)
const DANGEROUS_CHARS = /[;&|`$<>'"\\{}()\[\]]/;

/**
 * Validates and sanitizes a GitHub repository URL.
 * @param {unknown} url
 * @returns {{ valid: boolean, error?: string, sanitizedUrl?: string, owner?: string, repo?: string }}
 */
function validateGitHubUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'A GitHub repository URL is required.' };
  }

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Repository URL cannot be empty.' };
  }
  if (trimmed.length > 300) {
    return { valid: false, error: 'Repository URL is too long (max 300 characters).' };
  }

  // Must be HTTPS — block file://, ssh://, git://, ftp://, data:, etc.
  if (!trimmed.startsWith('https://')) {
    return { valid: false, error: 'Only public HTTPS GitHub URLs are permitted (must start with https://github.com).' };
  }

  // SSRF guard — block internal/private IPs
  for (const pattern of BLOCKED_HOSTS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'URL target is not permitted.' };
    }
  }

  // Strict pattern match
  const match = trimmed.match(GITHUB_URL_REGEX);
  if (!match) {
    return {
      valid: false,
      error: 'Invalid GitHub URL. Expected format: https://github.com/<owner>/<repository>'
    };
  }

  const owner = match[1];
  let repoName = match[2];
  if (repoName.endsWith('.git')) repoName = repoName.slice(0, -4);

  // Shell injection / command substitution guard
  if (DANGEROUS_CHARS.test(owner) || DANGEROUS_CHARS.test(repoName)) {
    return { valid: false, error: 'Repository URL contains invalid characters.' };
  }

  // Path traversal guard
  if (['..', '.', ''].includes(owner) || ['..', '.', ''].includes(repoName)) {
    return { valid: false, error: 'Invalid repository path.' };
  }

  // Owner: must start/end with alphanumeric, no consecutive hyphens
  if (/--/.test(owner) || owner.startsWith('-') || owner.endsWith('-')) {
    return { valid: false, error: 'Invalid GitHub owner name.' };
  }

  const sanitizedUrl = `https://github.com/${owner}/${repoName}.git`;

  return {
    valid: true,
    sanitizedUrl,
    owner,
    repo: `${owner}/${repoName}`
  };
}

// ── Request body sanitization ──────────────────────────────────────────────────

/**
 * Recursively strips prototype-polluting keys from an object.
 * Prevents __proto__, constructor, prototype injection attacks.
 * @param {unknown} obj
 * @returns {unknown}
 */
function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj !== null && typeof obj === 'object') {
    const safe = Object.create(null);
    for (const [key, value] of Object.entries(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      safe[key] = sanitizeObject(value);
    }
    return safe;
  }
  return obj;
}

/**
 * Express middleware: sanitizes all request bodies against prototype pollution.
 * Apply before any route handler that reads req.body.
 */
function sanitizeRequestBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Validates that a string value is a safe, non-empty string within a length limit.
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {{ valid: boolean, error?: string, value?: string }}
 */
function validateStringField(value, maxLength = 500) {
  if (value === undefined || value === null) {
    return { valid: false, error: 'Field is required.' };
  }
  if (typeof value !== 'string') {
    return { valid: false, error: 'Field must be a string.' };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Field cannot be empty.' };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Field exceeds maximum length of ${maxLength} characters.` };
  }
  return { valid: true, value: trimmed };
}

module.exports = {
  validateGitHubUrl,
  sanitizeRequestBody,
  sanitizeObject,
  validateStringField
};
