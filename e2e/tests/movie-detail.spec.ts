import { test, expect } from '@playwright/test';

/**
 * Movie Detail Page Smoke Tests
 *
 * Verifies the detail page loads with expected sections.
 * Navigation flows are in critical-flows.spec.ts.
 */

test.describe('Movie Detail', () => {
  test('displays all expected sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Navigate to detail
    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Core sections visible
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible(); // Title
    await expect(page.getByRole('heading', { name: /top cast/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /crew/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /similar movies/i })).toBeVisible();

    // Back link present
    await expect(page.getByRole('link', { name: /back to browse/i })).toBeVisible();
  });

  test('direct URL access works', async ({ page, request }) => {
    // Get a valid movie ID
    const listResponse = await request.get('http://localhost:3000/api/movies?pageSize=1');
    const { data } = await listResponse.json();

    if (data.length > 0) {
      await page.goto(`/movies/${data[0].id}`);
      await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    }
  });
});
