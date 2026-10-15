# CHANGE: Real Dynamic Findings, Cloud Database Persistence & OAuth Auth (docs/CHANGE.md)

## 1. Goal
Display real detected scan findings dynamically, persist scan records to cloud PostgreSQL via Prisma, and enable GitHub/Google sign-in with user scan history.

---

## 2. Why
- **Problem 1 (Scanner Bug):** When a user inputs a repository URL that contains exposed credentials, the backend successfully detects them, but `SignatureConsole.tsx` discards `data.data.findings` and renders hardcoded `STATIC_FINDINGS`. Real findings are never shown.
- **Problem 2 (Database Missing):** Scan results are not saved to a database table (`Scan` model missing in Prisma), preventing users and developers from viewing or verifying stored records.
- **Problem 3 (Auth Static):** The "Sign In" button in the header is a static hash anchor (`#sign-in`) without dynamic authentication or session awareness.
- **Rubric / Spec:** Implements Feature 1 ("Instant Sample & Real URL Scanner") and Feature 4 ("User Authentication & Persistent Scan History") from `docs/APP.md` and `docs/DATABASE.MD`.

---

## 3. Files Permitted to Edit & Create

### Files You May Edit:
1. `frontend/src/components/SignatureConsole.tsx` — Store dynamic findings from `/api/v1/scan` in state; render real detected secrets (tokens, rules, file paths, line numbers); fall back to sample specimen only when demo scan is explicitly clicked.
2. `frontend/src/app/page.tsx` — Wire header "Sign In" button to open dynamic Auth modal / trigger Clerk OAuth; wire "Scan repository" tier buttons to auto-focus and scroll to the scanner.
3. `frontend/src/app/layout.tsx` — Wrap application in `ClerkProvider` (with resilient fallback for local development if keys are unconfigured).
4. `backend/prisma/schema.prisma` — Add `Scan` and `Finding` models connected to PostgreSQL `DATABASE_URL`.
5. `backend/src/routes/scan.js` — Save completed scans to the database asynchronously upon scan execution.
6. `backend/src/server.js` — Mount `/api/v1/scans` history route.

### New Files You May Create:
1. `backend/src/routes/scansHistory.js` — Endpoints:
   - `GET /api/v1/scans` (list recent public/anonymous scans)
   - `GET /api/v1/scans/:id` (fetch single scan by ID with findings)
2. `frontend/src/components/AuthModal.tsx` — Modal with direct "Sign in with GitHub" and "Sign in with Google" OAuth actions and session state.
3. `frontend/src/app/dashboard/page.tsx` — Protected / personal scan history dashboard reading persisted scans from the database.

### Files You Must NOT Touch:
- `.github/workflows/ci.yml`
- `frontend/src/components/ui/*`
- `docs/RULES.md`
- `docs/SECURITY.md`
- Stripe payment files (reserved for billing change).

---

## 4. Blast Radius
- `SignatureConsole.tsx`: Used in `page.tsx`. If findings array is empty, it switches to `'clean'` state showing zero exposed secrets. If findings exist, it renders real cards with masked tokens (`••••`).
- `backend/src/routes/scan.js`: Database save is executed via `saveScanToDb(result).catch(...)` so database network latency or connection drops never fail or block the scan HTTP response.
- `ClerkProvider` in `layout.tsx`: Configured with fallback mode so unconfigured Clerk API keys never cause runtime SSR 500 errors.

---

## 5. Design & Token Reuse
- **Reused Tokens:** `--color-text-primary`, `--color-bg-card`, `--color-accent-amber`, `--font-mono`, `--border-dim`, `--space-4`.
- **Reused Components:** `SignatureConsole.module.css` finding card tokens, `page.module.css` layout grid, existing button styles (`actionBtn`, `submitBtn`).
- **New Element:** Auth modal styled using `--color-bg-card` and glassmorphic overlay matching existing aesthetic.

---

## 6. Permissions Table & Data Model

### Roles & Permissions:
| Role | Run Real Git Scan | View Live Findings in UI | Save Scan to DB | View All Scans in Dashboard |
| :--- | :--- | :--- | :--- | :--- |
| **Anonymous** | Yes | Yes (Real masked findings) | Yes (Anonymous record) | Public / recent list only |
| **Authenticated (GitHub/Google)** | Yes | Yes | Yes (Linked to `userId`) | Yes (Full user scan history) |
| **Admin** | Yes | Yes | Yes | Yes (All system scans) |

### Prisma Data Model (`backend/prisma/schema.prisma`):
```prisma
model Scan {
  id             String    @id @default(uuid())
  repoUrl        String
  repoName       String
  status         String    @default("completed") // completed | clean | failed
  findingsCount  Int       @default(0)
  findings       Json      // Array of: { ruleId, file, line, maskedToken, provider }
  scanDurationMs Int?
  isDemo         Boolean   @default(false)
  ipHash         String?
  userId         String?
  createdAt      DateTime  @default(now())
}
```

---

## 7. Failure States & Exact Error Messages

1. **Clean Scan (Zero Secrets in Real Repo):**
   - *Message:* `"Zero exposed secrets detected. Scanned commit tree passed all Gitleaks pattern evaluations."`
2. **Invalid Repository URL:**
   - *Message:* `"Please enter a valid public Git repository URL (e.g., https://github.com/owner/repo)."`
3. **Private or Non-Existent Repository:**
   - *Message:* `"Repository not found or private. Anonymous scans only support public repositories."`
4. **Backend Unreachable / Network Timeout:**
   - *Message:* `"Unable to load scan data. Please check your network connection and retry."`
5. **Rate Limit Exceeded:**
   - *Message:* `"Anonymous scan limit reached (5 scans per hour). Wait before running another scan."`

### Edge Cases:
1. **Scanned repository has 50+ findings:** Results container scrolls smoothly without breaking the layout or overlapping the terminal logs.
2. **User runs demo scan vs real URL:** Clicking "Or scan sample vulnerable repository" loads the demo specimen; submitting a real URL in the input calls the live backend scanner and displays the real findings.
3. **Database connection failure:** The scanner still completes the git clone and returns findings to the user; the database write error is logged without failing the user's scan.

---

## 8. Acceptance Tests

1. **Real Findings Display (Must Pass):** Pasting a public GitHub URL with exposed keys calls `POST /api/v1/scan` and renders the real detected file paths, line numbers, and masked tokens (`••••`) in the UI (not `STATIC_FINDINGS`).
2. **Database Persistence (Must Pass):** Every completed scan writes a record to the `Scan` table, retrievable via `GET /api/v1/scans`.
3. **Sign In & OAuth (Must Pass):** Clicking "Sign In" in the header opens the authentication dialog with working GitHub & Google sign-in options.
4. **Denial Test (Must Be Denied):** Unauthenticated access to private scan history of another user (`GET /api/v1/scans/private/:userId`) must be denied with `HTTP 401` or `HTTP 403`.

---

## 9. Out of Scope for this Change
- Stripe Checkout webhooks and payment processing (reserved for subsequent billing change).
- GitHub App organization-wide PR automated comment installation.

---

## 10. Branch & Rollback Plan
- **Branch:** `fix/dynamic-scanner-cloud-db-auth`
- **Rollback:** `git checkout main -- frontend/src/components/SignatureConsole.tsx frontend/src/app/page.tsx backend/prisma/schema.prisma backend/src/routes/scan.js`
