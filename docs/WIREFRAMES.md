# WIREFRAMES: Secretless Code (Landing, Entry Flow & App States)

Design System: **Instrument panel / spec sheet on precision minimal**  
Tokens: Canvas `#121316`, Surface `#1A1C20`, Ink `#E6E7E9`, Muted Ink `#9A9EA6`, Rule `#2C2F35`, Signal Amber `#E0A93B` (Sample findings only).  
Fonts: `Schibsted Grotesk` (headings/body) + `JetBrains Mono` (logs/data/inputs).

---

## 1. 1440px Desktop Wireframe — Primary Layout

12-column grid (`1200px` max-width container, `48px` outer gutters, `24px` column gutters).

### Hero Section (Asymmetric 5 : 7 Columns)
```
+--------------------------------------------------------------------------------------------------------------------+
| [NAV]  SECRETLESS_CODE                    [Docs]   [Pricing]   [Security]          [Sign In]  [Scan Now] (2px border)   |  <- h: 56px, rule bottom
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|   COLUMNS 1-5 (500px)                              COLUMNS 6-12 (680px)                                            |
|                                                                                                                    |
|   TAG: SPEC // SAST-01                             +-------------------------------------------------------------+ |
|                                                    | PANEL: SCAN SPECIMEN [RAM-DISK: ISOLATED]       [STATUS: OK] | |
|   Find leaked API keys                             +-------------------------------------------------------------+ |
|   in Git before                                    | $ target > [ https://github.com/org/repo        ] [SCAN NOW] | |
|   they're exploited.                               |                                                             | |
|                                                    | [or: > SCAN A DEMO REPO (10s)]                              | |
|   Calm, zero-retention scanner.                    +-------------------------------------------------------------+ |
|   Clones into temporary RAM,                       | > [00:01] CLONING shallow branch (--depth 1)                | |
|   detects with Gitleaks,                           | > [00:02] RUNNING Gitleaks 140+ rule matrix                 | |
|   and generates exact commands                     | > [00:03] PARSED 2 leaked credentials                       | |
|   to scrub your history.                           +-------------------------------------------------------------+ |
|                                                    | [!] FINDINGS (SIGNATURE ELEMENT - ONLY USE OF AMBER SIGNAL) | |
|   [x] Zero code retention                          | +---------------------------------------------------------+ | |
|   [x] No signup required                           | | [AWS] AKIA•••••••••••••••• (L42: backend/.env)           | | |
|   [x] Under 15s scan time                          | |   >>> [E0A93B AMBER UNDERLINE ON FINDING TOKEN] <<<     | | |
|                                                    | |   [REVOKE AT AWS]     [COPY GIT-FILTER-REPO CMD]        | | |
|   [v3 TRUST BADGE > Popover]                       +-------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Visual Eye Path:**
  1. `1st`: The Scan Panel input & live terminal log box (Cols 6-12).
  2. `2nd`: Display Headline "Find leaked API keys in Git before they're exploited" (Cols 1-5).
  3. `3rd`: Amber highlighted finding in the drawer + copyable scrub action button.
- **Tokens Used:**
  - Background: `--color-background` (`#121316`)
  - Scan Panel: `--color-surface` (`#1A1C20`) with 1px border `--color-rule` (`#2C2F35`)
  - Terminal logs: `--font-jetbrains-mono` + `--color-muted-ink` (`#9A9EA6`)
  - Leaked Secret Highlight: `--color-signal` (`#E0A93B`)
- **Scroll Behavior:** Nav pins to top with solid `#121316` background; hero panel softly fades into feature comparison.

---

### Feature 2: Interactive Remediation Section (Revoke & Scrub Specification)
```
+--------------------------------------------------------------------------------------------------------------------+
| SECTION: REMEDIATION SPECIFICATION [STRETCH 12 COLUMNS]                                                             |
+--------------------------------------------------------------------------------------------------------------------+
| [01. AWS IAM]  |  [02. STRIPE API]  |  [03. GITHUB PAT]  |  [04. OPENAI]  |  [05. MONGODB URI]  |  [06. SSH KEY]     | <- 1px tabs
+--------------------------------------------------------------------------------------------------------------------+
| TAB ACTIVE: STRIPE SECRET KEY                                                                                      |
|                                                                                                                    |
| STEP 1: IMMEDIATE VENDOR REVOCATION                STEP 2: PERMANENT GIT TREE SCRUBBING                            |
| 1. Navigate to Stripe Dashboard > Developers       $ git-filter-repo --invert-paths \                              |
| 2. Roll key and set expiration to 24h grace        >   --path backend/.env --force                                 |
| 3. Replace environment variables in production     [ COPY SHELL COMMAND ]                                          |
| [ OPEN STRIPE DASHBOARD -> ]                                                                                       |
|                                                    [!] NOTE: Coordinate with team before force-pushing remote.     |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Tokens:** Panel `--color-surface`, hairlines `--color-rule`, code block `--font-jetbrains-mono`, text `--color-ink`.

---

### Feature 3: Pricing & Trust Specification Table
```
+--------------------------------------------------------------------------------------------------------------------+
| SECTION: TIERS & CAPACITY SPECIFICATION                                                  [ TOGGLE: ANNUAL (-20%) ] |
+--------------------------------------------------------------------------------------------------------------------+
| FREE / EPHEMERAL               | PRO DEVELOPER                  | TEAM / ENTERPRISE                                |
| $0 / forever                   | $29 / month                    | $99+ / month                                     |
|--------------------------------+--------------------------------+--------------------------------------------------|
| * Public Git repos             | * Public + Private Repos       | * Unlimited Team Members                         |
| * Ephemeral in-memory clone    | * Saved scan history (Supabase)| * SSO / SAML integration                         |
| * Anonymous execution          | * Resend email alert dispatch  | * Custom Gitleaks regex rules                    |
| * Rate limit: 3 scans / 15m    | * Unlimited scans              | * Dedicated isolated queue                       |
| [ RUN ANONYMOUS SCAN ]         | [ START PRO TRIAL ]            | [ CONTACT SECURITY TEAM ]                        |
+--------------------------------------------------------------------------------------------------------------------+
```

---

## 2. 390px Mobile Wireframe — Stacked & Tailored

*Mobile redesign principle: The URL scan entry stacks **first** at top so the single job is accessible instantly without scrolling.*

```
+-----------------------------------+
| [=] SECRETLESS_CODE       [SIGNIN]| <- h: 48px
+-----------------------------------+
|                                   |
| [1. SCAN ENTRY PANEL STACKS FIRST]|
| +-------------------------------+ |
| | SPEC // REPO SCANNER          | |
| | [ https://github.com/...  ]   | |
| | [ SCAN NOW ]                  | |
| | or [> SCAN A DEMO REPO (10s)] | |
| +-------------------------------+ |
| | > [00:01] CLONING HEAD...     | |
| | > [00:02] RUNNING Gitleaks    | |
| | [!] FINDING DETECTED:         | |
| | [AWS] AKIA••••••••••••••••    | |
| |   >>> [AMBER UNDERLINE] <<<   | |
| | [COPY FIX]   [REVOKE GUIDE]   | |
| +-------------------------------+ |
|                                   |
| [2. HEADLINE & VALUE PROP BELOW]  |
|                                   |
| Find leaked API keys in Git       |
| before they're exploited.         |
|                                   |
| Calm, zero-retention security.    |
| Clones to temporary RAM disk,     |
| scrubs history, never stores.     |
|                                   |
| [x] Zero code retention           |
| [x] No signup required            |
|                                   |
|-----------------------------------|
| [REMEDIATION ACCORDION]           |
| [+] 01. AWS IAM                   |
| [-] 02. STRIPE API                |
|     Step 1: Revoke dashboard      |
|     Step 2: Run git-filter-repo   |
|     [ COPY COMMAND ]              |
| [+] 03. GITHUB PAT                |
|                                   |
|-----------------------------------|
| [PRICING CARDS - STACKED]         |
| +-------------------------------+ |
| | FREE: $0                      | |
| | [ RUN INSTANT SCAN ]          | |
| +-------------------------------+ |
| | PRO: $29/mo                   | |
| | [ UPGRADE TO PRO ]            | |
| +-------------------------------+ |
|                                   |
| FOOTER: [Security] [Docs] [Terms] |
+-----------------------------------+
```
- **Mobile Eye Path:**
  1. `1st`: Mobile Scan input field and demo trigger (top of viewport).
  2. `2nd`: Amber leaked secret finding.
  3. `3rd`: Headline & trust proof bullets underneath.

---

## 3. Failure & Edge State Wireframes (All Features from `docs/FEATURES.md`)

### State 1: Invalid Repo URL Error
```
+-------------------------------------------------------------+
| $ target > [ ftp://invalid-server.com/malicious ] [SCAN NOW]|
|                                                             |
| [!] ERROR 400: INVALID_REPO_SCHEME                          |
| Please enter a valid public Git repository URL              |
| (e.g. https://github.com/owner/repository).                 |
+-------------------------------------------------------------+
```

### State 2: Private / Unreachable Repository
```
+-------------------------------------------------------------+
| $ target > [ https://github.com/acme/private-core ]         |
|                                                             |
| [x] REPO_UNAVAILABLE: 404 NOT FOUND OR PRIVATE              |
| Repository not found or private. Anonymous scans only       |
| support public repositories. Sign in to scan private repos. |
| [ SIGN IN WITH GITHUB ]                                     |
+-------------------------------------------------------------+
```

### State 3: Anonymous Rate Limit Reached
```
+-------------------------------------------------------------+
| $ target > [ https://github.com/org/project ]               |
|                                                             |
| [!] 429 RATE_LIMIT_EXCEEDED (3/3 scans used)                |
| Anonymous scan limit reached. Resets in 11 minutes.         |
| Sign in for immediate unlimited scans.                      |
| [ SIGN IN TO BYPASS ]                                       |
+-------------------------------------------------------------+
```

### State 4: Zero Leaks Clean State (Empty Findings)
```
+-------------------------------------------------------------+
| REPO SCAN COMPLETE: https://github.com/org/clean-project    |
| Scanned 342 commits in 3.4 seconds.                         |
|                                                             |
| [✓] CLEAN: ZERO EXPOSED SECRETS DETECTED                    |
| All scanned commit trees passed Gitleaks verification.      |
| [ DOWNLOAD AUDIT PROOF (PDF) ]       [ SCAN ANOTHER TARGET] |
+-------------------------------------------------------------+
```

### State 5: Custom 404 Wireframe ("Secret Not Found")
```
+--------------------------------------------------------------------+
| 404: SECRET_NOT_FOUND // COMMIT_TREE_EMPTY                         |
|                                                                    |
| The requested endpoint or scan report does not exist or expired    |
| under our 1-hour zero-retention ephemeral policy.                  |
|                                                                    |
| [ RETURN TO SCANNER ]               [ VIEW AUDIT LOGS ]            |
+--------------------------------------------------------------------+
```

---

## 4. Two Hero Alternatives (Evaluation & Comparison)

### Alternative A: Centered Monolithic Command Deck (Rejected)
- **Concept:** Hero display text centered at top (like Apple), with a single wide URL scanner card floating below it.
- **Drawback:** Pushes the terminal execution output below the fold on standard laptop screens (`800px` height) and delays the user's perception of the live scanning signature.

### Alternative B: Asymmetric Split 5:7 Instrument Console (SELECTED)
- **Concept:** Left 5 columns hold crisp Schibsted Grotesk headline and trust spec; Right 7 columns hold the live interactive terminal scanner deck and findings readout.
- **Why it wins:** Immediate 10-second proof above the fold; allows simultaneous reading of the value prop while the live scan specimen runs.
