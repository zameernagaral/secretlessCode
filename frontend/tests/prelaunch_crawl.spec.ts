import { test, expect } from '@playwright/test';

test('pre-launch crawl: console errors, links, and buttons', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Crawl Homepage
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Verify internal links on homepage
  const links = await page.locator('a[href^="/"]').all();
  for (const link of links) {
    const href = await link.getAttribute('href');
    if (href && !href.startsWith('/#') && href !== '/') {
      const resp = await page.request.get(href);
      expect(resp.status(), `Link ${href} should return 200`).toBe(200);
    }
  }

  // 2. Crawl /dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // 3. Crawl /style-tile
  await page.goto('/style-tile');
  await page.waitForLoadState('networkidle');

  // 4. Verify 404 handler
  const notFoundResp = await page.request.get('/this-path-does-not-exist');
  expect(notFoundResp.status()).toBe(404);

  // 5. Verify robots.txt & sitemap.xml
  const robotsResp = await page.request.get('/robots.txt');
  expect(robotsResp.status()).toBe(200);
  const robotsText = await robotsResp.text();
  expect(robotsText).toContain('sitemap.xml');

  const sitemapResp = await page.request.get('/sitemap.xml');
  expect(sitemapResp.status()).toBe(200);
  const sitemapText = await sitemapResp.text();
  expect(sitemapText).toContain('<loc>https://secretlesscode.com/</loc>');

  // Assert zero uncaught fatal console errors
  const fatalErrors = consoleErrors.filter(
    (err) => !err.includes('Clerk:') && !err.includes('Sentry:')
  );
  expect(fatalErrors).toEqual([]);
});

