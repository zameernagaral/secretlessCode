# 🛡️ Secretless Code — Credential Scanner Web Dashboard

> **Instant, ephemeral credential leak auditing for public GitHub repositories.**
> Paste any public GitHub repo URL and get a detailed report of exposed API keys, cloud tokens, database URIs, and private secrets — powered by **Gitleaks** with client-side secret masking and zero code persistence.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────┐
                                  │      Next.js Frontend     │
                                  │ (Vercel / Port 3000)      │
                                  └─────────────┬─────────────┘
                                                │
                                    POST /api/scan { repoUrl }
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │    Express REST Backend   │
                                  │ (Render / Port 4000)      │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
                 ▼                              ▼                              ▼
      [ Strict URL Validation ]      [ Ephemeral Shallow Clone ]       [ Gitleaks Subprocess ]
     - Rejects non-GitHub URLs      - git clone --depth 1            - Scans isolated directory
     - Mitigates SSRF/traversal     - Isolated /tmp/ sandbox         - Captures JSON findings
     - Validates public access      - Max 60MB repo size cap         - Guaranteed try/finally purge
```

### Key Security & Design Guarantees
1. **Zero Code Persistence**: Repositories are cloned into an ephemeral temp sandbox with `--depth 1` and deleted immediately inside a `finally` block, ensuring no code remains on disk whether the scan succeeds or fails.
2. **Client-Side Secret Masking**: The frontend never renders raw credential strings (e.g. `AKIAIOSFODNN7****` or `sk_test_••••••••`), guarding against shoulder surfing or screen recordings.
3. **SSRF & Command Injection Mitigation**: URL inputs are strictly verified against GitHub's canonical URL structure. Non-GitHub URLs, localhost, file schemes, and malicious shell characters are rejected upfront.
4. **Timeouts & Resource Capping**: Clones and scans are bounded by configurable timeouts (25s) and repo size caps (60MB) to prevent server hangs or resource exhaustion.

---

## 📁 Repository Structure

```
secretlessCode/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── server.js         # Server entrypoint with CORS & health check
│   │   ├── routes/
│   │   │   └── scan.js       # POST /api/scan route
│   │   ├── services/
│   │   │   ├── scanner.js    # Subprocess execution, clone & try/finally cleanup
│   │   │   └── ruleSeverity.js # Gitleaks rule to Critical/High/Medium mapping
│   │   └── utils/
│   │       └── validator.js  # Strict GitHub URL & SSRF validation
│   ├── Dockerfile            # Multi-stage container with Git & Gitleaks
│   ├── render.yaml           # 1-click deployment configuration for Render
│   └── package.json
├── frontend/                 # Next.js 14 + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx      # Main dashboard with live scanning states
│   │   │   └── globals.css   # Cyber dark theme & glassmorphism
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── ScanForm.tsx  # URL input & quick test pills
│   │   │   ├── ScanProgress.tsx # Live pipeline animation
│   │   │   ├── StatsCards.tsx# Severity metrics breakdown
│   │   │   ├── ResultsTable.tsx # Masked findings table with search & export
│   │   │   └── ErrorAlert.tsx# Actionable error diagnostics
│   │   └── utils/
│   │       └── maskSecret.ts # Client-side credential masking logic
│   ├── vercel.json           # Vercel deployment specification
│   └── package.json
└── dummy-test-samples/       # Mock test files seeded with fake credentials
    ├── sample-repo-1-aws-stripe/
    ├── sample-repo-2-db-tokens/
    └── sample-repo-3-ssh-keys/
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Git**
- *(Optional)* **Gitleaks CLI**: `brew install gitleaks` (macOS) or download from [Gitleaks Releases](https://github.com/gitleaks/gitleaks/releases). If Gitleaks is not installed locally, the backend includes an automated fallback heuristic scanner so scans work immediately.

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```
Backend will start on: **`http://localhost:4000`**  
Verify health check: `curl http://localhost:4000/api/health`

### 3. Start the Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on: **`http://localhost:3000`**

Open **http://localhost:3000** in your browser.

---

## 🧪 Testing with Dummy Repositories

### Option A: 1-Click Instant Mock Preview
Click the **"Instant Demo Mock Preview"** button on the dashboard to test the complete visualization with dummy AWS keys, Stripe tokens, and database URIs without needing an active scan.

### Option B: Pointing to a Public GitHub Repository
1. Paste any public GitHub repo URL (e.g. `https://github.com/octocat/Hello-World`).
2. Click **"Scan Repository"**.
3. Watch the live scanning pipeline transition from validation to cloning, Gitleaks analysis, and findings visualization.

---

## 🌐 Production Deployment

### 1. Backend on Render
1. Push this repository to GitHub.
2. Log in to [Render](https://render.com).
3. Create a **New Web Service** and select your repository.
4. Choose **Docker** environment (Render will automatically detect `backend/Dockerfile`, which compiles Gitleaks v8 and Git).
5. Set the Root Directory to `backend`.
6. Add environment variables:
   - `PORT`: `4000`
   - `CORS_ORIGIN`: Your Vercel frontend URL (e.g. `https://secretless-code.vercel.app`)

*(Or simply use the included [backend/render.yaml](backend/render.yaml) Blueprint).*

### 2. Frontend on Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository and set the **Root Directory** to `frontend`.
3. Framework Preset: **Next.js**.
4. In **Environment Variables**, set:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL (e.g. `https://secretless-backend.onrender.com`).
5. Click **Deploy**.

---

## 🔒 Security & Demo Hygiene
- **Zero Committed Secrets**: This repository does not contain any active credentials.
- **Pre-commit Hook**: A pre-commit scanning hook is provided in `.githooks/pre-commit`. Enable it locally via:
  ```bash
  git config core.hooksPath .githooks
  ```
- All mock credentials in `dummy-test-samples/` are explicitly marked with fake values (e.g. `AKIAIOSFODNN7EXAMPLE`) solely for detection verification.
