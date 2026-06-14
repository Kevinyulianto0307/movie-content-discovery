import { test, expect } from '@playwright/test';

/**
 * Search Smoke Tests
 *
 * Verifies search functionality works at a basic level.
 * Detailed search flows are in critical-flows.spec.ts.
 */

test.describe('Search', () => {
  test('search filters results', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await searchInput.fill('adventure');
    await page.waitForTimeout(500);

    // Should still show results (filtered)
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Sort control should show relevance option
    await expect(page.getByLabel(/sort by/i)).toHaveValue('relevance');
  });

  test('empty search shows message', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await searchInput.fill('xyznonexistentmovie12345');

    await expect(page.getByText(/no movies match/i)).toBeVisible({ timeout: 5000 });
  });
});
