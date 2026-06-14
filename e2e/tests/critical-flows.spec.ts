import { test, expect } from '@playwright/test';

/**
 * Critical User Flows - E2E Tests
 *
 * E2E tests are expensive (slow, flaky). We focus ONLY on:
 * 1. Happy paths - the journeys most users take
 * 2. Critical integrations - where frontend meets backend
 *
 * NOT tested here (covered elsewhere):
 * - State management logic → unit tests (useMovieBrowse hook)
 * - Error handling → integration tests (API) + component tests (UI)
 * - Pagination edge cases → integration tests
 * - Input validation → integration tests
 */

test.describe('Critical Flow: Browse → Detail → Similar', () => {
  test('user can discover movies through the similarity feature', async ({ page }) => {
    // Step 1: Land on home, see movies
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Step 2: Click a movie to see details
    const firstMovieTitle = await page.getByTestId('movie-card').first().locator('div').first().textContent();
    await page.getByTestId('movie-card').first().click();

    await expect(page).toHaveURL(/\/movies\/\d+/);
    await expect(page.getByRole('heading', { level: 2 })).toContainText(firstMovieTitle || '');

    // Step 3: Find and click a similar movie
    await expect(page.getByRole('heading', { name: /similar movies/i })).toBeVisible();
    const similarSection = page.locator('section').filter({ hasText: /similar movies/i });
    const similarCards = similarSection.getByTestId('movie-card');

    if ((await similarCards.count()) > 0) {
      const similarMovieTitle = await similarCards.first().locator('div').first().textContent();
      const firstDetailUrl = page.url();
      await similarCards.first().click();

      // Should navigate to a different movie
      await expect(page).toHaveURL(/\/movies\/\d+/);
      expect(page.url()).not.toBe(firstDetailUrl);
      await expect(page.getByRole('heading', { level: 2 })).toContainText(similarMovieTitle || '');
    }

    // Step 4: Return to browse
    await page.getByRole('link', { name: /back to browse/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });
});

test.describe('Critical Flow: Search → Detail', () => {
  test('user can search and view a movie from results', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Search for something
    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await searchInput.fill('matrix');
    await page.waitForTimeout(500);

    // Should see search results
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Click on a result
    const resultTitle = await page.getByTestId('movie-card').first().locator('div').first().textContent();
    await page.getByTestId('movie-card').first().click();

    // Should see detail page for that movie
    await expect(page).toHaveURL(/\/movies\/\d+/);
    await expect(page.getByRole('heading', { level: 2 })).toContainText(resultTitle || '');
  });
});

test.describe('Critical Flow: Search with Sorting', () => {
  test('user can sort search results by different criteria', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Search
    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await searchInput.fill('night');
    await page.waitForTimeout(500);
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Sort control should be visible with relevance default
    const sortSelect = page.getByLabel(/sort by/i);
    await expect(sortSelect).toBeVisible();
    await expect(sortSelect).toHaveValue('relevance');

    // Change to sort by rating
    await sortSelect.selectOption('vote_average');
    await expect(sortSelect).toHaveValue('vote_average');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });
});

test.describe('Critical Flow: View Modes', () => {
  test('user can switch between grid and table views', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Switch to table view
    await page.getByRole('button', { name: /list/i }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Click column header to sort
    await page.getByRole('button', { name: /title/i }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Switch back to grid
    await page.getByRole('button', { name: /grid/i }).click();
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });
});
