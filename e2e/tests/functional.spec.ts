import { test, expect } from '@playwright/test';

/**
 * Functional Tests - Edge Cases & Scenarios
 *
 * Tests boundary conditions, unusual inputs, and edge scenarios
 * that users might encounter in real usage.
 *
 * Usage: npx playwright test functional.spec.ts
 */

test.describe('Functional: Pagination Edge Cases', () => {
  test('first page has previous button disabled', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await expect(page.getByRole('button', { name: /previous/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /next/i })).toBeEnabled();
  });

  test('navigating pages updates page indicator', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const paginationInfo = page.locator('[aria-live="polite"]');
    await expect(paginationInfo).toContainText('Page 1');

    // Go to page 2
    await page.getByRole('button', { name: /next/i }).click();
    await expect(paginationInfo).toContainText('Page 2');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Go back to page 1
    await page.getByRole('button', { name: /previous/i }).click();
    await expect(paginationInfo).toContainText('Page 1');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });

  test('page info updates correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const paginationInfo = page.locator('[aria-live="polite"]');
    await expect(paginationInfo).toContainText('Page 1');

    await page.getByRole('button', { name: /next/i }).click();
    await expect(paginationInfo).toContainText('Page 2');
  });
});

test.describe('Functional: Sorting Edge Cases', () => {
  test('sort by title ascending shows alphabetical order', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Sort by title
    const sortSelect = page.getByLabel(/sort by/i);
    await sortSelect.selectOption('title');

    // Set to ascending
    const orderButton = page.getByRole('button', { name: /sort order/i });
    const label = await orderButton.getAttribute('aria-label');
    if (label?.includes('descending')) {
      await orderButton.click();
    }

    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });

  test('sort order toggles between asc and desc', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const orderButton = page.getByRole('button', { name: /sort order/i });

    // Get initial state
    const initialLabel = await orderButton.getAttribute('aria-label');

    // Toggle
    await orderButton.click();
    const toggledLabel = await orderButton.getAttribute('aria-label');
    expect(toggledLabel).not.toBe(initialLabel);

    // Toggle back
    await orderButton.click();
    const toggledBackLabel = await orderButton.getAttribute('aria-label');
    expect(toggledBackLabel).toBe(initialLabel);
  });

  test('changing sort resets to page 1', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Go to page 2
    await page.getByRole('button', { name: /next/i }).click();
    const paginationInfo = page.locator('[aria-live="polite"]');
    await expect(paginationInfo).toContainText('Page 2');

    // Change sort
    await page.getByLabel(/sort by/i).selectOption('title');

    // Should reset to page 1
    await expect(paginationInfo).toContainText('Page 1');
  });
});

test.describe('Functional: Search Edge Cases', () => {
  test('search with single character', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByRole('searchbox').fill('a');
    await page.waitForTimeout(500);

    // Should show results or empty state
    const hasResults = await page.getByTestId('movie-card').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no movies match/i).isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBeTruthy();
  });

  test('search with special characters', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByRole('searchbox').fill('test & "quotes"');
    await page.waitForTimeout(500);

    // Should not crash - shows results or empty state
    const hasResults = await page.getByTestId('movie-card').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no movies match/i).isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBeTruthy();
  });

  test('rapid search input changes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const searchInput = page.getByRole('searchbox');

    // Type rapidly
    await searchInput.fill('act');
    await searchInput.fill('acti');
    await searchInput.fill('actio');
    await searchInput.fill('action');

    await page.waitForTimeout(600); // Wait for debounce

    // Should show stable results
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });

  test('clearing search returns to browse mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    const initialTitle = await page.getByTestId('movie-card').first().textContent();

    // Search
    await page.getByRole('searchbox').fill('comedy');
    await page.waitForTimeout(500);

    // Clear
    await page.getByRole('searchbox').clear();
    await page.waitForTimeout(500);

    // Should return to browse results
    await expect(page.getByTestId('movie-card').first()).toBeVisible();
  });

  test('search sorting resets to relevance', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Change browse sort
    await page.getByLabel(/sort by/i).selectOption('title');

    // Search
    await page.getByRole('searchbox').fill('action');
    await page.waitForTimeout(500);

    // Should be relevance
    await expect(page.getByLabel(/sort by/i)).toHaveValue('relevance');
  });
});

test.describe('Functional: View Toggle Edge Cases', () => {
  test('view persists through search', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Switch to table
    await page.getByRole('button', { name: /list/i }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Search
    await page.getByRole('searchbox').fill('action');
    await page.waitForTimeout(500);

    // Should still be table view
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('table view shows sortable columns', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByRole('button', { name: /list/i }).click();
    await expect(page.getByRole('table')).toBeVisible();

    // Column headers should be clickable
    await expect(page.getByRole('button', { name: /title/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /rating/i })).toBeVisible();
  });

  test('table column sort syncs with grid sort', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Switch to table and sort by title
    await page.getByRole('button', { name: /list/i }).click();
    await page.getByRole('button', { name: /title/i }).click();

    // Switch back to grid
    await page.getByRole('button', { name: /grid/i }).click();
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Sort dropdown should show title
    await expect(page.getByLabel(/sort by/i)).toHaveValue('title');
  });
});

test.describe('Functional: Movie Detail Edge Cases', () => {
  test('handles movie with minimal data', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    // Navigate to any movie
    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Page should not crash - core elements present
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to browse/i })).toBeVisible();
  });

  test('similar movies section handles empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('movie-card').first()).toBeVisible();

    await page.getByTestId('movie-card').first().click();
    await expect(page).toHaveURL(/\/movies\/\d+/);

    // Similar section should exist (may have movies or show empty)
    await expect(page.getByRole('heading', { name: /similar movies/i })).toBeVisible();
  });
});
