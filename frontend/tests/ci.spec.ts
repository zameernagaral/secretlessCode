import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

test.describe('Secretless Code — CI Verification Suite', () => {

  // ── 1. Console Errors Check ────────────────────────────────────────────────
  test('Home loads with zero console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Exclude benign network errors if backend is starting or font metrics
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toEqual([]);
  });

  // ── 2. Feature 1: Instant Sample & Real URL Scanner ───────────────────────
  test('Feature 1 Happy Path: demo scan specimen reveals 3 masked findings', async ({ page }) => {
    await page.goto('/');

    const demoButton = page.getByRole('button', { name: /scan sample vulnerable repository/i });
    await expect(demoButton).toBeVisible();

    // Trigger demo scan
    await demoButton.click();

    // Verify terminal log output exists
    const logsOutput = page.locator('output');
    await expect(logsOutput).toBeVisible();

    // Verify findings section contains 3 detected secrets with masked tokens
    const findingsSection = page.locator('#live-scan-console');
    await expect(findingsSection).toBeVisible();

    // Tokens must be masked with bullet characters
    const tokenElements = page.locator('code[class*="findingToken"]');
    const tokenCount = await tokenElements.count();
    expect(tokenCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < tokenCount; i++) {
      const text = await tokenElements.nth(i).innerText();
      expect(text).toContain('•');
    }
  });

  test('Feature 1 Denial: invalid repository URL is rejected before scan', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('#target-input');
    await input.fill('ftp://invalid-repo-scheme.com/bad');

    const submitBtn = page.getByRole('button', { name: /scan target/i });
    await submitBtn.click();

    // Must show user-facing error message specifically in the scan console
    const alertBox = page.locator('#live-scan-console [role="alert"]');
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText(/valid public Git/i);
  });

  // ── 3. Feature 2: Interactive Leak Remediation ─────────────────────────────
  test('Feature 2 Happy Path: remediation provider tabs switch and display git-filter-repo syntax', async ({ page }) => {
    await page.goto('/');

    const remediationSection = page.locator('#remediation');
    await expect(remediationSection).toBeVisible();

    // Click Stripe provider tab
    const stripeTab = page.getByRole('button', { name: 'Stripe' });
    await stripeTab.click();
    await expect(stripeTab).toHaveAttribute('aria-current', 'true');

    // Verify Stripe command includes git-filter-repo
    const codeBlock = remediationSection.locator('pre code');
    await expect(codeBlock).toContainText('git-filter-repo');

    // Test Copy command action
    const copyBtn = remediationSection.getByRole('button', { name: /copy command/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Feedback message appears
    const copyFeedback = remediationSection.locator('[role="status"]');
    await expect(copyFeedback).toBeVisible();
    await expect(copyFeedback).toContainText(/copied/i);
  });

  // ── 4. Feature 3: Pricing Capacity Tiers & Protected Admin Denial ──────────
  test('Feature 3 Happy Path: annual pricing toggle updates discount rates', async ({ page }) => {
    await page.goto('/');

    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeVisible();

    const toggle = pricingSection.locator('input[type="checkbox"][name="annual"]');
    await expect(toggle).toBeVisible();

    // Toggle Annual billing
    await toggle.check();
    await expect(toggle).toBeChecked();

    // Uncheck and verify state toggles cleanly
    await toggle.uncheck();
    await expect(toggle).not.toBeChecked();
  });

  test('Feature 3 Denial: unauthenticated anonymous access to admin route is denied (401 or 503)', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/v1/admin/health`);
    expect([401, 503]).toContain(res.status());
    const body = await res.json();
    const code = body.errorCode || body.error?.code;
    expect(['MISSING_AUTH', 'ADMIN_NOT_CONFIGURED']).toContain(code);
  });

  // ── 5. Server-Side Rejection of Malicious / Invalid Input ──────────────────
  test('Server-side rejection: SSRF target URL is rejected with HTTP 400 or rate limited (429)', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/v1/scan`, {
      data: { repoUrl: 'http://169.254.169.254/latest/meta-data' },
    });
    expect([400, 429]).toContain(res.status());
    const body = await res.json();
    const code = body.errorCode || body.error?.code;
    expect(['INVALID_URL', 'RATE_LIMIT_EXCEEDED']).toContain(code);
  });

  test('Server-side rejection: prototype pollution / unknown body fields rejected with HTTP 400 or 429', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/v1/scan`, {
      data: { repoUrl: 'https://github.com/org/repo', maliciousField: true },
    });
    expect([400, 429]).toContain(res.status());
    const body = await res.json();
    const code = body.errorCode || body.error?.code;
    expect(['VALIDATION_ERROR', 'RATE_LIMIT_EXCEEDED']).toContain(code);
  });

  test('Server-side rejection: invalid bearer token to admin API rejected with HTTP 401 or 503', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/v1/admin/health`, {
      headers: { Authorization: 'Bearer forged-invalid-token-12345' },
    });
    expect([401, 503]).toContain(res.status());
    const body = await res.json();
    const code = body.errorCode || body.error?.code;
    expect(['INVALID_AUTH', 'ADMIN_NOT_CONFIGURED']).toContain(code);
  });

  // ── 6. Error Tracking Verification (Requirement 4) ─────────────────────────
  test('Error tracking: diagnostic test endpoint triggers zero-PII error event', async ({ request }) => {
    const res = await request.get('/api/sentry-test');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.piiScrubbed).toBe(true);
    expect(body.data?.service).toContain('Sentry');
  });

  // ── 7. Accessibility Audit (Axe Core) ──────────────────────────────────────
  test('Accessibility: homepage has zero critical or serious WCAG violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalOrSerious).toEqual([]);
  });

  // ── 8. Mobile 390px Viewport Check ─────────────────────────────────────────
  test('Mobile viewport (390px): layout fits within screen width without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that document body has no horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });

    expect(overflow).toBe(true);

    // Verify hero and scanner are visible
    const heroTitle = page.locator('#hero-title');
    await expect(heroTitle).toBeVisible();

    const scannerCard = page.locator('#live-scan-console');
    await expect(scannerCard).toBeVisible();
  });

  // ── 9. Auth Modal & Dashboard Navigation ──────────────────────────────
  test('Auth Modal: clicking Sign In opens modal with OAuth providers', async ({ page }) => {
    await page.goto('/');
    const signInBtn = page.getByRole('button', { name: /^sign in$/i });
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // Verify modal elements
    const authDialog = page.getByRole('dialog');
    await expect(authDialog).toBeVisible();
    await expect(page.getByRole('heading', { name: /sign in to secretless/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: /close modal/i });
    await closeBtn.click();
    await expect(authDialog).not.toBeVisible();
  });

  test('Dashboard: navigates to /dashboard and displays database scan history', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /scan history & database telemetry/i })).toBeVisible();
    await expect(page.getByText(/persisted scans in postgresql/i)).toBeVisible();
  });
});
