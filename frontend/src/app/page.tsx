'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './page.module.css';
import SignatureConsole from '../components/SignatureConsole';
import AuthModal from '../components/AuthModal';

type ProviderKey = 'aws' | 'stripe' | 'github' | 'openai' | 'mongodb' | 'ssh';

interface ProviderSpec {
  name: string;
  step1: string;
  step2Command: string;
}

const PROVIDERS: Record<ProviderKey, ProviderSpec> = {
  aws: {
    name: 'AWS IAM',
    step1:
      'Open your provider dashboard, deactivate the exposed credential ID, and generate a new key pair with updated environment variables.',
    step2Command:
      'git-filter-repo --invert-paths --path backend/.env --force',
  },
  stripe: {
    name: 'Stripe',
    step1:
      'Open your provider dashboard, deactivate the exposed credential ID, and generate a new key pair with updated environment variables.',
    step2Command:
      'git-filter-repo --invert-paths --path src/config/stripe.ts --force',
  },
  github: {
    name: 'GitHub PAT',
    step1:
      'Open your provider dashboard, deactivate the exposed credential ID, and generate a new key pair with updated environment variables.',
    step2Command:
      'git-filter-repo --invert-paths --path .github/workflows --force',
  },
  openai: {
    name: 'OpenAI',
    step1:
      'Open your provider dashboard, deactivate the exposed credential ID, and generate a new key pair with updated environment variables.',
    step2Command:
      'git-filter-repo --invert-paths --path .env.production --force',
  },
  mongodb: {
    name: 'MongoDB URI',
    step1:
      'Open your provider dashboard, deactivate the exposed credential ID, and generate a new key pair with updated environment variables.',
    step2Command:
      'git-filter-repo --invert-paths --path server/db.js --force',
  },
  ssh: {
    name: 'SSH private key',
    step1:
      'Open your provider dashboard, deactivate the exposed credential ID, and generate a new key pair with updated environment variables.',
    step2Command:
      'git-filter-repo --invert-paths --path id_rsa --force',
  },
};

const MECHANICAL_EASE = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const [activeProvider, setActiveProvider] = useState<ProviderKey>('aws');
  const [isAnnual, setIsAnnual] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const stored = localStorage.getItem('secretless_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const scrollToScanner = () => {
    const input = document.getElementById('target-input');
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    }
  };

  const handleCopy = (cmd: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <>
      {/* ── Accessible Skip Link ── */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>

      {/* ── 1. Global Navigation Bar ── */}
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <a href="/" className={styles.brandLink}>
            <img
              src="/icon.svg"
              alt="Secretless Code emblem"
              width={24}
              height={24}
            />
            <span>Secretless Code</span>
          </a>

          <nav aria-label="Primary navigation">
            <ul className={styles.navList}>
              <li>
                <a href="#how-it-works" className={styles.navLink}>
                  How it works
                </a>
              </li>
              <li>
                <a href="#remediation" className={styles.navLink}>
                  Remediation
                </a>
              </li>
              <li>
                <a href="#pricing" className={styles.navLink}>
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/dashboard" className={styles.navLink}>
                  Dashboard
                </Link>
              </li>
            </ul>
          </nav>

          <ul className={styles.navActions}>
            <li>
              {currentUser ? (
                <Link href="/dashboard" className={styles.authBtn}>
                  {currentUser.name}
                </Link>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
                  transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
                  className={styles.authBtn}
                >
                  Sign in
                </motion.button>
              )}
            </li>
            <li>
              <motion.button
                type="button"
                onClick={scrollToScanner}
                whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
                transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
                className={styles.primaryCta}
              >
                Scan repository
              </motion.button>
            </li>
          </ul>
        </div>
      </header>

      {/* ── Main Landmark ── */}
      <main id="main-content">
        {/* ── 2. Hero Section ── */}
        <section id="how-it-works" className={styles.heroSection}>
          <div className={`${styles.container} ${styles.heroGrid}`}>
            {/* Left 5 Columns on Desktop (500px) */}
            <div className={styles.heroContent}>
              <p className={styles.specTag}>SPEC // GITLEAKS ENGINE v8</p>
              <h1 id="hero-title" className={styles.heroTitle}>
                Find leaked API keys in Git before they are exploited.
              </h1>
              <p className={styles.heroLead}>
                Secretless Code clones public repositories into an isolated
                memory buffer, runs 140+ Gitleaks detection rules, and prints
                the exact terminal commands to revoke and purge them from git
                history.
              </p>

              <ul className={styles.trustList}>
                <li className={styles.trustItem}>
                  Ephemeral RAM-disk clone — code deleted immediately after scan
                </li>
                <li className={styles.trustItem}>
                  No registration required for public repositories
                </li>
                <li className={styles.trustItem}>
                  Average scan duration under [NEEDS FACT: benchmark seconds]s
                </li>
              </ul>

              <a href="#zero-retention-spec" className={styles.trustLink}>
                <span>View zero-retention architecture specification</span>
                <span className={styles.trustLinkArrow} aria-hidden="true">
                  &rarr;
                </span>
              </a>
            </div>

            {/* Right 7 Columns on Desktop (680px) — Encapsulated Signature Component */}
            <div className={styles.signatureWrapper}>
              <SignatureConsole />
            </div>
          </div>
        </section>

        {/* ── 4. Feature 2: Remediation Guide Specification ── */}
        <section id="remediation" aria-labelledby="remediation-heading" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 id="remediation-heading" className={styles.sectionTitle}>
                Step-by-step credential revocation and history purge.
              </h2>
              <p className={styles.sectionLead}>
                Deleting a secret in a new commit leaves it visible in Git
                history. Follow these two steps to rotate credentials and scrub
                past commit trees.
              </p>
            </div>

            <nav aria-label="Remediation providers" className={styles.tabScrollWrapper}>
              <ul className={styles.tabList}>
                {(['aws', 'stripe', 'github', 'openai', 'mongodb', 'ssh'] as ProviderKey[]).map(
                  (key) => (
                    <li key={key}>
                      <motion.button
                        type="button"
                        aria-current={activeProvider === key ? 'true' : 'false'}
                        onClick={() => setActiveProvider(key)}
                        whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
                        transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
                        className={`${styles.tabBtn} ${
                          activeProvider === key ? styles.tabBtnActive : ''
                        }`}
                      >
                        {PROVIDERS[key].name}
                      </motion.button>
                    </li>
                  )
                )}
              </ul>
            </nav>

            {/* Row 3: Remediation Provider Step Panel Switch */}
            <div className={styles.remediationPanel}>
              <motion.article
                key={`step1-${activeProvider}`}
                aria-labelledby="step-1-heading"
                initial={{ opacity: 0.4, y: shouldReduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: MECHANICAL_EASE }}
                className={styles.stepCard}
              >
                <h3 id="step-1-heading" className={styles.stepTitle}>
                  Step 1: Revoke the token immediately
                </h3>
                <p className={styles.stepBody}>{PROVIDERS[activeProvider].step1}</p>
              </motion.article>

              <motion.article
                key={`step2-${activeProvider}`}
                aria-labelledby="step-2-heading"
                initial={{ opacity: 0.4, y: shouldReduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: MECHANICAL_EASE }}
                className={styles.stepCard}
              >
                <h3 id="step-2-heading" className={styles.stepTitle}>
                  Step 2: Scrub commit history using git-filter-repo
                </h3>
                <pre className={styles.codeBlock} tabIndex={0} aria-label="Git scrubbing command">
                  <code>{PROVIDERS[activeProvider].step2Command}</code>
                </pre>
                <div className={styles.copyRow}>
                  {/* Row 6: Hardware switch tactile press */}
                  <motion.button
                    type="button"
                    onClick={() => handleCopy(PROVIDERS[activeProvider].step2Command)}
                    whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
                    transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
                    className={styles.copyBtn}
                  >
                    Copy command
                  </motion.button>
                  {/* Row 4: Clipboard copy feedback */}
                  {copiedText && (
                    <motion.p
                      role="status"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0.01 : 0.12, ease: MECHANICAL_EASE }}
                      className={styles.copyStatus}
                    >
                      Command copied to clipboard
                    </motion.p>
                  )}
                </div>
                <p className={styles.warningCallout}>
                  Rewriting commit history alters commit hashes. Coordinate with your
                  team before pushing with --force.
                </p>
              </motion.article>
            </div>
          </div>
        </section>

        {/* ── 5. Feature 3: Pricing Specification ── */}
        <section id="pricing" aria-labelledby="pricing-heading" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 id="pricing-heading" className={styles.sectionTitle}>
                Transparent capacity tiers.
              </h2>

              <label className={styles.pricingToggleGroup}>
                <input
                  type="checkbox"
                  name="annual"
                  checked={isAnnual}
                  onChange={(e) => setIsAnnual(e.target.checked)}
                  className={styles.pricingToggleInput}
                />
                <span>Billed annually (save 20%)</span>
              </label>
            </div>

            <div className={styles.pricingGrid}>
              {/* Free Tier */}
              <section aria-labelledby="tier-free-heading" className={styles.pricingCard}>
                <div>
                  <div className={styles.tierHeader}>
                    <h3 id="tier-free-heading" className={styles.tierName}>
                      Free
                    </h3>
                    <p className={styles.tierPrice}>$0</p>
                    <p className={styles.tierSubtitle}>For public repository triage.</p>
                  </div>
                  <ul className={styles.tierFeatureList}>
                    <li className={styles.tierFeatureItem}>
                      Unlimited public repository scans
                    </li>
                    <li className={styles.tierFeatureItem}>
                      Anonymous instant execution
                    </li>
                    <li className={styles.tierFeatureItem}>
                      Rate limit: 3 scans per 15 minutes
                    </li>
                  </ul>
                </div>
                <motion.button
                  type="button"
                  onClick={scrollToScanner}
                  whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
                  transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
                  className={styles.tierBtn}
                >
                  Scan repository
                </motion.button>
              </section>

              {/* Pro Tier */}
              <section
                aria-labelledby="tier-pro-heading"
                className={`${styles.pricingCard} ${styles.pricingCardPro}`}
              >
                <div>
                  <div className={styles.tierHeader}>
                    <h3 id="tier-pro-heading" className={styles.tierName}>
                      Pro
                    </h3>
                    {/* Row 5: Pricing Annual Toggle Recalculation */}
                    <motion.p
                      key={isAnnual ? 'annual' : 'monthly'}
                      initial={{ opacity: 0.5, y: shouldReduceMotion ? 0 : -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0.01 : 0.12, ease: MECHANICAL_EASE }}
                      className={styles.tierPrice}
                    >
                      {isAnnual ? '$23 / month' : '$29 / month'}
                    </motion.p>
                    <p className={styles.tierSubtitle}>
                      For independent engineers shipping daily.
                    </p>
                  </div>
                  <ul className={styles.tierFeatureList}>
                    <li className={styles.tierFeatureItem}>Includes all Free features</li>
                    <li className={styles.tierFeatureItem}>
                      Private repository scanning via GitHub OAuth
                    </li>
                    <li className={styles.tierFeatureItem}>
                      Persistent scan history saved in Supabase
                    </li>
                    <li className={styles.tierFeatureItem}>
                      Email notifications via Resend on scan completion
                    </li>
                  </ul>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
                  transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
                  className={`${styles.tierBtn} ${styles.tierBtnPro}`}
                >
                  Start 14-day trial
                </motion.button>
              </section>

              {/* Team Tier */}
              <section aria-labelledby="tier-team-heading" className={styles.pricingCard}>
                <div>
                  <div className={styles.tierHeader}>
                    <h3 id="tier-team-heading" className={styles.tierName}>
                      Team
                    </h3>
                    <p className={styles.tierPrice}>From $99 / month</p>
                    <p className={styles.tierSubtitle}>For engineering organizations.</p>
                  </div>
                  <ul className={styles.tierFeatureList}>
                    <li className={styles.tierFeatureItem}>
                      Up to 10 team seats with role-based access
                    </li>
                    <li className={styles.tierFeatureItem}>
                      Dedicated scanner container on Render / Railway
                    </li>
                    <li className={styles.tierFeatureItem}>
                      Custom regex pattern definitions
                    </li>
                  </ul>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
                  transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
                  className={styles.tierBtn}
                >
                  Contact sales
                </motion.button>
              </section>
            </div>
          </div>
        </section>

        {/* ── 6. Error & Failure States Specimen ── */}
        <section id="error-states" aria-labelledby="error-states-heading" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 id="error-states-heading" className={styles.sectionTitle}>
                Exact error and failure state specifications
              </h2>
            </div>
            <ul className={styles.alertList}>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>INVALID_URL // 400</span>
                <p role="alert" className={styles.alertMessage}>
                  Please enter a valid public Git repository URL (e.g.,
                  https://github.com/owner/repo).
                </p>
              </li>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>REPO_UNAVAILABLE // 404</span>
                <p role="alert" className={styles.alertMessage}>
                  Repository not found or private. Anonymous scans only support
                  public repositories.
                </p>
              </li>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>RATE_LIMIT // 429</span>
                <p role="alert" className={styles.alertMessage}>
                  Anonymous scan limit reached (3 scans per 15 minutes). Wait 15
                  minutes or sign in to continue.
                </p>
              </li>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>TIMEOUT // 504</span>
                <p role="alert" className={styles.alertMessage}>
                  The scan timed out. The repository exceeds the ephemeral limit
                  (max 50MB / 1,000 commits).
                </p>
              </li>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>DEMO_FIXTURE_ERROR</span>
                <p role="alert" className={styles.alertMessage}>
                  Unable to load demo scan data. Please check your network
                  connection and retry.
                </p>
              </li>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>CLIPBOARD_PERMISSION</span>
                <p role="alert" className={styles.alertMessage}>
                  Unable to access clipboard automatically. Please copy the
                  commands manually.
                </p>
              </li>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>NETWORK_OFFLINE</span>
                <p role="alert" className={styles.alertMessage}>
                  You are offline. Showing cached remediation guide.
                </p>
              </li>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>DISPATCH_FAILED</span>
                <p role="alert" className={styles.alertMessage}>
                  Notification email could not be sent. Your scan results remain
                  available in your dashboard.
                </p>
              </li>
              <li className={styles.alertItem}>
                <span className={styles.alertCode}>SECRET_NOT_FOUND // 404</span>
                <p role="alert" className={styles.alertMessage}>
                  Secret not found. The requested page or ephemeral report does not
                  exist or expired.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Architecture Specification Drawer ── */}
        <div className={styles.container}>
          <aside
            id="zero-retention-spec"
            aria-labelledby="zero-retention-heading"
            className={styles.architectureBox}
          >
            <h2 id="zero-retention-heading" className={styles.archTitle}>
              Zero-retention architecture specification
            </h2>
            <p className={styles.archBody}>
              Ephemeral RAM-disk clone — code deleted immediately after scan. No
              registration required for public repositories.
            </p>
          </aside>
        </div>
      </main>

      {/* ── 7. Global Footer ── */}
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div>
            <p className={styles.footerBrand}>Secretless Code</p>
            <p className={styles.footerCopyright}>
              © [NEEDS FACT: current year] Secretless Code. Ephemeral credential
              security.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className={styles.footerNavList}>
              <li>
                <a href="#zero-retention-spec" className={styles.footerLink}>
                  Zero-retention architecture
                </a>
              </li>
              <li>
                <a href="#terms" className={styles.footerLink}>
                  Terms of service
                </a>
              </li>
              <li>
                <a href="#privacy" className={styles.footerLink}>
                  Privacy policy
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/zameernagaral/secretlessCode"
                  className={styles.footerLink}
                >
                  GitHub repository
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </>
  );
}
