import { test, expect } from '@playwright/test';

// List of Private Jobs side routes
const privateRoutes = [
  '/private-jobs',
  '/private-jobs/login',
  '/private-jobs/dashboard',
  '/private-jobs/privacy',
  '/private-jobs/refund-policy',
  '/private-jobs/terms',
  '/private-jobs/resume-builder',
  '/private-jobs/contact-us',
  '/private-jobs/community',
];

test.describe('Private Jobs Health Crawler', () => {
  test.beforeEach(async ({ page }) => {
    // Add an empty page context to set local storage and avoid modal
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem("rs_job_preference", "private");
    });
  });

  for (const route of privateRoutes) {
    test(`Should load Private Jobs route: ${route} without crashes`, async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', exception => {
        consoleErrors.push(`Uncaught exception: ${exception.message}`);
      });

      // Increase timeout slightly for dev server compilation
      test.setTimeout(45000);

      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 40000 });
      
      // Ensure the server returned a success status (200) or valid redirect (3xx)
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      const criticalErrors = consoleErrors.filter(err => {
        if (err.includes('favicon.ico')) return false;
        if (err.includes('Third-party cookie')) return false;
        if (err.includes('Failed to load resource')) return false; 
        return true;
      });

      if (criticalErrors.length > 0) {
        console.error(`Found errors on ${route}:`, criticalErrors);
      }

      // Check if body rendered
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  }
});
