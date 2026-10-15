# BRIEF: Secretless Code (v3, Rewritten)

1. **Type:** Web app. Scope: public landing page, scan entry flow, sign-in, "scan finished" email, and custom 404. Out of scope: full dashboard, API key management, GitHub App integration, Slack/Discord alerts.
2. **Subject:** Secretless Code finds API keys and passwords accidentally committed to a Git repo, then tells you exactly how to revoke and remove them.
3. **Audience:** Developer on a small team (2–20 people) who ships from GitHub (assumed). In 10 seconds they decide: *"Does this find real leaks, and is it safe to paste my repo URL?"* Both must be answered above the fold without scrolling.
4. **Single job:** **Scan.** Visitor pastes a public repo URL and initiates an immediate scan without signing up. Signing in is strictly optional to unlock persistent scan history and email alerts. Target: 10% submission rate (assumed; [NEEDS FACT] real baseline).
5. **Proof inventory:**
   - **EXISTS:** Gitleaks-based scanner engine; leak detectors (AWS, GitHub PAT, Stripe, OpenAI, MongoDB, SSH); pricing tiers (Free $0 / Pro $29/mo / Team $99+/mo with annual toggle); features (live scan progress, SARIF/PDF export, GitHub PR bot, Resend email alerts); draft product name & tagline.
   - **MISSING (do not fake):** Logo/wordmark ([NEEDS FACT] use clean text-only wordmark); real stats (scan duration, repos scanned; measure on prototype first); UI screenshots/sample report ([NEEDS FACT] generate from a real scan or explicitly label as sample); customer logos/testimonials (omit); live domain & public repo URL; proof for "30 seconds" claim (time 10 real scans or drop).
6. **Feels like (3 words):** Precision, calm, honest (assumed).  
   **Must never feel like (3 words):** Matrix-green, generic-template, alarmist (assumed).
7. **Constraints:**
   - Deadline: [NEEDS FACT] (roadmap launch: Week 4).
   - Pages: Landing (scan input + pricing), Sign-in, Scan progress/result entry, Custom 404.
   - Frontend: Next.js + Tailwind CSS, hosted on Vercel.
   - Backend & Auth: **Supabase** (Postgres, Auth with GitHub/Google, Row-Level Security enabled on every table).
   - Email & Notifications: **Resend** (transactional emails only: scan-complete and critical-finding alerts).
   - Security Baseline: **OWASP Top Ten 2021** (Broken Access Control with Supabase RLS, Injection mitigation via server-side URL validation, Rate limits on anonymous scans, Zero secrets on client).
   - Typography & Assets: **Google Fonts** only (1-2 families); Lucide icons; text-only wordmark; zero stock imagery.
   - Animation: **Motion** (`motion.dev`); optional 3D hero (React Three Fiber) that must never delay or push down the URL input.
   - Worker Architecture & Risk: Supabase does not run Gitleaks. Clone + Gitleaks execution must run in an isolated worker container (e.g. Render/Railway or Express worker). Landing page can launch with stubbed/sample scan data first.

---

### Critique & Refinements
- **Supabase vs Existing Prisma/Mongo Setup:** The workspace currently has Prisma/Express/Docker configurations. Shifting to Supabase requires maintaining strict separation: new landing/auth work uses Supabase RLS, without breaking teammate workstreams.
- **Anonymous Scan Privacy Disclosure:** Because sign-in is optional, the landing page must explicitly state data retention rules (e.g. anonymous scan results live only for 1 hour via TTL, code is never stored).
- **Email Delivery Trigger:** Resend emails must only trigger for authenticated users who request notification or enter an email, keeping anonymous URL scanning completely zero-friction.
- **Open Questions:**
  1. Which workstream is mine ("Member 1" landing page & onboarding)?
  2. Is there an official logo, and what is the exact Week 4 deadline date?
  3. Do we have a real scan benchmark to time actual duration before publishing claims?
  4. Where will the Gitleaks Docker worker run (Render vs Railway)?
