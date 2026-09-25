/**
 * Strict validation and sanitization for GitHub repository URLs.
 * Mitigates SSRF, command injection, and local file inclusion attempts.
 */

const GITHUB_URL_REGEX = /^https:\/\/(www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(\.git|\/)?$/;

/**
 * Validates whether the given string is a valid, clean public GitHub URL.
 * @param {string} url 
 * @returns {{ valid: boolean, error?: string, sanitizedUrl?: string, owner?: string, repo?: string }}
 */
function validateGitHubUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'A GitHub repository URL is required.' };
  }

  const trimmed = url.trim();

  // Basic length check
  if (trimmed.length > 250) {
    return { valid: false, error: 'Repository URL is suspiciously long.' };
  }

  // Reject file://, ssh://, git://, internal IPs, localhost
  if (!trimmed.startsWith('https://')) {
    return { valid: false, error: 'Only public HTTPS GitHub URLs are permitted (must start with https://github.com).' };
  }

  // Check against strict GitHub repository pattern
  const match = trimmed.match(GITHUB_URL_REGEX);
  if (!match) {
    return { 
      valid: false, 
      error: 'Invalid GitHub URL. Format must be: https://github.com/<owner>/<repository>' 
    };
  }

  const owner = match[2];
  let repo = match[3];

  // Strip trailing .git if present in repo name
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  // Reject dangerous characters that could be passed to shell or path traversal
  const disallowedChars = /[;&|`$<>'"\\]/;
  if (disallowedChars.test(owner) || disallowedChars.test(repo)) {
    return { valid: false, error: 'Repository URL contains invalid characters.' };
  }

  // Prevent path traversal patterns
  if (owner === '.' || owner === '..' || repo === '.' || repo === '..') {
    return { valid: false, error: 'Invalid repository path.' };
  }

  const sanitizedUrl = `https://github.com/${owner}/${repo}.git`;

  return {
    valid: true,
    sanitizedUrl,
    owner,
    repo: `${owner}/${repo}`
  };
}

module.exports = {
  validateGitHubUrl
};
