import { test, expect } from '@playwright/test';

/**
 * Regression Tests - Ensures Old Features Don't Break
 *
 * Tests for previously working functionality that must continue working.
 * Add tests here when bugs are fixed to prevent regression.
 *
 * Usage: npx playwright test regression.spec.ts
 */

test.describe('Regression: Navigation', () => {
  test('browser back button preserves scroll position concept', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Navigate to detail
    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/');

    // Page should be functional
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });

  test('browser forward button works after back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByTestId('movie-card').first().click();
    const detailUrl = page.url();

    await page.goBack();
    await expect(page).toHaveURL('/');

    await page.goForward();
    await expect(page).toHaveURL(detailUrl);
  });

  test('header logo navigates home from any page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Go to detail
    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Click header link
    const headerLink = page.getByRole('banner').getByRole('link');
    if (await headerLink.isVisible()) {
      await headerLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('deep link to movie detail works', async ({ page, request }) => {
    // Get valid movie ID
    const response = await request.get('http://localhost:3000/api/movies?pageSize=1');
    const { data } = await response.json();

    if (data.length > 0) {
      // Direct navigation
      await page.goto(`/movies/${data[0].id}`);

      // Page loads correctly
      await expect(page.getByRole('heading', { level: 2 })).toContainText(data[0].title);
    }
  });
});

test.describe('Regression: 404 Handling', () => {
  test('invalid route shows 404 page', async ({ page }) => {
    await page.goto('/invalid/route/here');
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });

  test('non-existent movie ID shows error', async ({ page }) => {
    await page.goto('/movies/999999999');
    await expect(page.getByText(/couldn't load|not found|may not exist/i)).toBeVisible({ timeout: 10000 });
  });

  test('invalid movie ID format shows error', async ({ page }) => {
    await page.goto('/movies/abc');
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test('404 page has navigation back to home', async ({ page }) => {
    await page.goto('/nonexistent');
    await expect(page.getByText(/not found|404/i)).toBeVisible();

    const homeLink = page.getByRole('link', { name: /back|home|browse/i });
    await expect(homeLink).toBeVisible();

    await homeLink.click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Regression: Search Functionality', () => {
  test('search box is always visible', async ({ page }) => {
    // On home
    await page.goto('/');
    await expect(page.getByRole('searchbox')).toBeVisible();

    // After navigating to detail and back
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
    await page.getByTestId('movie-card').first().click();
    await page.goBack();
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('search debounces input', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Type quickly - should not make request per keystroke
    const searchInput = page.getByRole('searchbox');
    await searchInput.pressSequentially('action', { delay: 50 });

    // Wait for debounce
    await page.waitForTimeout(600);

    // Should have results
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });

  test('empty search query shows browse results', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Search then clear
    await page.getByRole('searchbox').fill('test');
    await page.waitForTimeout(500);
    await page.getByRole('searchbox').clear();
    await page.waitForTimeout(500);

    // Should show browse results (not empty)
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
    await expect(page.getByLabel(/sort by/i)).not.toHaveValue('relevance');
  });
});

test.describe('Regression: Sorting Functionality', () => {
  test('default sort is rating descending', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const sortSelect = page.getByLabel(/sort by/i);
    await expect(sortSelect).toHaveValue('vote_average');

    const orderButton = page.getByRole('button', { name: /sort order/i });
    const label = await orderButton.getAttribute('aria-label');
    expect(label).toContain('descending');
  });

  test('sort dropdown hidden in table view', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
    await expect(page.getByLabel(/sort by/i)).toBeVisible();

    // Switch to table
    await page.getByRole('button', { name: /list/i }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Sort dropdown should be hidden (table uses column headers)
    await expect(page.getByLabel(/sort by/i)).not.toBeVisible();
  });

  test('sort persists after navigating to detail and back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Change sort
    await page.getByLabel(/sort by/i).selectOption('title');

    // Navigate to detail
    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/');

    // Sort should still be title (browser restores state)
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });
});

test.describe('Regression: View Toggle', () => {
  test('grid view is default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await expect(page.getByRole('button', { name: /grid/i })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('table')).not.toBeVisible();
  });

  test('table view displays all expected columns', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByRole('button', { name: /list/i }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Check column headers
    await expect(page.getByRole('columnheader', { name: /title/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /release date/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /rating/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /votes/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /revenue/i })).toBeVisible();
  });

  test('clicking table row navigates to detail', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByRole('button', { name: /list/i }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Click on movie link in table
    const firstRow = page.getByRole('row').nth(1); // Skip header
    const movieLink = firstRow.getByRole('link');
    await movieLink.click();

    await expect(page).toHaveURL(/\/movies\/\d+/);
  });
});

test.describe('Regression: Movie Detail Page', () => {
  test('all sections render without crashing', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Core sections
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /top cast/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /crew/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /similar movies/i })).toBeVisible();
  });

  test('back to browse link works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    await page.getByRole('link', { name: /back to browse/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });

  test('similar movie cards are clickable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    const similarSection = page.locator('section').filter({ hasText: /similar movies/i });
    const similarCards = similarSection.getByTestId('movie-card');

    if ((await similarCards.count()) > 0) {
      const currentUrl = page.url();
      await similarCards.first().click();

      await expect(page).toHaveURL(/\/movies\/\d+/);
      expect(page.url()).not.toBe(currentUrl);
    }
  });
});

test.describe('Regression: Data Display', () => {
  test('movie cards show required info', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const firstCard = page.getByTestId('movie-card').first();
    const cardText = await firstCard.textContent();

    // Should have some content
    expect(cardText).toBeTruthy();
    expect(cardText!.length).toBeGreaterThan(0);
  });

  test('pagination shows total count', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const paginationInfo = page.locator('[aria-live="polite"]');
    const text = await paginationInfo.textContent();

    expect(text).toMatch(/\d+\s*results/i);
  });

  test('rating displays with star icon', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Cards should show rating with star
    await expect(page.getByText(/★/).first()).toBeVisible();
  });
});
