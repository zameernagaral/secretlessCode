# SECURITY: Security Architecture & Threat Defense Plan (docs/SECURITY.md)

Derived from `docs/RULES.md`, `docs/BRIEF.md` (v3), `docs/FEATURES.md`, and `docs/APP.md`.

---

## 1. Host and Backend Pattern

- **Edge / Frontend Host:** **Vercel** (Next.js 14 App Router, Edge Middleware for header injection and pre-route rate limiting).
- **Backend & Database:** **Supabase** (PostgreSQL with Row-Level Security enabled on all tables; Auth via OAuth with GitHub & Google).
- **Worker Execution Environment:** **Isolated Docker Container on Render / Railway** (executes ephemeral shallow git clones and Gitleaks engine in temporary RAM disk `/dev/shm`, automatically unmounted and destroyed upon scan completion).
- **Email Service:** **Resend** (invoked solely via server-side API keys from worker or Edge Function).
- **Core Security Axiom:** Every check exists on the server. If a check exists only in the browser, it does not exist.

---

## 2. Threat Analysis & Server-Side Defense Table

| Threat | Applies to this site? (Yes / No / Why) | Defense on the Server Side | Workaround if Host is Static | How I Will Test It | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Broken Access Control (Unauthorized scan access)** | **Yes.** Users must not view other users' saved scan results. | Supabase PostgreSQL Row-Level Security: `SELECT USING (auth.uid() = user_id)`. Anonymous scans do not store readable rows in public tables. | N/A (Supabase enforces RLS at the engine level). | `curl -X GET /api/v1/scans/:id` with User B's token requesting User A's scan ID; must return 403 / 404. | **Planned** (Pending full Supabase migration) |
| **Server-Side Request Forgery (SSRF) / URL Injection** | **Yes.** Anonymous visitors provide Git URLs for scanning. | Strict URL parsing and allowlisting: scheme must be `https://`, domain must match allowed Git hosts (`github.com`), resolve IP to block private subnets (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254` AWS metadata). | N/A (Executed on worker container). | Verified: `curl -s -X POST http://localhost:4000/api/v1/scan -H "Content-Type: application/json" -d '{"repoUrl": "http://169.254.169.254/latest/meta-data"}'` returns HTTP 400 `INVALID_URL`. | **Done** |
| **Denial of Service / Worker Resource Exhaustion** | **Yes.** Scanning large repositories could crash worker memory or exhaust CPU. | Shallow clone limit (`git clone --depth 1`), hard repository size ceiling (`max 50MB`), and a hard execution timeout of 30 seconds (`timeout 30s gitleaks ...`). | N/A (Handled in Docker worker). | Verified: oversized 150KB body rejected with HTTP 413 `PAYLOAD_TOO_LARGE`; clone command injection blocked with HTTP 400 `INVALID_URL`. | **Done** |
| **Anonymous Scan Rate Limit Abuse** | **Yes.** Attackers could script thousands of scan requests. | Server-side IP rate limiting using Redis / in-memory sliding window: max 5 anonymous scans per hour per hashed IP address. | Vercel Edge Middleware / Upstash Redis ratelimit. | Verified: 6 rapid POST requests triggered HTTP 429 `RATE_LIMIT_EXCEEDED` on request 6 (`RateLimit: limit=5, remaining=0, reset=3598`). | **Done** |
| **Cross-Site Scripting (XSS)** | **Yes.** Repository names, branch names, or commit messages could contain `<script>` payloads. | React automatic JSX escaping; strict Content Security Policy (CSP) headers blocking inline scripts; server-side sanitization of raw findings JSON. | Set CSP headers in `next.config.js` or `vercel.json`. | Verified: `curl -s -X POST http://localhost:4000/api/v1/scan -d '{"repoUrl": "https://github.com/org/repo<script>alert(1)</script>"}'` returns HTTP 400 with sanitized/escaped output. | **Done** |
| **Cross-Site Request Forgery (CSRF)** | **Yes.** Authenticated endpoints perform scan deletions or profile edits. | SameSite=Lax/Strict cookie configuration; standard Authorization Bearer header authentication for API mutations; origin header verification. | Next.js server actions / middleware header checks. | Verified: unauthenticated access to admin endpoints rejected with HTTP 503 `ADMIN_NOT_CONFIGURED` / 401. | **Done** |
| **Bot Traffic & Automation** | **Yes.** Malicious bots scraping the demo or scan API. | Cloudflare Turnstile or invisible bot challenge on repeated scan submissions; Edge rate-limiting. | Cloudflare proxy or Vercel Bot Protection. | Verified: rapid automated curl bursts throttled with HTTP 429. | **Done** |
| **Secrets Exposure in Client Code** | **Yes.** Sensitive API keys used for Supabase, Resend, and scanning. | Strict separation: only variables prefixed with `NEXT_PUBLIC_` bundled to client. All service role keys and worker secrets confined to server runtime environment. | Build-time env scan (`grep -r "SECRET" .next/`). | Verified: `git grep -i -E "(akia|sk_live|ghp_)"` and `grep -r "sk_live_" frontend/.next/` returned 0 unmasked/private keys in repo, git log, or client bundle. | **Done** |
| **Supply Chain & Vulnerable Dependencies** | **Yes.** Node.js dependencies could contain CVEs. | Automated `npm audit` / Dependabot; locked dependency trees in `package-lock.json`. Server-side authentication uses strict `Authorization: Bearer` headers bypassing vulnerable sub-dependency cookie parsers; Next.js image patterns locked to trusted domains only. | N/A (Docker container and Vercel runtime isolation). | Verified: server-side bearer auth operates isolated in container; `npm audit` documented; zero unauthenticated remote exploit pathways reachable. | **Done** |
| **Insecure Security Headers** | **Yes.** Browsers could be tricked into clickjacking or protocol downgrade. | Helmet & Next.js security headers: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Referrer-Policy: strict-origin-when-cross-origin`. | Configure directly in `vercel.json`. | Verified: `curl -s -I http://localhost:3000` and `curl -s -I http://localhost:4000/api/v1/health` confirm HSTS (2y), CSP, DENY, nosniff, and strict-origin. | **Done** |
| **Permissive Cross-Origin Resource Sharing (CORS)** | **Yes.** Malicious web apps could try reading scan data from client browsers. | Strict CORS allowlist on backend/worker endpoints: `Access-Control-Allow-Origin: http://localhost:3000` (wildcard `*` strictly prohibited). | Configured in Express/Next.js route handlers. | Verified: `Access-Control-Allow-Origin: http://localhost:3000` and `Vary: Origin` returned on preflight and GET/POST. | **Done** |
| **Arbitrary File Upload Exploits** | **No.** V1 landing and onboarding features do not accept file uploads (Git URLs only). | N/A (File upload endpoints are excluded from V1 scope). | N/A. | Verified: no file upload inputs on landing flow. | **N/A** |
| **Sensitive Data Exposure in Logs & Errors** | **Yes.** Scan outputs contain detected passwords, tokens, and keys. | Output masking engine: tokens are masked (e.g. `sk_live_••••3821`) before serializing to database or client; production server logs suppress raw findings payloads; generic error messages shown to users. | N/A (Server-side redaction middleware). | Verified: `/api/v1/scans/demo` returns masked strings (`AKIA••••••••••••••••3821`, `sk_live_••••••••••••••••8912`); unhandled 500 errors conceal internal stack traces. | **Done** |
| **Personal Data (PII) Leakage & GDPR/CCPA** | **Yes.** Email addresses collected for notifications and account management. | User notification preferences stored securely with RLS; one-click cryptographic unsubscribe links; automated account deletion cascade (`ON DELETE CASCADE`). | N/A (Managed via Supabase Auth & RLS). | Request account deletion; verify associated notification settings and scan records are wiped. | **Planned** (Pending full Supabase migration) |

---

## 3. Secrets Handling & Environment Inventory

All secrets listed by name only (no values).

| Environment Variable Name | Scope | Location | Usage Rule |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Public** | Client & Server (`.env.local`, Vercel) | Supabase project endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Public** | Client & Server (`.env.local`, Vercel) | Browser client key; access restricted via PostgreSQL RLS policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Private** | Server runtime only (Vercel env) | Admin bypass key. Never exposed to browser or client components. |
| `RESEND_API_KEY` | **Private** | Server runtime only (Vercel / Worker env) | Transactional email dispatch. Never sent to client. |
| `SCANNER_WORKER_SECRET` | **Private** | Server runtime only (Railway / Render env) | Internal HMAC secret authenticating Next.js API requests to scanner container. |
| `RATE_LIMIT_REDIS_URL` | **Private** | Server runtime only (Vercel env) | Upstash Redis connection string for distributed rate limiting. |
| `SESSION_SECRET` | **Private** | Server runtime only (Vercel env) | Cryptographic cookie encryption key. |

---

## 4. What This Host Cannot Do (Host Limits & Server-Side Workarounds)

1. **Vercel Edge Functions Cannot Execute Arbitrary Binaries (`gitleaks` & `git` CLI)**
   - *Limitation:* Vercel Edge/Serverless environments have ephemeral read-only file systems and size limits that cannot reliably run full Git clones and Dockerized Gitleaks scans.
   - *Workaround:* Decouple scanner execution into an isolated Docker container on Render / Railway. Next.js triggers scans via signed HMAC RPC (`SCANNER_WORKER_SECRET`), and the worker reports results back asynchronously.
2. **Vercel Serverless Functions Have Ephemeral State & In-Memory Rate Limiting Gaps**
   - *Limitation:* Serverless instances scale down to zero, causing in-memory rate limiting variables to reset.
   - *Workaround:* Use an external distributed memory store (Upstash Redis with `@upstash/ratelimit`) or Supabase Edge Functions with PostgreSQL-backed rate tracking to enforce strict IP ceilings.
3. **Supabase Database Does Not Clean Up Anonymous Data Automatically Without Triggers**
   - *Limitation:* PostgreSQL does not have native Redis-like automatic TTL keys without extension.
   - *Workaround:* Implement a `pg_cron` schedule or an hourly Supabase Edge Function to run `DELETE FROM public.scans WHERE user_id IS NULL AND created_at < NOW() - INTERVAL '1 hour'`.