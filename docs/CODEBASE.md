# CODEBASE: Secretless Code Architecture & Directory Structure (docs/CODEBASE.md)

## 1. Stack & Runtime
- **Frontend:** Next.js 14 (App Router), React 18, CSS Modules + Vanilla CSS tokens, Framer Motion for mechanical micro-interactions.
- **Backend:** Node.js 20, Express 4 REST API, Prisma ORM (PostgreSQL), Gitleaks binary & built-in regex detection engine.
- **Containerization:** Docker Compose (`secretless-backend` on port 4000, `secretless-frontend` on port 3000).
- **Authentication:** Clerk / Supabase Auth (`@clerk/nextjs`, `@clerk/clerk-sdk-node`).
- **Testing & Quality:** Node.js native `node:test` (backend unit/integration tests), `@playwright/test` + `@axe-core/playwright` (E2E & a11y), `@lhci/cli` (Lighthouse CI).

---

## 2. Directory Layout

```
secretlessCode/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Prisma models (User, Project, Scan)
│   ├── src/
│   │   ├── middlewares/         # rateLimiter, auth, validateSchema, outputSanitizer
│   │   ├── routes/              # scan.js, scanFile.js, admin.js, github.js
│   │   ├── services/            # scanner.js, engineRouter.js, notifier.js, storage/
│   │   ├── utils/               # logger.js, validator.js
│   │   └── server.js            # Express entry point (mounted at /api/v1)
│   └── tests/
│       └── api.test.js          # Node test suite (25 tests)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout with metadata and fonts
│   │   │   ├── page.tsx         # Landing page and section specifications
│   │   │   ├── globals.css      # Design tokens and CSS reset
│   │   │   └── api/sentry-test/ # Error tracking diagnostic endpoint
│   │   └── components/
│   │       └── SignatureConsole.tsx # Live scan console & terminal
│   ├── tests/
│   │   └── ci.spec.ts           # Playwright E2E and Axe accessibility suite
│   ├── playwright.config.ts     # Playwright configuration (desktop + 390px mobile)
│   └── sentry.client.config.ts  # Sentry zero-PII client configuration
├── docs/                        # Architecture, brief, rules, and change plans
├── lighthouserc.json            # Lighthouse CI assertion rules
└── docker-compose.yml           # Multi-container orchestration
```

---

## 3. Core Architectural Rules
1. **Server-Side Security Enforcement:** All validation, rate-limiting, and redaction happen on the server. Checks in the browser exist for UX only.
2. **Zero Plaintext Secrets:** Findings emitted by the backend or displayed in the frontend must always have tokens masked (e.g. `sk_live_••••3821`).
3. **Ephemeral Isolation:** Scans execute shallow clones (`--depth 1`) in ephemeral memory buffers with a 30-second kill timeout.
