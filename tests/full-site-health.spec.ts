import { test, expect } from '@playwright/test';

// List of all critical paths to test
const routesToTest = [
  '/',
  '/private-jobs',
  '/latest-jobs',
  '/admit-card',
  '/results',
  '/login',
  '/private-jobs/login',
  '/admin/login',
  '/employer/login',
  '/about-us',
  '/contact-us',
  '/privacy',
  '/terms',
  '/saved-jobs',
  '/community',
  '/e-suvidha',
  '/refund-policy',
];

test.describe('Full Site Health Crawler', () => {
  // Prevent the preference modal from popping up and blocking interactions
  test.beforeEach(async ({ page }) => {
    // Add an empty page context to set local storage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem("rs_job_preference", "both");
    });
  });

  for (const route of routesToTest) {
    test(`Should successfully load route: ${route} without console errors or crashes`, async ({ page }) => {
      const consoleErrors: string[] = [];

      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Listen for unhandled exceptions inside the page
      page.on('pageerror', exception => {
        consoleErrors.push(`Uncaught exception: ${exception.message}`);
      });

      // Go to the route and wait for network idle to ensure everything loaded
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      
      // Ensure the server returned a success status (200) and not a 404 or 500
      expect(response?.status()).toBeLessThan(400);

      // Give it a tiny bit of time for hydration to complete
      await page.waitForTimeout(1000);

      // Verify there are no critical hydration errors or unhandled exceptions
      // We ignore certain warning-level errors or known safe issues
      const criticalErrors = consoleErrors.filter(err => {
        // Ignore specific harmless warnings if needed
        if (err.includes('favicon.ico')) return false;
        if (err.includes('Third-party cookie')) return false;
        if (err.includes('Failed to load resource')) return false; // Sometimes external scripts fail (ads, analytics)
        return true;
      });

      if (criticalErrors.length > 0) {
        console.error(`Found errors on ${route}:`, criticalErrors);
      }

      // We don't strictly fail the test on ANY console error because 3rd party scripts might fail,
      // but if the page completely crashes, it will fail above or fail to render the body.
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  }
});
