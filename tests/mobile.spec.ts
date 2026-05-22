import { test, expect } from '@playwright/test';

// Only run these tests in mobile environments
test.describe('Mobile Specific UI Tests', () => {
  // Use the Mobile Chrome profile configured in playwright.config.ts
  test.use({ viewport: { width: 390, height: 844 } }); // e.g. iPhone 12 / Pixel dimensions

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem("rs_job_preference", "both");
    });
  });

  test('should open mobile hamburger menu on Private Jobs page', async ({ page }) => {
    await page.goto('/private-jobs');

    // Find and click the hamburger menu button in the PrivateJobsNavbar
    const menuButton = page.locator('button[aria-label="Toggle mobile menu"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Verify the mobile drawer opens and displays Quick Navigation
    const mobileMenu = page.locator('text=Quick Navigation');
    await expect(mobileMenu).toBeVisible();
    
    // Verify an item inside the mobile menu is visible
    await expect(page.locator('text=AI Mock Interview').last()).toBeVisible();
  });
});
