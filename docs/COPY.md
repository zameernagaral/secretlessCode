# COPY: Secretless Code Production Copy Specification

Rules applied:
- Sentence case throughout (except standard acronyms: API, AWS, PAT, SSH, RAM, PR, CLI, TTL).
- Pure verbs over adjectives. Action labels state exact outcomes ("Scan target", "Copy command", not "Learn more").
- Zero banned words (no *passionate*, *innovative*, *seamless*, *leverage*, *crafting*, *journey*, *cutting-edge*, *building the future*).
- Exact failure messages mirrored identically from `docs/FEATURES.md`.

---

## 1. Global Navigation Bar

| Element | Copy String | Max Length | Notes |
| :--- | :--- | :--- | :--- |
| Wordmark | `Secretless Code` | 20 chars | Plain text wordmark |
| Nav Link 1 | `How it works` | 15 chars | Anchor to scan spec |
| Nav Link 2 | `Remediation` | 15 chars | Anchor to scrub guide |
| Nav Link 3 | `Pricing` | 10 chars | Anchor to pricing table |
| Secondary Button | `Sign in` | 10 chars | Opens auth modal |
| Primary Action | `Scan repository` | 16 chars | Focuses hero input |

---

## 2. Hero Section (Spec Deck & Asymmetric Layout)

| Element | Copy String | Max Length | Notes |
| :--- | :--- | :--- | :--- |
| Spec Tag | `SPEC // GITLEAKS ENGINE v8` | 30 chars | Monospace indicator |
| Main Display Headline | `Find leaked API keys in Git before they are exploited.` | 60 chars | Single-line display |
| Supporting Paragraph | `Secretless Code clones public repositories into an isolated memory buffer, runs 140+ Gitleaks detection rules, and prints the exact terminal commands to revoke and purge them from git history.` | 190 chars | Technical, verifiable facts |
| Trust Bullet 1 | `Ephemeral RAM-disk clone — code deleted immediately after scan` | 65 chars | Zero retention proof |
| Trust Bullet 2 | `No registration required for public repositories` | 55 chars | Instant entry |
| Trust Bullet 3 | `Average scan duration under [NEEDS FACT: benchmark seconds]s` | 65 chars | Flagged fact |
| Trust Badge Popover Link | `View zero-retention architecture specification` | 50 chars | Opens trust modal |

---

## 3. Signature Element: Instant Sample & Real URL Scanner

| Element | Copy String | Max Length | Notes |
| :--- | :--- | :--- | :--- |
| Panel Title | `Live scan console [RAM buffer]` | 35 chars | Header readout |
| Target Input Placeholder | `https://github.com/organization/repository` | 50 chars | Valid HTTPS format |
| Primary Input Action | `Scan target` | 12 chars | Same action name |
| Quick Demo Trigger | `Or scan sample vulnerable repository (10s)` | 45 chars | 1-click test flow |
| Terminal Step 1 | `[00:01] Fetching shallow commit tree (depth 1)...` | 55 chars | Monospace log line |
| Terminal Step 2 | `[00:02] Running Gitleaks rule evaluation (140 signatures)...` | 60 chars | Monospace log line |
| Terminal Step 3 | `[00:03] Scan finished. 3 committed secrets detected.` | 55 chars | Monospace log line |
| Finding Title 1 | `AWS Access Key ID` | 25 chars | Masked finding 1 |
| Finding Token 1 | `AKIA••••••••••••••••3821` | 30 chars | Signal Amber underline |
| Finding Location 1 | `backend/.env:42` | 25 chars | Commit line location |
| Finding Action 1A | `Revoke token at AWS` | 22 chars | Direct vendor link |
| Finding Action 1B | `Copy git-filter-repo command` | 30 chars | Shell command copy |
| Finding Title 2 | `Stripe Live Secret Key` | 25 chars | Masked finding 2 |
| Finding Token 2 | `sk_live_••••••••••••••••8912` | 30 chars | Signal Amber underline |
| Finding Location 2 | `src/config/stripe.ts:14` | 28 chars | Commit line location |
| Clean Scan State Header | `Zero exposed secrets detected.` | 35 chars | Empty findings |
| Clean Scan State Body | `Scanned commit tree passed all Gitleaks pattern evaluations.` | 70 chars | Audit verification |
| Clean Scan Action | `Download audit report (SARIF)` | 35 chars | Verifiable file export |

---

## 4. Remediation Guide Specification (Feature 2)

| Element | Copy String | Max Length | Notes |
| :--- | :--- | :--- | :--- |
| Section Headline | `Step-by-step credential revocation and history purge.` | 60 chars | Section header |
| Section Intro | `Deleting a secret in a new commit leaves it visible in Git history. Follow these two steps to rotate credentials and scrub past commit trees.` | 150 chars | Educational fact |
| Tab 1 | `AWS IAM` | 15 chars | Provider tab |
| Tab 2 | `Stripe` | 15 chars | Provider tab |
| Tab 3 | `GitHub PAT` | 15 chars | Provider tab |
| Tab 4 | `OpenAI` | 15 chars | Provider tab |
| Tab 5 | `MongoDB URI` | 15 chars | Provider tab |
| Tab 6 | `SSH private key` | 20 chars | Provider tab |
| Step 1 Header | `Step 1: Revoke the token immediately` | 40 chars | Vendor revocation |
| Step 1 Body | `Open your provider dashboard, deactivate the exposed credential ID, and generate a new key pair with updated environment variables.` | 140 chars | Concrete instructions |
| Step 2 Header | `Step 2: Scrub commit history using git-filter-repo` | 55 chars | Git purge step |
| Terminal Command Example | `git-filter-repo --invert-paths --path backend/.env --force` | 65 chars | Monospace command |
| Copy Command Action | `Copy command` | 15 chars | Action button |
| Copied Confirmation | `Command copied to clipboard` | 30 chars | Feedback state |
| Force Push Warning | `Rewriting commit history alters commit hashes. Coordinate with your team before pushing with --force.` | 110 chars | Safety warning |

---

## 5. Tiers & Pricing Specification

| Element | Copy String | Max Length | Notes |
| :--- | :--- | :--- | :--- |
| Section Headline | `Transparent capacity tiers.` | 35 chars | Section header |
| Billing Toggle Label | `Billed annually (save 20%)` | 30 chars | Annual toggle |
| Tier 1 Name | `Free` | 10 chars | Tier title |
| Tier 1 Price | `$0` | 10 chars | Price |
| Tier 1 Subtitle | `For public repository triage.` | 35 chars | Audience |
| Tier 1 Feature 1 | `Unlimited public repository scans` | 40 chars | Feature fact |
| Tier 1 Feature 2 | `Anonymous instant execution` | 35 chars | Feature fact |
| Tier 1 Feature 3 | `Rate limit: 3 scans per 15 minutes` | 40 chars | Concrete limit |
| Tier 1 Action | `Scan repository` | 16 chars | Same action label |
| Tier 2 Name | `Pro` | 10 chars | Tier title |
| Tier 2 Price Monthly | `$29 / month` | 15 chars | Monthly price |
| Tier 2 Price Annual | `$23 / month` | 15 chars | Annual discount price |
| Tier 2 Subtitle | `For independent engineers shipping daily.` | 45 chars | Audience |
| Tier 2 Feature 1 | `Includes all Free features` | 30 chars | Feature fact |
| Tier 2 Feature 2 | `Private repository scanning via GitHub OAuth` | 50 chars | Feature fact |
| Tier 2 Feature 3 | `Persistent scan history saved in Supabase` | 45 chars | Architecture fact |
| Tier 2 Feature 4 | `Email notifications via Resend on scan completion` | 55 chars | Verified provider |
| Tier 2 Action | `Start 14-day trial` | 20 chars | Direct verb |
| Tier 3 Name | `Team` | 10 chars | Tier title |
| Tier 3 Price | `From $99 / month` | 20 chars | Base price |
| Tier 3 Subtitle | `For engineering organizations.` | 35 chars | Audience |
| Tier 3 Feature 1 | `Up to 10 team seats with role-based access` | 45 chars | Capacity limit |
| Tier 3 Feature 2 | `Dedicated scanner container on Render / Railway` | 50 chars | Infrastructure fact |
| Tier 3 Feature 3 | `Custom regex pattern definitions` | 35 chars | Feature fact |
| Tier 3 Action | `Contact sales` | 15 chars | Action label |

---

## 6. Exact Error & Failure State Messages (From `docs/FEATURES.md`)

| Code / Trigger | Exact User-Facing Message | Max Length | Resolution Action |
| :--- | :--- | :--- | :--- |
| **Invalid URL** | `Please enter a valid public Git repository URL (e.g., https://github.com/owner/repo).` | 95 chars | Edit input text |
| **Private / 404** | `Repository not found or private. Anonymous scans only support public repositories.` | 95 chars | Sign in to authenticate |
| **Rate Limit 429** | `Anonymous scan limit reached (3 scans per 15 minutes). Wait 15 minutes or sign in to continue.` | 105 chars | Wait timer or sign in |
| **Timeout 504** | `The scan timed out. The repository exceeds the ephemeral limit (max 50MB / 1,000 commits).` | 105 chars | Reduce clone depth or upgrade |
| **Demo Failure** | `Unable to load demo scan data. Please check your network connection and retry.` | 90 chars | Retry button |
| **Clipboard Denied** | `Unable to access clipboard automatically. Please copy the commands manually.` | 85 chars | Manual selection |
| **Offline Cache** | `You are offline. Showing cached remediation guide.` | 60 chars | Reconnect network |
| **Email Failure** | `Notification email could not be sent. Your scan results remain available in your dashboard.` | 105 chars | View dashboard |
| **Custom 404** | `Secret not found. The requested page or ephemeral report does not exist or expired.` | 95 chars | Return to scanner button |

---

## 7. Global Footer

| Element | Copy String | Max Length | Notes |
| :--- | :--- | :--- | :--- |
| Wordmark | `Secretless Code` | 20 chars | Brand label |
| Copyright | `© [NEEDS FACT: current year] Secretless Code. Ephemeral credential security.` | 75 chars | Legal notice |
| Link 1 | `Zero-retention architecture` | 30 chars | Security spec |
| Link 2 | `Terms of service` | 20 chars | Legal spec |
| Link 3 | `Privacy policy` | 20 chars | Privacy spec |
| Link 4 | `GitHub repository` | 25 chars | Project source |

---

## 8. Needs Fact Inventory (Facts to Verify Before Production)
1. `[NEEDS FACT: benchmark seconds]`: Exact measured runtime of the Gitleaks prototype across 10 sample repositories (currently draft "30s" or "under 15s").
2. `[NEEDS FACT: current year]`: Current copyright year to render.
3. `[NEEDS FACT: public repo link]`: Production URL for Secretless Code GitHub repository and contact address.
4. `[NEEDS FACT: max repo size]`: Final ephemeral clone byte ceiling configured on the worker container (default draft: 50MB).
