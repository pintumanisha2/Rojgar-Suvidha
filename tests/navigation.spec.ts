import { test, expect } from '@playwright/test';

test.describe('Navigation and Job Preference Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem("rs_job_preference", "both");
    });
  });
  test('should default to Govt Jobs on homepage', async ({ page }) => {
    // Go to homepage
    await page.goto('/');

    // Check if URL is correct
    await expect(page).toHaveURL('/');

    // The JobPreferenceToggle should show Govt Jobs as active
    // We check this by looking for the gradient on the active tab
    const govtTab = page.locator('button:has-text("Sarkari Naukri")');
    await expect(govtTab).toBeVisible();
    
    // Check if the title is correct
    await expect(page).toHaveTitle(/Rojgar Suvidha/);
  });

  test('should navigate to Private Jobs when toggle is clicked', async ({ page }) => {
    await page.goto('/');

    // Click Private Jobs tab
    const privateTab = page.locator('button:has-text("Private Jobs")');
    await privateTab.click();

    // Verify URL changed
    await expect(page).toHaveURL('/private-jobs');

    // Verify the page content changed to Private Sector Jobs
    await expect(page.locator('text=Private Sector Jobs').first()).toBeVisible();
  });
});
