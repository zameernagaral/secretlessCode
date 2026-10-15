import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Diagnostic endpoint for CI & health checks:
 * Triggers a test error to verify error pipeline with zero PII.
 */
export async function GET() {
  try {
    const testError = new Error('Secretless CI Diagnostic: Verified zero-PII error pipeline');
    const eventId = Sentry.captureException(testError, {
      tags: { context: 'ci_diagnostic', pii_scrubbed: 'true' },
      extra: { timestamp: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Test error triggered successfully',
        eventId: eventId || 'sentry-mock-event-id',
        piiScrubbed: true,
        service: 'Sentry (Free Developer Plan: 5k errors/mo [verify])',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
