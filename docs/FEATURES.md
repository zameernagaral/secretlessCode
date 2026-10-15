# FEATURES: Secretless Code Landing & Onboarding (v3)

## Feature 1: Instant Sample & Real URL Scanner (Scan Entry Flow)
- **Rank & Size:** Rank 1 (Big)
- **Goal / Rubric Line:** Single job ("Scan") from `docs/BRIEF.md`; High-converting onboarding and proof without logos/testimonials from `docs/EDGE.md`.
- **User Story:** As a developer visiting Secretless Code, I want to click "Scan a demo repo" or paste my own public repo URL and watch the scan run step-by-step with zero sign-up, so that I can see the scanner work in ~10 seconds with real masked findings and remediation steps.
- **Roles & Permissions Table:**
  | Role | Can Run Demo Scan | Can Submit Custom Public Repo | Can View Masked Findings | Can Persist History to DB |
  | :--- | :--- | :--- | :--- | :--- |
  | **Anonymous** | Yes (Unlimited) | Yes (Rate-limited by IP) | Yes | No (In-memory / Session state only) |
  | **Authenticated User** | Yes | Yes (Higher rate limit) | Yes | Yes (Stored in Supabase via RLS) |
  | **Admin** | Yes | Yes (Bypass rate limit) | Yes | Yes (All scans) |
- **Data Model (Supabase `scans` table):**
  - `id`: `uuid`, Required, Unique, Primary Key (Default: `gen_random_uuid()`)
  - `user_id`: `uuid`, Optional, References `auth.users(id)` (Owner, null for anonymous)
  - `repo_url`: `text`, Required
  - `is_demo`: `boolean`, Required (Default: `false`)
  - `status`: `text` (Check constraint: `queued`, `cloning`, `scanning`, `completed`, `failed`), Required
  - `findings_count`: `integer`, Required (Default: 0)
  - `findings_summary`: `jsonb`, Required (Array of: `rule_id`, `file_path`, `line_number`, `masked_token`, `provider`)
  - `ip_hash`: `text`, Required (SHA-256 for rate limiting)
  - `created_at`: `timestamptz`, Required (Default: `now()`)
- **Happy-Path Flow:**
  1. Visitor lands on the hero and clicks "Scan a demo repo" (or types a public GitHub URL and clicks "Scan Now").
  2. Hero transitions seamlessly into terminal inspection view.
  3. Step 1 (0.8s): "Cloning repository structure..." (indicates shallow branch checkout).
  4. Step 2 (1.2s): "Running Gitleaks detection engine (140+ secret rules)...".
  5. Step 3 (0.9s): "Evaluating findings & computing remediation steps...".
  6. Final findings dashboard appears: shows 3 detected secrets (AWS Key, Stripe Secret Key, GitHub PAT), fully masked (e.g. `sk_live_••••••••••••••••3821`), line references, and a prominent "How to Revoke & Scrub" action.
- **Failure States (User-Facing Messages):**
  1. *Invalid repository URL format:* `"Please enter a valid public Git URL (e.g., https://github.com/owner/repo)."`
  2. *Private or missing repository:* `"Repository not found or private. Anonymous scans only support public repositories."`
  3. *Rate limit exceeded:* `"Anonymous scan limit reached (3 scans per 15 minutes). Wait 15 minutes or sign in to continue."`
  4. *Scan worker timeout:* `"The scan timed out. The repository exceeds the ephemeral limit (max 50MB / 1,000 commits)."`
  5. *Demo scan network failure:* `"Unable to load demo scan data. Please check your network connection and retry."`
- **Edge Cases & System Behavior:**
  1. *User clicks "Scan a demo repo" multiple times:* State deduplicates instantly; does not re-fetch or re-animate if already in progress.
  2. *User types a custom URL while demo scan is running:* In-flight demo scan aborts cleanly and custom scan initializes.
  3. *User is on mobile/low-bandwidth connection:* Streaming state steps degrade gracefully to static list without layout jank.
  4. *Trailing slashes or `.git` in input:* Cleaned and normalized client-side prior to API payload dispatch.
  5. *Malicious URL schemes (e.g. `javascript:`, `file://`, internal IPs):* Rejected immediately client-side and verified server-side.
- **Abuse Case:** Scripted spamming of large repositories to exhaust worker memory.  
  *Mitigation:* Strict Supabase Edge / worker rate-limiting by hashed IP, max repo size clamp, and 30-second hard kill timeout on workers.
- **Acceptance Tests:**
  - *Must Pass:* Clicking "Scan a demo repo" loads within 10 seconds and renders 3 masked secrets with provider tags.
  - *Must Pass:* Valid public GitHub URL enters scanning state and returns findings without sign-up.
  - *Must Be Denied:* Anonymous requests submitting non-GitHub URLs or private repos without tokens must receive an explicit 400/404 error message.
- **Out of Scope:** Automated GitHub PR generation, private org SSO, Slack/Discord bot integrations.

---

## Feature 2: Interactive Leak Remediation Preview (Revoke & Scrub)
- **Rank & Size:** Rank 2 (Small)
- **Goal / Rubric Line:** Pick 3 differentiator from `docs/EDGE.md`; converts passive awareness into immediate actionable utility.
- **User Story:** As a developer who just ran a scan and saw leaked keys, I want to click on any finding to view the exact provider revocation steps and copy-pasteable Git scrubbing commands (`git-filter-repo`), so that I can revoke the exposed key and purge it from git history immediately.
- **Roles & Permissions Table:**
  | Role | Can View Remediation Guide | Can Copy CLI Commands | Can Download Shell Script |
  | :--- | :--- | :--- | :--- |
  | **Anonymous** | Yes | Yes | Yes |
  | **Authenticated User** | Yes | Yes | Yes |
  | **Admin** | Yes | Yes | Yes |
- **Data Model (Client-side Config / Static Supabase Lookup):**
  - `provider_id`: `text`, Required, Unique (e.g. `aws`, `stripe`, `github_pat`, `openai`, `mongodb`, `ssh`)
  - `display_name`: `text`, Required
  - `revocation_url`: `text`, Required
  - `git_scrub_command`: `text`, Required (Parameterized template for `git-filter-repo`)
  - `validation_command`: `text`, Required
- **Happy-Path Flow:**
  1. User selects a detected secret card (e.g., "Stripe Secret Key in `backend/.env`").
  2. An interactive drawer opens displaying two clear tabs: "1. Revoke at Provider" and "2. Scrub Git History".
  3. Tab 1 gives direct links to Stripe API dashboard revocation with instructions on key cycling.
  4. Tab 2 generates the exact command: `git-filter-repo --invert-paths --path backend/.env --force`.
  5. User clicks "Copy Command" -> tooltip turns green with "Copied!".
- **Failure States (User-Facing Messages):**
  1. *Clipboard permission denied:* `"Unable to copy to clipboard automatically. Please copy the command manually."`
  2. *Unrecognized rule/custom secret:* `"Automated remediation guide unavailable for this token type. Please consult manual Git scrubbing steps."`
  3. *Invalid file path characters:* `"Invalid path characters detected. Remediation command generation paused."`
  4. *Offline state:* `"You are offline. Showing cached remediation guide."`
  5. *Browser clipboard API unavailable:* `"Browser does not support automatic clipboard copying."`
- **Edge Cases & System Behavior:**
  1. *Sensitive data leakage in UI:* The remediation guide never echoes unmasked secrets—always uses masked tokens.
  2. *Force-push risk alert:* Prominent amber warning displayed: *"Scrubbing Git history rewrites commit hashes. Coordinate with your team before running `git push --force`."*
  3. *Long file paths:* Pre-formatted code container enables horizontal scroll without expanding page layout.
  4. *Dark/Light mode switch:* Monospaced code blocks adapt with accessible syntax contrast in both modes.
  5. *Keyboard navigation:* Tab selects tabs; Space/Enter copies command.
- **Abuse Case:** Injecting shell command chaining (e.g., `; rm -rf ~`) into custom path fields.  
  *Mitigation:* Input regex whitelist strictly enforces valid Git relative paths (`^[a-zA-Z0-9_\-\./]+$`).
- **Acceptance Tests:**
  - *Must Pass:* Clicking "Stripe" finding opens drawer with working revocation URL and copyable `git-filter-repo` syntax.
  - *Must Pass:* Clicking "Copy Command" writes exact text to system clipboard.
  - *Must Be Denied:* Entering shell operators (`&`, `|`, `;`, `` ` ``) into path parameter must fail validation and be blocked.
- **Out of Scope:** Running SSH or git push directly on the client machine; automated OAuth revocation.

---

## Feature 3: Scan Notification & Critical Leak Alert (Resend Email Flow)
- **Rank & Size:** Rank 3 (Small)
- **Goal / Rubric Line:** Fulfills `docs/BRIEF.md` (v3) email constraint ("scan finished" and critical alerts).
- **User Story:** As an authenticated developer, I want to receive an email notification via Resend when a long-running or scheduled scan completes, so that I am alerted immediately if high-severity keys are found without keeping my browser tab open.
- **Roles & Permissions Table:**
  | Role | Can Receive Scan Email | Can Manage Email Preferences |
  | :--- | :--- | :--- |
  | **Anonymous** | No (Must sign in or explicitly opt in) | No |
  | **Authenticated User** | Yes | Yes (Toggle in account settings) |
  | **Admin** | Yes | Yes |
- **Data Model (Supabase `user_notification_settings`):**
  - `user_id`: `uuid`, Required, Unique, References `auth.users(id)` (Owner)
  - `email`: `text`, Required
  - `notify_on_complete`: `boolean`, Required (Default: `true`)
  - `notify_critical_only`: `boolean`, Required (Default: `false`)
  - `updated_at`: `timestamptz`, Required (Default: `now()`)
- **Happy-Path Flow:**
  1. Authenticated user starts a repository scan.
  2. Scan finishes in worker container and updates Supabase `scans` table.
  3. Database webhook or worker triggers Resend API call with transactional template.
  4. User receives clean, branded email: "Scan complete for [org/repo] — 2 critical secrets detected".
  5. Email contains masked tokens, summary count, and a secure one-click link back to their authenticated report.
- **Failure States (User-Facing Messages):**
  1. *Resend API delivery failure:* `"Notification email could not be sent. Your scan results remain available in your dashboard."`
  2. *Invalid email address:* `"Please provide a valid email address to receive scan notifications."`
  3. *Unsubscribed user:* `"Email notification skipped according to your notification preferences."`
  4. *Rate limit on email dispatches:* `"Email notification throttled to prevent spam. Check your dashboard for live results."`
  5. *Expired scan report link:* `"This scan report link has expired. Sign in to your account to view saved scan history."`
- **Edge Cases & System Behavior:**
  1. *Zero secrets found:* Email sends a calming green confirmation: "No secrets detected in [org/repo]".
  2. *User signs out before scan completes:* Resend email sends regardless, delivering secure link that requires sign-in to view full report.
  3. *Disposable email domain:* Rejected on profile save via domain blocklist.
  4. *Email provider down (Resend 5xx):* Worker queues notification with exponential backoff (up to 3 retries) without failing the scan.
  5. *Unsubscribe link clicked:* Instantly sets `notify_on_complete = false` via signed token without requiring login.
- **Abuse Case:** Spamming scan requests to flood a target's inbox.  
  *Mitigation:* Strict rate limit (max 5 emails per user/repo per hour); emails only sent to the verified user email associated with the Supabase session.
- **Acceptance Tests:**
  - *Must Pass:* Successful scan for authenticated user triggers Resend API with masked summary payload.
  - *Must Pass:* Clicking unsubscribe token in email footer updates user preference to false.
  - *Must Be Denied:* Unverified anonymous visitors cannot trigger email dispatch to arbitrary third-party email addresses.
- **Out of Scope:** Marketing newsletters, Slack webhooks, SMS alerts.

---

## Host and Backend Pattern (Step 0c-3)
- **Frontend & Edge Functions:** Next.js 14 on Vercel.
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security enabled on all tables; GitHub & Google OAuth).
- **Scanner Engine Worker:** Isolated Docker container running Gitleaks on Render/Railway (ephemeral clone + scan; reports result back to Supabase API or returns directly to client via ephemeral endpoint).
- **Email Delivery:** Resend transactional API called server-side from worker or Supabase Edge Function.

## Required Secrets (Names only, no values)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `SCANNER_WORKER_SECRET`
