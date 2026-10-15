import React from 'react';
import styles from './styleTile.module.css';

export default function StyleTilePage() {
  const swatches = [
    { name: '--color-background', hex: '#121316', role: 'Global canvas ground', contrast: '12.6:1 on Ink' },
    { name: '--color-surface', hex: '#1A1C20', role: 'Spec cards, inputs, panels', contrast: '11.4:1 on Ink' },
    { name: '--color-ink', hex: '#E6E7E9', role: 'Primary text, labels, active code', contrast: 'AAA pass' },
    { name: '--color-muted-ink', hex: '#9A9EA6', role: 'Secondary body, timestamps, meta', contrast: '6.0:1 on Surface (AA)' },
    { name: '--color-rule', hex: '#2C2F35', role: '1px hairline dividers and borders', contrast: 'Structural boundary' },
    { name: '--color-signal', hex: '#E0A93B', role: 'Amber highlight (signature only)', contrast: '7.8:1 on Surface (AAA)' },
  ];

  const typeRoles = [
    { role: 'Micro-tag', font: 'JetBrains Mono 500', size: '11px', leading: '1.3', tracking: '+0.06em', sample: 'SPEC // REPO-SCANNER-01 [GITLEAKS v8.18]' },
    { role: 'Caption / Label', font: 'JetBrains Mono 400', size: '13px', leading: '1.4', tracking: '+0.02em', sample: 'TARGET REPOSITORY URL (PUBLIC REPOS ONLY)' },
    { role: 'Code / Data', font: 'JetBrains Mono 400', size: '14px', leading: '1.5', tracking: '0.00em', sample: '$ git-filter-repo --invert-paths --path backend/.env --force' },
    { role: 'Body', font: 'Schibsted Grotesk 400', size: '16px', leading: '1.6', tracking: '-0.01em', sample: 'Secretless Code clones repositories into an ephemeral RAM-disk buffer and purges commit trees.' },
    { role: 'Body Lead', font: 'Schibsted Grotesk 400', size: '20px', leading: '1.5', tracking: '-0.015em', sample: 'Calm, zero-retention secret scanner built for engineering teams.' },
    { role: 'Section Title', font: 'Schibsted Grotesk 600', size: '25px', leading: '1.25', tracking: '-0.02em', sample: 'Step-by-step credential revocation and history purge.' },
    { role: 'Panel Title', font: 'Schibsted Grotesk 600', size: '31px', leading: '1.2', tracking: '-0.025em', sample: 'Live scan specimen [RAM buffer]' },
    { role: 'Display', font: 'Schibsted Grotesk 600', size: 'clamp(36px, 4.5vw, 48px)', leading: '1.1', tracking: '-0.035em', sample: 'Find leaked API keys in Git before they are exploited.' },
  ];

  const spacingBlocks = [
    { token: '--space-1', value: '4px' },
    { token: '--space-2', value: '8px' },
    { token: '--space-3', value: '12px' },
    { token: '--space-4', value: '16px' },
    { token: '--space-6', value: '24px' },
    { token: '--space-8', value: '32px' },
    { token: '--space-12', value: '48px' },
    { token: '--space-16', value: '64px' },
    { token: '--space-24', value: '96px' },
  ];

  const motionTokens = [
    { token: '--duration-fast', ms: '120ms', usage: 'Micro-interactions (hover, focus, copy tooltip)' },
    { token: '--duration-base', ms: '240ms', usage: 'State transitions, tab switches, drawer expand' },
    { token: '--duration-slow', ms: '480ms', usage: 'Scan step progress advancement, log line insertions' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.tag}>DESIGN SPEC // TOKEN AUDIT</div>
        <h1 className={styles.title}>Secretless Code Style Tile</h1>
        <p className={styles.subtitle}>
          Instrument panel & spec sheet on precision minimal. All elements render strictly from <code>styles/tokens.css</code>.
        </p>
      </header>

      {/* 1. Color Swatches */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>1. Color Palette & Contrast Audit</h2>
        <div className={styles.swatchGrid}>
          {swatches.map((s) => (
            <div key={s.name} className={styles.swatchCard}>
              <div className={styles.swatchColor} style={{ backgroundColor: `var(${s.name})` }} />
              <div className={styles.swatchMeta}>
                <span className={styles.swatchName}>{s.name}</span>
                <span className={styles.swatchHex}>{s.hex}</span>
                <span className={styles.swatchRole}>{s.role}</span>
                <span className={styles.swatchContrast}>Contrast: {s.contrast}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Type Scale */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>2. Typography Scale (Schibsted Grotesk & JetBrains Mono)</h2>
        <div className={styles.typeList}>
          {typeRoles.map((t, idx) => (
            <div key={idx} className={styles.typeRow}>
              <div className={styles.typeSpec}>
                <span className={styles.typeRole}>{t.role}</span>
                <span className={styles.typeDetails}>{t.font} · {t.size}</span>
              </div>
              <div className={styles[`typeSample_${idx}`] || styles.typeSample}>
                {t.sample}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Spacing Scale */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>3. Spacing Scale (4px Base Increments)</h2>
        <div className={styles.spaceList}>
          {spacingBlocks.map((sp) => (
            <div key={sp.token} className={styles.spaceRow}>
              <span className={styles.spaceLabel}>{sp.token} ({sp.value})</span>
              <div className={styles.spaceBar} style={{ width: `var(${sp.token})` }} />
            </div>
          ))}
        </div>
      </section>

      {/* 4. Motion & Transitions */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>4. Motion & Easing Curves</h2>
        <div className={styles.motionGrid}>
          {motionTokens.map((m) => (
            <div key={m.token} className={styles.motionCard}>
              <span className={styles.motionToken}>{m.token} ({m.ms})</span>
              <p className={styles.motionUsage}>{m.usage}</p>
              <div className={styles.motionTrack}>
                <div
                  className={styles.motionIndicator}
                  style={{ transitionDuration: `var(${m.token})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Signature Specimen: Redaction & Signal Amber */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>5. Signature Element Specimen (Single Signal Color Rule)</h2>
        <div className={styles.specimenCard}>
          <div className={styles.specimenHeader}>
            <span>SCAN RESULT // LOG 00:03</span>
            <span>STATUS: 2 SECRETS FOUND</span>
          </div>
          <div className={styles.findingRow}>
            <span className={styles.findingProvider}>[AWS IAM]</span>
            <span className={styles.findingMasked}>
              AKIA<span className={styles.redactedToken}>••••••••••••••••</span>3821
            </span>
            <span className={styles.findingLoc}>backend/.env:42</span>
          </div>
          <div className={styles.findingRow}>
            <span className={styles.findingProvider}>[STRIPE API]</span>
            <span className={styles.findingMasked}>
              sk_live_<span className={styles.redactedToken}>••••••••••••••••</span>8912
            </span>
            <span className={styles.findingLoc}>src/config/stripe.ts:14</span>
          </div>
          <div className={styles.specimenNote}>
            Note: The amber highlight underline (`--color-signal`: #E0A93B) appears strictly underneath the detected credential specimen.
          </div>
        </div>
      </section>
    </div>
  );
}
