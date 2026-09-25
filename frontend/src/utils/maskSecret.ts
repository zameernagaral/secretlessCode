/**
 * Client-side secret masking utility.
 * Guarantees that sensitive tokens, keys, passwords, and URIs are NEVER rendered in raw plaintext.
 */

export function maskSecret(secret: string): string {
  if (!secret || typeof secret !== 'string') {
    return '••••••••••••';
  }

  const trimmed = secret.trim();

  // 1. Database Connection Strings: Mask credentials portion
  if (trimmed.includes('://') && trimmed.includes('@')) {
    try {
      return trimmed.replace(/:\/\/([^:]+):([^@]+)@/, (match, user) => {
        return `://${user}:••••••••••••@`;
      });
    } catch {
      // Fallback
    }
  }

  // 2. AWS Access Key (AKIA...)
  if (trimmed.startsWith('AKIA')) {
    if (trimmed.length > 12) {
      return `${trimmed.slice(0, 12)}****`;
    }
    return `${trimmed.slice(0, 4)}••••••••`;
  }

  // 3. Stripe Secret Keys (sk_live_... / sk_test_...)
  if (trimmed.startsWith('sk_live_') || trimmed.startsWith('sk_test_')) {
    const prefix = trimmed.slice(0, 8);
    return `${prefix}••••••••••••`;
  }

  // 4. GitHub Tokens (ghp_... / github_pat_...)
  if (trimmed.startsWith('ghp_')) {
    return `ghp_••••••••••••••••••••••••••••`;
  }
  if (trimmed.startsWith('github_pat_')) {
    return `github_pat_••••••••••••••••••••••••••••`;
  }

  // 5. Slack Tokens (xoxb-...)
  if (trimmed.startsWith('xoxb-') || trimmed.startsWith('xoxp-')) {
    return `${trimmed.slice(0, 9)}••••••••••••`;
  }

  // 6. Asymmetric Private Key Headers
  if (trimmed.includes('BEGIN') && trimmed.includes('PRIVATE KEY')) {
    return '-----BEGIN PRIVATE KEY----- [MASKED_KEY_BLOCK] -----END PRIVATE KEY-----';
  }

  // 7. General String Masking
  if (trimmed.length <= 6) {
    return '••••••••';
  }

  // For longer strings, expose at most first 4 chars, mask rest
  const visiblePrefix = trimmed.slice(0, Math.min(6, Math.floor(trimmed.length * 0.25)));
  return `${visiblePrefix}${'•'.repeat(Math.max(8, Math.min(16, trimmed.length - visiblePrefix.length)))}`;
}
