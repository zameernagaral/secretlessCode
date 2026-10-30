# CHANGE: Normalize Scan Findings, Deduplicate Clean File Paths & Show Real Key (docs/CHANGE.md)

## 1. Goal
Deduplicate scan findings by repo-relative file path and line number, showing only the real secret key from the file instead of internal temp directory paths or dummy redacted values.

---

## 2. Why
- **Problem 1 (Leaked Server Path):** Gitleaks outputs absolute file paths from the shallow clone directory (`/tmp/secretless-scan-407fe1a7798227f5/config.js:1`), exposing internal server directory paths to the user.
- **Problem 2 (Duplicate Findings):** In `auto` mode, Gitleaks and the Built-in engine both detect the credential in `config.js:1`. Because Gitleaks reports `/tmp/.../config.js` while Built-in reports `config.js`, the deduplication map (`${filePath}:${lineNumber}`) fails to match them, producing two findings for the same leaked credential.
- **Problem 3 (Dummy Redacted Token `R••••••`):** Gitleaks was invoked with `--redact`, causing it to output the literal word `"REDACTED"` into the scan report. When passed through `maskRawMatch()`, `"REDACTED"` was masked into `"R••••••"`, obscuring the real key prefix (`AQ.A••••••••••••••••`) extracted from the file.
- **Problem 4 (Uncommitted / Undeployed Code):** The live site at `secretless-code.vercel.app` is connected to deployed cloud infrastructure; changes exist only locally until committed and pushed to trigger CD workflows.

---

## 3. Files Permitted to Edit & Create

### Files You May Edit:
1. `backend/src/services/engines/gitleaks.js` — Remove `--redact` flag so the engine captures the actual raw match in memory for server-side masking; normalize `filePath` to be repo-relative using `path.relative()`.
2. `backend/src/services/engines/truffleHog.js` — Normalize `filePath` to be repo-relative using `path.relative()`.
3. `backend/src/services/engineRouter.js` — Enforce path normalization before `deduplicateFindings()` so multi-engine scans merge identical `filePath:lineNumber` pairs and retain the authentic secret match.
4. `frontend/src/components/SignatureConsole.tsx` — Strip any temporary clone path prefixes defensively; generate clean `git-filter-repo` commands and file location badges (`config.js:1`).
5. `frontend/src/components/ResultsTable.tsx` — Clean file path in results table and ensure GitHub link points to `https://github.com/{repo}/blob/HEAD/{cleanFilePath}#L{lineNumber}`.

### New Files You May Create:
*None.*

### Files You Must NOT Touch:
- `backend/prisma/schema.prisma`
- `backend/src/middlewares/auth.js`
- `backend/src/routes/scansHistory.js`
- `docs/RULES.md`
- `docs/CODEBASE.md`
- `.github/workflows/ci.yml`

---

## 4. Blast Radius
- `SignatureConsole.tsx`: Rendered on the homepage. Only impacts the display format of `location` and `filterCommand` string. Clean scan states (`findings.length === 0`) and demo scan states remain intact.
- `ResultsTable.tsx`: Rendered in scan results view. Only impacts the displayed `filePath` label and the external GitHub link.
- `engineRouter.js`: Normalizes finding paths before returning to `/api/v1/scan`, `/api/scan/upload`, and PR branch scans. Ensures all consumers receive clean repo-relative paths (`config.js:1`).

---

## 5. Design & Token Reuse
- **Reused Components:** Existing finding cards in `SignatureConsole.tsx` and rows in `ResultsTable.tsx`.
- **Reused Tokens:** `--font-mono`, `--color-text`, `--color-muted`, `--border-secondary`.
- **New Elements:** None needed.

---

## 6. Permissions Table & Data Model

### Roles & Permissions:
| Role | Run Git Scan | View Deduplicated Key | View Clean Relative Path |
| :--- | :--- | :--- | :--- |
| **Anonymous** | Yes | Yes (Masked: `AQ.A••••••••••••••••`) | Yes (`config.js:1`) |
| **Authenticated** | Yes | Yes (Masked: `AQ.A••••••••••••••••`) | Yes (`config.js:1`) |
| **Admin** | Yes | Yes (Masked: `AQ.A••••••••••••••••`) | Yes (`config.js:1`) |

### Data Model:
Unchanged. Findings are stored as JSON arrays in PostgreSQL `Scan.findings` with clean relative `filePath` attributes.

---

## 7. Failure States & Exact Error Messages

1. **Clean Scan (Zero Secrets Detected):**
   - *Message:* `"Zero exposed secrets detected. Scanned commit tree passed all Gitleaks pattern evaluations."`
2. **Invalid Repository URL:**
   - *Message:* `"Please enter a valid public Git repository URL (e.g., https://github.com/owner/repo)."`
3. **Private or Non-Existent Repository:**
   - *Message:* `"Repository not found or private. Anonymous scans only support public repositories."`

### Edge Cases:
1. **Secret nested in deep subfolder (`backend/src/config/keys.js`):** `path.relative` strips only the ephemeral `/tmp/secretless-*` root, preserving `backend/src/config/keys.js`.
2. **Multiple distinct secrets in the same file on different lines:** Deduplication keys on `${filePath}:${lineNumber}`, keeping all unique secret locations.
3. **Empty or unparseable engine match:** Falls back safely to masked token `••••••••` without breaking UI rendering.

---

## 8. Acceptance Tests

1. **Single Deduplicated Finding (Must Pass):** Scanning `https://github.com/zameernagaral/secretlesscodedemo` returns exactly **1** finding in the findings list instead of 2.
2. **Repo-Relative File Path (Must Pass):** The finding displays location as `config.js:1`, containing zero occurrences of `/tmp/` or `secretless-scan-`.
3. **Real Key Prefix (Must Pass):** The finding displays the authentic masked key from the file (`AQ.A••••••••••••••••`), and does not display the dummy `R••••••` value.
4. **Valid Git Remediation Command (Must Pass):** Clicking "Copy git-filter-repo command" copies `git-filter-repo --invert-paths --path config.js --force`.
5. **Denial Test (Must Be Denied):** SSRF attempt submitting `http://127.0.0.1:4000` or `http://localhost` must be denied with `HTTP 400` (`INVALID_URL`).

---

## 9. Out of Scope
- Adding new regex rules or secret detector types.
- Database schema migrations or authentication changes.
- Direct remote production server modifications (deployment runs via GitHub Actions CI/CD after push).

---

## 10. Branch Name & Rollback Plan
- **Branch:** `fix/normalize-findings-clean-key`
- **Rollback Command:**
  ```bash
  git checkout main -- backend/src/services/engines/gitleaks.js backend/src/services/engines/truffleHog.js backend/src/services/engineRouter.js frontend/src/components/SignatureConsole.tsx frontend/src/components/ResultsTable.tsx docs/CHANGE.md
  ```
