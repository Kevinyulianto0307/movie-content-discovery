import { test, expect } from '@playwright/test';

/**
 * Navigation Smoke Tests
 *
 * Verifies basic navigation and 404 handling.
 */

test.describe('Navigation', () => {
  test('browser back/forward works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Navigate to detail
    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Back
    await page.goBack();
    await expect(page).toHaveURL('/');

    // Forward
    await page.goForward();
    await expect(page).toHaveURL(/\/movies\/\d+/);
  });

  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/some-random-nonexistent-path');
    await expect(page.getByText(/not found|404/i)).toBeVisible();

    // Has way to get back home
    const homeLink = page.getByRole('link', { name: /back to browse|home|go back/i });
    await expect(homeLink).toBeVisible();
  });
});
