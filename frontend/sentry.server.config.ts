import * as Sentry from '@sentry/nextjs';

/**
 * Server-Side Sentry Configuration — Secretless Code
 * Free Tier limits: 5,000 errors/month [verify]
 * Zero-PII Policy: sendDefaultPii is strictly FALSE.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  },
});
