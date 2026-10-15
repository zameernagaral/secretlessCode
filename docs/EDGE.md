# EDGE: Differentiators & Strategy

## 1. Source
- **Quoted Source:** "Secretless Code Production-Grade SaaS Upgrade Roadmap v2.0 (internal doc)". Member 1 objective: *"Build a high-converting, visually breathtaking marketing and onboarding experience with interactive 3D assets, smooth micro-animations, and complete error handling."* Target: Scale from ephemeral prototype into an enterprise-ready, multi-tenant Credential Security & SAST Platform.
- **Required Deliverables:** Interactive 3D hero element (shield / globe reacting to mouse) + particle/grid; Hero section with typing effect & instant URL scanner input; Feature comparison grid vs manual code review; Supported leaks grid (AWS, GitHub PATs, Stripe, OpenAI, MongoDB, SSH); CTA banner with 30s claim; Pricing cards (Free $0, Pro $29, Team $99+ with annual toggle); Custom 404/error pages ("Secret Not Found", terminal theme, Framer Motion fallbacks); Design system polish (Tailwind tokens, glassmorphism, glowing borders, cyber badges, dark/light toggle defaulting to dark); Week 4 polish (responsive + SEO).
- **Hard Rules / Tech:** Next.js (App Router), Tailwind CSS, Lucide icons, Three.js / React Three Fiber / Framer Motion (or Spline), Vercel hosting. Team of 5, 4-week sprint plan.
- **Missing Information:**
  - `[NEEDS FACT]` Scoring criteria & explicit weights (not stated in roadmap).
  - `[NEEDS FACT]` Who decides / judges (team lead, client, grading committee, or users).
  - `[NEEDS FACT]` Exact calendar deadline (only stated as "Week 4").
  - `[NEEDS FACT]` Allowed tech or originality constraints beyond listed dependencies.

---

## 2. Scoring Map
| Criterion / Client Goal | Weight | Who Decides |
| :--- | :--- | :--- |
| **High-converting onboarding & instant scan flow** | `[NEEDS FACT]` (Unstated) | `[NEEDS FACT]` (Users / Client / Team Lead) |
| **Visually breathtaking 3D & micro-animations** | `[NEEDS FACT]` (Unstated) | `[NEEDS FACT]` (Creative Lead / Evaluator) |
| **Complete error handling & fallback states** | `[NEEDS FACT]` (Unstated) | `[NEEDS FACT]` (Engineering Lead / Tester) |
| **Enterprise-ready design polish & responsive layout** | `[NEEDS FACT]` (Unstated) | `[NEEDS FACT]` (Reviewers / Evaluators) |

---

## 3. The Average Entry
What a typical competitor or applicant builds for this brief:
1. A heavy 3D Spline or Three.js scene that blocks main-thread hydration and pushes the scan input below the fold.
2. A fake scanner input with a canned `setTimeout(3000)` animation returning mock hardcoded JSON data.
3. Cliche "cyber" tropes: neon matrix green, digital rain, shield icons with generic glowing drop-shadows.
4. Alarmist copy ("Your company is 1 click away from ruin!") rather than calm precision instrument engineering.
5. Unsubstantiated claims (e.g. "Scans repos in 30 seconds" without proof or benchmarking).
6. Broken fallback states: WebGL crashes or mobile devices show a blank black container instead of graceful 2D fallbacks.
7. Unclear privacy terms: no explanation of whether public code is cloned, stored, or indexed, making security teams distrust entering a URL.
8. Generic feature comparison table with standard checkmarks that compare against hypothetical strawmen without tangible differentiators.

---

## 4. Gaps
What the average entry lacks that the client goal rewards:
- **Instant Zero-Friction Trust:** Concrete explanation of repository privacy and security (zero-retention, ephemeral execution) right beside the URL input.
- **Resilient 3D Degradation:** High-performance 3D that loads asynchronously and seamlessly degrades to a clean CSS/canvas state on low-power/mobile devices without shifting layout.
- **Interactive Remediation Preview:** Instead of just reporting a leak, showing a tangible snippet of *how* to revoke and scrub history (matching the core product promise).
- **Real Benchmark Transparency:** Honest, measured scan stats and live pipeline status instead of made-up figures.

---

## 5. Candidates (Possible Differentiators)
1. **Interactive "Remediation Diff" Inspector** (Shows step-by-step git-filter-repo / revoke commands alongside scan sample)
   - *Rubric Earned:* High-converting onboarding; Credential Security utility.
   - *Effort:* ~4 hours (guess).
   - *Risk:* Low (can be implemented client-side with rich tabs/interactive copy widgets).
   - *Backend Needed:* No.
2. **Instant Ephemeral Sandbox with Live Gitleaks Output stream**
   - *Rubric Earned:* Instant scan entry; Enterprise Credential Security credibility.
   - *Effort:* ~8 hours (guess).
   - *Risk:* Medium-High (depends on active backend queue and rate limit guarantees).
   - *Backend Needed:* Yes (SSE/WebSocket to backend scanner).
3. **Hardware-Adaptive 3D Shield (Zero-LCP Degradation)**
   - *Rubric Earned:* Visually breathtaking 3D + complete error/fallback handling.
   - *Effort:* ~3 hours (guess).
   - *Risk:* Low (detects WebGL / prefers-reduced-motion; renders lightweight interactive CSS/SVG fallback instantly).
   - *Backend Needed:* No.
4. **"Zero-Retention Proof" Security Callout Card**
   - *Rubric Earned:* High conversion (answers "Is it safe to paste my repo?" in <10 seconds).
   - *Effort:* ~1.5 hours (guess).
   - *Risk:* Minimal.
   - *Backend Needed:* No.
5. **Interactive Leak Simulator Playground** (Preset sample repos/commits: AWS leak vs Clean repo to test the engine without a real URL)
   - *Rubric Earned:* High-converting onboarding & instant trial.
   - *Effort:* ~3.5 hours (guess).
   - *Risk:* Low.
   - *Backend Needed:* No.
6. **SARIF / CI Output Viewer Modal**
   - *Rubric Earned:* Enterprise-ready SAST platform positioning.
   - *Effort:* ~3 hours (guess).
   - *Risk:* Low.
   - *Backend Needed:* No.

---

## 6. Pick (2-3 Differentiators)
- **Pick 1 (Core Polish/Feature):** **Hardware-Adaptive 3D Shield with Zero-LCP Fallback**
  - *Rationale:* Directly delivers Member 1's required 3D deliverable without compromising performance, mobile layout, or Core Web Vitals (guarantees URL input is never blocked or delayed).
- **Pick 2 (Cheap Proof / Conversion):** **"Zero-Retention Architecture" Trust Badge & Explainer**
  - *Rationale:* Answers the 10-second user dilemma ("Is it safe to paste my repo?") directly above the fold, overcoming security engineers' reluctance to paste company URLs.
- **Pick 3 (Cheap Proof / Utility):** **Interactive Leak Remediation Preview (Step-by-Step Fixer)**
  - *Rationale:* Separates Secretless Code from superficial scanners by demonstrating the *revoke & scrub* promise concretely on the landing page with 0 backend dependencies.

### Rejections:
- *Candidate 2 (Live Gitleaks stream on landing):* Rejected — High backend coupling and rate-limit risks; could delay delivery and belongs to backend workstream.
- *Candidate 5 (Interactive Leak Simulator Playground):* Rejected — Redundant if sample scan reports and instant URL submission flow are already present.
- *Candidate 6 (SARIF / CI Output Viewer Modal):* Rejected — Too technical for top-of-funnel landing visitors deciding in 10 seconds.

---

## 7. Do-Not-Break
- **Existing Site Rule:** The existing code and styling win. New components must match established tokens and structure without touching or restyling existing dashboard or auth files.
- **Dependency Constraint:** No arbitrary third-party library additions without confirmation; strictly use Next.js, Tailwind, Framer Motion, and Three.js/R3F (or Spline).
- **Performance Boundary:** The 3D element must never delay hero rendering or push down the primary URL input.
- **Server-Side Security:** Any actual scan execution or sensitive token operations must reside securely on the backend, never simulated insecurely in client-side states.

---

## 8. Pitch Line
> *"Secretless Code is the precision secret scanner that doesn't just catch committed credentials in seconds without storing your code—it gives you the exact commands to revoke and scrub them before they're exploited."*
