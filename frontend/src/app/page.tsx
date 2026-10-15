import React from 'react';

export default function Home() {
  return (
    <>
      {/* ── Accessible Skip Link ── */}
      <a href="#main-content">Skip to content</a>

      {/* ── 1. Global Navigation Bar ── */}
      <header>
        <a href="/">
          <img
            src="/icon.svg"
            alt="Secretless Code emblem"
            width={24}
            height={24}
          />
          <span>Secretless Code</span>
        </a>

        <nav aria-label="Primary navigation">
          <ul>
            <li>
              <a href="#how-it-works">How it works</a>
            </li>
            <li>
              <a href="#remediation">Remediation</a>
            </li>
            <li>
              <a href="#pricing">Pricing</a>
            </li>
            <li>
              <button type="button">Sign in</button>
            </li>
            <li>
              <a href="#live-scan-console">Scan repository</a>
            </li>
          </ul>
        </nav>
      </header>

      {/* ── Main Landmark ── */}
      <main id="main-content">
        {/* ── 2. Hero Section ── */}
        <section id="how-it-works" aria-labelledby="hero-title">
          <p>SPEC // GITLEAKS ENGINE v8</p>
          <h1 id="hero-title">
            Find leaked API keys in Git before they are exploited.
          </h1>
          <p>
            Secretless Code clones public repositories into an isolated memory
            buffer, runs 140+ Gitleaks detection rules, and prints the exact
            terminal commands to revoke and purge them from git history.
          </p>

          <ul>
            <li>Ephemeral RAM-disk clone — code deleted immediately after scan</li>
            <li>No registration required for public repositories</li>
            <li>
              Average scan duration under [NEEDS FACT: benchmark seconds]s
            </li>
          </ul>

          <a href="#zero-retention-spec">
            View zero-retention architecture specification
          </a>
        </section>

        {/* ── 3. Signature Element: Instant Sample & Real URL Scanner ── */}
        <section id="live-scan-console" aria-labelledby="scanner-heading">
          <h2 id="scanner-heading">Live scan console [RAM buffer]</h2>

          <form action="#" method="post">
            <label htmlFor="target-input">Target repository URL</label>
            <input
              id="target-input"
              name="repoUrl"
              type="url"
              placeholder="https://github.com/organization/repository"
              required
            />
            <button type="submit">Scan target</button>
            <button type="button">
              Or scan sample vulnerable repository (10s)
            </button>
          </form>

          <section aria-labelledby="terminal-logs-heading">
            <h3 id="terminal-logs-heading">Scan logs</h3>
            <output aria-live="polite">
              <pre><code>[00:01] Fetching shallow commit tree (depth 1)...</code></pre>
              <pre><code>[00:02] Running Gitleaks rule evaluation (140 signatures)...</code></pre>
              <pre><code>[00:03] Scan finished. 3 committed secrets detected.</code></pre>
            </output>
          </section>

          <section aria-labelledby="findings-heading">
            <h3 id="findings-heading">Findings</h3>
            <ol>
              <li>
                <h4>AWS Access Key ID</h4>
                <code>AKIA••••••••••••••••3821</code>
                <p>backend/.env:42</p>
                <a
                  href="https://console.aws.amazon.com/iam"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Revoke token at AWS
                </a>
                <button type="button">Copy git-filter-repo command</button>
              </li>
              <li>
                <h4>Stripe Live Secret Key</h4>
                <code>sk_live_••••••••••••••••8912</code>
                <p>src/config/stripe.ts:14</p>
              </li>
            </ol>
          </section>

          <section aria-labelledby="clean-scan-heading">
            <h3 id="clean-scan-heading">Zero exposed secrets detected.</h3>
            <p>
              Scanned commit tree passed all Gitleaks pattern evaluations.
            </p>
            <button type="button">Download audit report (SARIF)</button>
          </section>
        </section>

        {/* ── 4. Remediation Guide Specification ── */}
        <section id="remediation" aria-labelledby="remediation-heading">
          <h2 id="remediation-heading">
            Step-by-step credential revocation and history purge.
          </h2>
          <p>
            Deleting a secret in a new commit leaves it visible in Git history.
            Follow these two steps to rotate credentials and scrub past commit
            trees.
          </p>

          <nav aria-label="Remediation providers">
            <ul>
              <li>
                <button type="button" aria-current="true">
                  AWS IAM
                </button>
              </li>
              <li>
                <button type="button" aria-current="false">
                  Stripe
                </button>
              </li>
              <li>
                <button type="button" aria-current="false">
                  GitHub PAT
                </button>
              </li>
              <li>
                <button type="button" aria-current="false">
                  OpenAI
                </button>
              </li>
              <li>
                <button type="button" aria-current="false">
                  MongoDB URI
                </button>
              </li>
              <li>
                <button type="button" aria-current="false">
                  SSH private key
                </button>
              </li>
            </ul>
          </nav>

          <article aria-labelledby="step-1-heading">
            <h3 id="step-1-heading">Step 1: Revoke the token immediately</h3>
            <p>
              Open your provider dashboard, deactivate the exposed credential
              ID, and generate a new key pair with updated environment
              variables.
            </p>
          </article>

          <article aria-labelledby="step-2-heading">
            <h3 id="step-2-heading">
              Step 2: Scrub commit history using git-filter-repo
            </h3>
            <pre><code>git-filter-repo --invert-paths --path backend/.env --force</code></pre>
            <button type="button">Copy command</button>
            <p role="status">Command copied to clipboard</p>
            <p>
              Rewriting commit history alters commit hashes. Coordinate with your
              team before pushing with --force.
            </p>
          </article>
        </section>

        {/* ── 5. Tiers & Pricing Specification ── */}
        <section id="pricing" aria-labelledby="pricing-heading">
          <h2 id="pricing-heading">Transparent capacity tiers.</h2>

          <form action="#">
            <label>
              <input type="checkbox" name="annual" />
              <span>Billed annually (save 20%)</span>
            </label>
          </form>

          <section aria-labelledby="tier-free-heading">
            <h3 id="tier-free-heading">Free</h3>
            <p>$0</p>
            <p>For public repository triage.</p>
            <ul>
              <li>Unlimited public repository scans</li>
              <li>Anonymous instant execution</li>
              <li>Rate limit: 3 scans per 15 minutes</li>
            </ul>
            <button type="button">Scan repository</button>
          </section>

          <section aria-labelledby="tier-pro-heading">
            <h3 id="tier-pro-heading">Pro</h3>
            <p>$29 / month</p>
            <p>$23 / month</p>
            <p>For independent engineers shipping daily.</p>
            <ul>
              <li>Includes all Free features</li>
              <li>Private repository scanning via GitHub OAuth</li>
              <li>Persistent scan history saved in Supabase</li>
              <li>Email notifications via Resend on scan completion</li>
            </ul>
            <button type="button">Start 14-day trial</button>
          </section>

          <section aria-labelledby="tier-team-heading">
            <h3 id="tier-team-heading">Team</h3>
            <p>From $99 / month</p>
            <p>For engineering organizations.</p>
            <ul>
              <li>Up to 10 team seats with role-based access</li>
              <li>Dedicated scanner container on Render / Railway</li>
              <li>Custom regex pattern definitions</li>
            </ul>
            <button type="button">Contact sales</button>
          </section>
        </section>

        {/* ── 6. Error & Failure State Messages Specimen ── */}
        <section id="error-states" aria-labelledby="error-states-heading">
          <h2 id="error-states-heading">
            Exact error and failure state specifications
          </h2>
          <ul>
            <li>
              <p role="alert">
                Please enter a valid public Git repository URL (e.g.,
                https://github.com/owner/repo).
              </p>
            </li>
            <li>
              <p role="alert">
                Repository not found or private. Anonymous scans only support
                public repositories.
              </p>
            </li>
            <li>
              <p role="alert">
                Anonymous scan limit reached (3 scans per 15 minutes). Wait 15
                minutes or sign in to continue.
              </p>
            </li>
            <li>
              <p role="alert">
                The scan timed out. The repository exceeds the ephemeral limit
                (max 50MB / 1,000 commits).
              </p>
            </li>
            <li>
              <p role="alert">
                Unable to load demo scan data. Please check your network
                connection and retry.
              </p>
            </li>
            <li>
              <p role="alert">
                Unable to access clipboard automatically. Please copy the
                commands manually.
              </p>
            </li>
            <li>
              <p role="alert">
                You are offline. Showing cached remediation guide.
              </p>
            </li>
            <li>
              <p role="alert">
                Notification email could not be sent. Your scan results remain
                available in your dashboard.
              </p>
            </li>
            <li>
              <p role="alert">
                Secret not found. The requested page or ephemeral report does not
                exist or expired.
              </p>
            </li>
          </ul>
        </section>

        {/* ── Architecture Specification Drawer / Reference ── */}
        <aside id="zero-retention-spec" aria-labelledby="zero-retention-heading">
          <h2 id="zero-retention-heading">
            Zero-retention architecture specification
          </h2>
          <p>
            Ephemeral RAM-disk clone — code deleted immediately after scan. No
            registration required for public repositories.
          </p>
        </aside>
      </main>

      {/* ── 7. Global Footer ── */}
      <footer>
        <p>Secretless Code</p>
        <p>
          © [NEEDS FACT: current year] Secretless Code. Ephemeral credential
          security.
        </p>

        <nav aria-label="Footer navigation">
          <ul>
            <li>
              <a href="#zero-retention-spec">Zero-retention architecture</a>
            </li>
            <li>
              <a href="#terms">Terms of service</a>
            </li>
            <li>
              <a href="#privacy">Privacy policy</a>
            </li>
            <li>
              <a href="https://github.com/zameernagaral/secretlessCode">
                GitHub repository
              </a>
            </li>
          </ul>
        </nav>
      </footer>
    </>
  );
}
