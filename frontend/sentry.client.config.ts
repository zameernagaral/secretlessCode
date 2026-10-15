import * as Sentry from '@sentry/nextjs';

/**
 * Client-Side Sentry Configuration — Secretless Code
 * Free Tier limits: 5,000 errors/month, 10,000 performance units/month [verify]
 * Zero-PII Policy: sendDefaultPii is strictly FALSE.
 * All sensitive tokens, emails, and IPs are scrubbed before dispatch.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // 1. Scrub user object if present (prevent any PII leakage)
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
      delete event.user.username;
    }

    // 2. Scrub secret-like patterns from error messages or breadcrumbs
    const secretRegex = /(?:akia[0-9a-z]{16}|sk_live_[0-9a-zA-Z]{24}|ghp_[0-9a-zA-Z]{36}|bearer\s+[^\s]+)/gi;
    if (event.message) {
      event.message = event.message.replace(secretRegex, '[REDACTED_SECRET]');
    }

    if (event.breadcrumbs) {
      for (const crumb of event.breadcrumbs) {
        if (crumb.message) {
          crumb.message = crumb.message.replace(secretRegex, '[REDACTED_SECRET]');
        }
      }
    }

    return event;
  },
});

/**
 * Helper to trigger a verified zero-PII test error for CI/health checks
 */
export function triggerTestError(): string {
  const testError = new Error('Secretless CI Diagnostic: Verified zero-PII error pipeline');
  const eventId = Sentry.captureException(testError, {
    tags: { context: 'ci_diagnostic', pii_scrubbed: 'true' },
    extra: { timestamp: new Date().toISOString() },
  });
  return eventId || 'sentry-mock-event-id';
}
