# APP: Secretless Code Application & Security Specification (v1)

Derived from `docs/BRIEF.md` (v3) and `docs/FEATURES.md`.

---

## 1. Ranked V1 Features (Max 5)

1. **Instant Sample & Real URL Scanner (Scan Entry Flow)** *(Rank 1 - Big)*
   - Allows anonymous visitors to click "Scan a demo repo" or paste a public Git URL to trigger an ephemeral Gitleaks scan in ~10 seconds with zero signup.
2. **Interactive Leak Remediation Preview (Revoke & Scrub)** *(Rank 2 - Small)*
   - Provides step-by-step vendor revocation documentation links and copyable `git-filter-repo` commands for detected leaks.
3. **Zero-Retention Trust & Security Verification Popover** *(Rank 3 - Small)*
   - Displays verifiable architecture guarantees (in-memory cloning, RAM-disk execution, immediate container wipe, zero file retention) directly adjacent to the scanner input.
4. **User Authentication & Persistent Scan History** *(Rank 4 - Small)*
   - Optional GitHub/Google sign-in via Supabase Auth unlocking saved scan logs and report history.
5. **Scan Completion & Critical Alert Notification** *(Rank 5 - Small)*
   - Delivers transactional emails via Resend to authenticated users upon scan completion or when critical secrets are detected.

---

## 2. User Roles & Permissions

| Role | Run Demo Scan | Run Anonymous Scan | Save History to DB | View Own Saved Reports | View All System Scans |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Anonymous** | Yes (Unlimited) | Yes (3 scans / 15 mins) | No (Ephemeral RAM only) | No | No |
| **Authenticated User** | Yes | Yes (Unlimited public/private) | Yes (Supabase RLS: `user_id = auth.uid()`) | Yes | No |
| **Admin** | Yes | Yes | Yes | Yes | Yes (Bypasses RLS) |

---

## 3. Data Models (Postgres / Supabase Schemas)

### `public.scans`
- `id`: `uuid` (Primary Key, default `gen_random_uuid()`), Required, Unique
- `user_id`: `uuid` (References `auth.users(id)` ON DELETE SET NULL), Optional (null for anonymous)
- `repo_url`: `text`, Required
- `is_demo`: `boolean`, Required (Default: `false`)
- `status`: `text` (Check constraint: `'queued'`, `'cloning'`, `'scanning'`, `'completed'`, `'failed'`), Required
- `findings_count`: `integer`, Required (Default: 0)
- `findings_summary`: `jsonb`, Required (Array of: `rule_id`, `file_path`, `line_number`, `masked_token`, `provider`)
- `ip_hash`: `text`, Required (SHA-256 with server salt for anonymous rate limiting)
- `created_at`: `timestamptz`, Required (Default: `now()`)
- **Row-Level Security (RLS) Policy:**
  - `SELECT`: `auth.uid() = user_id` (Authenticated users only see their own scans; anonymous scans are not queryable via public table select).
  - `INSERT`: `auth.uid() = user_id OR user_id IS NULL`.
  - `UPDATE`: Disallowed from client side.

### `public.user_notification_settings`
- `user_id`: `uuid` (Primary Key, References `auth.users(id)` ON DELETE CASCADE), Required, Unique
- `email`: `text`, Required
- `notify_on_complete`: `boolean`, Required (Default: `true`)
- `notify_critical_only`: `boolean`, Required (Default: `false`)
- `updated_at`: `timestamptz`, Required (Default: `now()`)
- **Row-Level Security (RLS) Policy:**
  - `ALL`: `auth.uid() = user_id` (Only the profile owner can read or mutate their notification settings).

---

## 4. API Routes & Endpoint Specifications

All endpoints run on the server side (Next.js App Router API or Express scan worker). Client checks never substitute for server validation.

| Method | Route | Access | Purpose & Validation Rules |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/scans/ephemeral` | Anonymous (Rate-limited) | Validates public GitHub URL syntax; executes shallow clone & Gitleaks scan in ephemeral RAM buffer; returns masked findings. Rate limit: 3 requests / 15 mins per IP hash. |
| `POST` | `/api/v1/scans/demo` | Public | Returns pre-computed or live demo specimen scan findings for the test repository with zero rate limit. |
| `POST` | `/api/v1/scans/authenticated` | Authenticated | Queues full repository scan; persists scan record to Supabase `scans` table under `auth.uid()`. |
| `GET` | `/api/v1/scans/:id` | Authenticated | Returns saved scan results. Server verifies `auth.uid() = scan.user_id` before returning details. |
| `GET` | `/api/v1/security/policy` | Public | Returns cached JSON specification of current zero-retention architecture guarantees and encryption standards. |
| `POST` | `/api/v1/notifications/unsubscribe` | Signed Token | Updates `user_notification_settings` via cryptographically signed token without requiring web session login. |

---

## 5. Authentication Approach

- **Library & Provider:** **Supabase Auth** (`@supabase/ssr` / `@supabase/supabase-js`), maintained and actively patched.
- **Methods:** OAuth 2.0 via GitHub (primary developer identity) and Google.
- **Server Enforcement:**
  - Every API route validates the Supabase JWT via server-side middleware (`supabase.auth.getUser()`).
  - Every database table has Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) activated.
  - Zero access keys, tokens, or service role secrets exposed to the browser bundle.

---

## 6. Pages (Routing Structure)

1. `/` — Public Landing Page (Asymmetric hero with live scan panel, demo scan trigger, remediation tabs, pricing cards, trust drawer).
2. `/auth/signin` — Dedicated Sign-In / OAuth Callback page (GitHub and Google buttons, error state handling).
3. `/scans/[id]` — Authenticated Scan Detail Report (Displays findings summary, commit references, and SARIF/PDF export triggers).
4. `/not-found` (`404`) — Custom Terminal Error Page ("404: Secret Not Found", quick link to return to scanner).

---

## 7. Acceptance Tests (Plain Words)

1. **Feature 1 (Instant Scan):** A visitor pastes a public GitHub URL and clicks "Scan target"; without being prompted to create an account, the visitor watches the 3-step terminal progress and sees the masked findings summary in under 15 seconds.
2. **Feature 2 (Remediation Guide):** A developer selects the "Stripe" finding tab and clicks "Copy command"; the exact `git-filter-repo` syntax is copied to the clipboard and positive confirmation displays.
3. **Feature 3 (Zero-Retention Verification):** A visitor clicks the "Zero-retention specification" link; an interactive modal opens displaying the ephemeral memory lifecycle and closes on pressing `Escape`.
4. **Feature 4 (Auth & History):** An authenticated user visits `/scans/[id]` belonging to another user and is denied access with an HTTP 403 / Not Found error.
5. **Feature 5 (Resend Notifications):** An authenticated user finishes a full scan with 2 critical leaks; a transactional email with masked secret summaries is delivered via Resend to their verified account address.

---

## 8. Explicit Out of Scope (V1)

- Automatic GitHub Pull Request creation or auto-merging bots.
- Automated token revocation via provider APIs (must remain developer-verified).
- Slack, Discord, or Teams webhook alert integrations.
- Multi-organization enterprise tenant administration or SAML/SSO setups.
- Scanning non-Git repositories (e.g. SVN, raw zip uploads, or cloud bucket sweeps).
- Local CLI agent installations.
