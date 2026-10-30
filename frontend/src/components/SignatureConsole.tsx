'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BorderTrail } from '@/components/core/border-trail';
import styles from './SignatureConsole.module.css';

interface Finding {
  type: string;
  token: string;
  location: string;
  revokeUrl?: string;
  filterCommand?: string;
}

const STATIC_FINDINGS: Finding[] = [
  {
    type: 'AWS Access Key ID',
    token: 'AKIA••••••••••••••••3821',
    location: 'backend/.env:42',
    revokeUrl: 'https://console.aws.amazon.com/iam',
    filterCommand: 'git-filter-repo --invert-paths --path backend/.env --force',
  },
  {
    type: 'Stripe Live Secret Key',
    token: 'sk_live_••••••••••••••••8912',
    location: 'src/config/stripe.ts:14',
  },
  {
    type: 'GitHub Personal Access Token',
    token: 'ghp_••••••••••••••••3631',
    location: 'scripts/deploy.sh:8',
  },
];

const MECHANICAL_EASE = [0.16, 1, 0.3, 1] as const;

export default function SignatureConsole() {
  const [targetUrl, setTargetUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'clean' | 'error'>('idle');
  const [findings, setFindings] = useState<Finding[]>(STATIC_FINDINGS);
  const [logStep, setLogStep] = useState(3); // Default 3 for static proof render
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isInViewport, setIsInViewport] = useState(false);
  const consoleRef = useRef<HTMLElement>(null);

  const shouldReduceMotion = useReducedMotion();

  // Monitor network status & viewport scroll response
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('error');
      setErrorMessage('You are offline. Showing cached remediation guide.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Scroll response: subtle viewport tracking
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && consoleRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          setIsInViewport(entry.isIntersecting);
        },
        { threshold: 0.2 }
      );
      observer.observe(consoleRef.current);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (observer) observer.disconnect();
    };
  }, []);

  const handleCopyCommand = async (cmd: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(cmd);
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const executeScan = async (url: string, isDemo = false) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('error');
      setErrorMessage('Unable to load scan data. Please check your network connection and retry.');
      return;
    }

    if (!url.trim().startsWith('http://') && !url.trim().startsWith('https://')) {
      setStatus('error');
      setErrorMessage(
        'Please enter a valid public Git repository URL (e.g., https://github.com/owner/repo).'
      );
      return;
    }

    setStatus('scanning');
    setErrorMessage('');

    if (shouldReduceMotion) {
      setLogStep(3);
    } else {
      setLogStep(1);
      setTimeout(() => setLogStep(2), 300);
      setTimeout(() => setLogStep(3), 600);
    }

    // If demo scan is clicked explicitly, load specimen findings directly after scan animation
    if (isDemo) {
      setTimeout(() => {
        setFindings(STATIC_FINDINGS);
        setStatus('complete');
      }, 1200);
      return;
    }

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:4000');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${apiUrl}/api/v1/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setStatus('error');
        setErrorMessage(
          errorData?.error?.message ||
          errorData?.message ||
          'Repository not found or private. Anonymous scans only support public repositories.'
        );
        return;
      }

      const data = await res.json();
      const rawFindings = data.data?.findings || [];
      if (rawFindings.length > 0) {
        const mapped: Finding[] = rawFindings.map((f: any) => {
          let type = f.secretType || f.description || f.ruleId || f.rule || 'Detected Secret';
          if (f.ruleId === 'database-connection-string' || (f.rawMatch && f.rawMatch.includes('mongodb'))) {
            type = 'MongoDB Connection URI';
          }
          const token = f.rawMatch || f.match || f.secret || '••••••••';
          const lineNum = f.lineNumber || f.startLine || f.line || 1;
          let cleanFilePath = (f.filePath || 'repo').trim();
          if (cleanFilePath.includes('secretless-')) {
            cleanFilePath = cleanFilePath.replace(/^.*\/secretless-(?:scan|extract|pr|upload)-[a-f0-9]+\//, '');
          }
          const location = `${cleanFilePath}:${lineNum}`;
          const filterCommand = cleanFilePath && cleanFilePath !== 'repo'
            ? `git-filter-repo --invert-paths --path ${cleanFilePath} --force`
            : undefined;
          let revokeUrl: string | undefined = undefined;
          const lower = (type + ' ' + (f.ruleId || '')).toLowerCase();
          if (lower.includes('aws')) revokeUrl = 'https://console.aws.amazon.com/iam';
          else if (lower.includes('stripe')) revokeUrl = 'https://dashboard.stripe.com/apikeys';
          else if (lower.includes('github')) revokeUrl = 'https://github.com/settings/tokens';
          else if (lower.includes('openai')) revokeUrl = 'https://platform.openai.com/api-keys';
          else if (lower.includes('mongo') || lower.includes('database')) revokeUrl = 'https://cloud.mongodb.com';
          return { type, token, location, filterCommand, revokeUrl };
        });
        setFindings(mapped);
        setStatus('complete');
      } else {
        setFindings([]);
        setStatus('clean');
      }
    } catch {
      setStatus('error');
      setErrorMessage(
        'Unable to complete scan. Please verify the repository exists, is public, and check your connection.'
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;
    executeScan(targetUrl, false);
  };

  const handleDemoClick = () => {
    const demoUrl = 'https://github.com/acme/sample-vulnerable-repo';
    setTargetUrl(demoUrl);
    executeScan(demoUrl, true);
  };

  return (
    <section
      ref={consoleRef}
      id="live-scan-console"
      aria-labelledby="scanner-heading"
      className={styles.card}
    >
      {/* ── Dynamic Border Trail: Kinetic feedback on scan & clean states ── */}
      {status === 'scanning' && !shouldReduceMotion && (
        <BorderTrail
          color="#ffffff"
          size={140}
          borderWidth={2}
          transition={{
            ease: 'linear',
            duration: 3,
            repeat: Infinity,
          }}
        />
      )}
      {status === 'clean' && !shouldReduceMotion && (
        <BorderTrail
          className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500 opacity-90"
          size={120}
          transition={{
            ease: 'linear',
            duration: 3.5,
            repeat: 2,
          }}
        />
      )}

      {/* ── Header Readout ── */}
      <div className={styles.header}>
        <h2 id="scanner-heading" className={styles.title}>
          Live scan console [RAM buffer]
        </h2>
        <span
          className={`${styles.status} ${status === 'scanning'
              ? styles.statusActive
              : status === 'error'
                ? styles.statusError
                : ''
            }`}
        >
          {status === 'scanning'
            ? '[STATUS: SCANNING_HEAD]'
            : status === 'error'
              ? '[STATUS: ERROR]'
              : status === 'clean'
                ? '[STATUS: CLEAN]'
                : isInViewport
                  ? '[STATUS: READY]'
                  : '[STATUS: READY]'}
        </span>
      </div>

      <div className={styles.body}>
        {/* ── Failure State: No JS Fallback ── */}
        <noscript>
          <div className={styles.noJsBanner}>
            JavaScript is disabled. Displaying static sample scan specimen.
          </div>
        </noscript>

        {/* ── Scan Entry Form ── */}
        <form
          action="#"
          method="post"
          onSubmit={handleFormSubmit}
          className={styles.form}
        >
          <label htmlFor="target-input" className="sr-only">
            Target repository URL
          </label>
          <div className={styles.inputRow}>
            <input
              id="target-input"
              name="repoUrl"
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://github.com/organization/repository"
              required
              disabled={status === 'scanning'}
              className={styles.input}
            />
            {/* Row 6: Hardware switch tactile press */}
            <motion.button
              type="submit"
              disabled={status === 'scanning'}
              whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
              transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
              className={styles.submitBtn}
            >
              {status === 'scanning' ? 'Evaluating...' : 'Scan target'}
            </motion.button>
          </div>

          <button
            type="button"
            onClick={handleDemoClick}
            disabled={status === 'scanning'}
            className={styles.demoBtn}
          >
            Or scan sample vulnerable repository (10s)
          </button>
        </form>

        {/* ── Failure State: Source Down / Offline / Error ── */}
        {status === 'error' && errorMessage && (
          <div className={styles.alertBox} role="alert">
            <p className={styles.alertText}>{errorMessage}</p>
            <motion.button
              type="button"
              onClick={() => executeScan(targetUrl || 'https://github.com/acme/sample-vulnerable-repo')}
              whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
              transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
              className={styles.retryBtn}
            >
              Retry
            </motion.button>
          </div>
        )}

        {/* ── Terminal Step Logs (Row 1 Animation) ── */}
        <section aria-labelledby="terminal-logs-heading">
          <h3 id="terminal-logs-heading" className={styles.terminalLabel}>
            Scan logs
          </h3>
          <output aria-live="polite" className={styles.terminalBox}>
            {logStep >= 1 && (
              <motion.pre
                initial={status === 'scanning' ? { opacity: 0, y: shouldReduceMotion ? 0 : 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.48, ease: MECHANICAL_EASE }}
                className={`${styles.terminalLine} ${styles.terminalLineActive}`}
              >
                <code>[00:01] Fetching shallow commit tree (depth 1)...</code>
              </motion.pre>
            )}
            {logStep >= 2 && (
              <motion.pre
                initial={status === 'scanning' ? { opacity: 0, y: shouldReduceMotion ? 0 : 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.48, ease: MECHANICAL_EASE }}
                className={`${styles.terminalLine} ${styles.terminalLineActive}`}
              >
                <code>[00:02] Running Gitleaks rule evaluation (140 signatures)...</code>
              </motion.pre>
            )}
            {logStep >= 3 && (
              <motion.pre
                initial={status === 'scanning' ? { opacity: 0, y: shouldReduceMotion ? 0 : 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.48, ease: MECHANICAL_EASE }}
                className={`${styles.terminalLine} ${styles.terminalLineActive}`}
              >
                <code>
                  [00:03] Scan finished. {findings.length} committed secret{findings.length === 1 ? '' : 's'} detected.
                </code>
              </motion.pre>
            )}
          </output>
        </section>

        {/* ── Findings Drawer (Row 2 Animation: Reveal) ── */}
        {status !== 'clean' && (
          <motion.section
            aria-labelledby="findings-heading"
            initial={status === 'scanning' ? { opacity: 0, y: shouldReduceMotion ? 0 : 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: MECHANICAL_EASE }}
            className={styles.findingsSection}
          >
            <h3 id="findings-heading" className={styles.findingsHeading}>
              Findings ({findings.length})
            </h3>
            <ol className={styles.findingsList}>
              {findings.map((finding, idx) => (
                <li key={`${finding.type}-${finding.location}-${idx}`} className={styles.findingCard}>
                  <div className={styles.findingHeader}>
                    <h4 className={styles.findingTitle}>{finding.type}</h4>
                    <span className={styles.findingLocation}>{finding.location}</span>
                  </div>
                  <code className={styles.findingToken}>{finding.token}</code>
                  {finding.filterCommand && (
                    <div className={styles.findingActions}>
                      {finding.revokeUrl && (
                        <a
                          href={finding.revokeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtn}
                        >
                          Revoke token
                        </a>
                      )}
                      <motion.button
                        type="button"
                        onClick={() => handleCopyCommand(finding.filterCommand!)}
                        whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
                        transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
                        className={styles.actionBtn}
                      >
                        {copiedCmd ? 'Copied' : 'Copy git-filter-repo command'}
                      </motion.button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </motion.section>
        )}

        {/* ── Clean State Specimen ── */}
        {status === 'clean' && (
          <motion.section
            aria-labelledby="clean-scan-heading"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: MECHANICAL_EASE }}
            className={styles.cleanBox}
          >
            <h3 id="clean-scan-heading" className={styles.cleanTitle}>
              Zero exposed secrets detected.
            </h3>
            <p className={styles.cleanBody}>
              Scanned commit tree passed all Gitleaks pattern evaluations.
            </p>
            <motion.button
              type="button"
              whileTap={{ y: shouldReduceMotion ? 0 : 1 }}
              transition={{ duration: 0.12, ease: MECHANICAL_EASE }}
              className={styles.cleanBtn}
            >
              Download audit report (SARIF)
            </motion.button>
          </motion.section>
        )}
      </div>
    </section>
  );
}
