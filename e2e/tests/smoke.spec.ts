import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Critical Health Checks
 *
 * Run these first to catch fundamental breakage fast.
 * If smoke tests fail, don't bother running the full suite.
 *
 * Usage: npx playwright test smoke.spec.ts
 */

test.describe('Smoke Tests', () => {
  test('API health check', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
  });

  test('home page loads with movies', async ({ page }) => {
    await page.goto('/');

    // App shell renders
    await expect(page.getByRole('searchbox')).toBeVisible();

    // Movies load from API
    await expect(page.getByTestId('movie-card').first()).toBeVisible({ timeout: 10000 });

    // Pagination present
    await expect(page.getByRole('navigation', { name: /pagination/i })).toBeVisible();
  });

  test('search returns results', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Type a search
    await page.getByRole('searchbox').fill('action');
    await page.waitForTimeout(500);

    // Results appear
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });

  test('movie detail page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Click first movie
    await page.getByTestId('movie-card').first().click();

    // Detail page renders
    await expect(page).toHaveURL(/\/movies\/\d+/);
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  });

  test('can navigate back to home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Go to detail
    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Back to home
    await page.getByRole('link', { name: /back to browse/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });
});
