import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <section
        aria-labelledby="not-found-title"
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--color-surface)',
          border: 'var(--border-rule)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-micro)',
            letterSpacing: 'var(--tracking-micro)',
            color: 'var(--color-muted-ink)',
            marginBottom: 'var(--space-4)',
            textTransform: 'uppercase',
          }}
        >
          404 // COMMIT_TREE_EMPTY
        </p>

        <h1
          id="not-found-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-heading-sm)',
            lineHeight: 'var(--leading-heading-sm)',
            letterSpacing: 'var(--tracking-heading-sm)',
            color: 'var(--color-ink)',
            marginBottom: 'var(--space-4)',
            textWrap: 'balance',
          }}
        >
          Secret not found. The requested page or ephemeral report does not exist or expired.
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-body)',
            lineHeight: 'var(--leading-body)',
            color: 'var(--color-muted-ink)',
            marginBottom: 'var(--space-8)',
            maxWidth: '65ch',
          }}
        >
          The requested endpoint or scan report does not exist or expired under our 1-hour
          zero-retention ephemeral policy.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'var(--color-ink)',
              color: 'var(--color-background)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-caption)',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              transition: 'background var(--duration-fast) var(--ease-mechanical)',
            }}
          >
            Return to scanner
          </Link>

          <Link
            href="/#zero-retention-spec"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'transparent',
              color: 'var(--color-ink)',
              border: 'var(--border-rule)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-caption)',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              transition: 'all var(--duration-fast) var(--ease-mechanical)',
            }}
          >
            Zero-retention architecture
          </Link>
        </div>
      </section>
    </main>
  );
}
