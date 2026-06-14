import { test, expect } from '@playwright/test';

/**
 * Home Page Smoke Tests
 *
 * Verifies the page loads and core elements render.
 * Detailed interaction flows are in critical-flows.spec.ts.
 */

test.describe('Home Page', () => {
  test('loads and displays movie grid', async ({ page }) => {
    await page.goto('/');

    // Core elements visible
    await expect(page.getByRole('searchbox', { name: /search/i })).toBeVisible();
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: /pagination/i })).toBeVisible();

    // View toggle present
    await expect(page.getByRole('button', { name: /grid/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /list/i })).toBeVisible();

    // Sort control present
    await expect(page.getByLabel(/sort by/i)).toBeVisible();
  });

  test('pagination works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // First page - previous disabled
    await expect(page.getByRole('button', { name: /previous/i })).toBeDisabled();

    // Navigate forward
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByRole('button', { name: /previous/i })).toBeEnabled();
  });
});
