import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }))
    })

    await page.goto('/search')
  })

  test('should display search interface', async ({ page }) => {
    // Should show search input
    await expect(page.locator('input[type="search"]')).toBeVisible()

    // Should show search button
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Should show empty state message
    await expect(page.locator('text=Enter a search term')).toBeVisible()
  })

  test('should perform basic text search', async ({ page }) => {
    // Enter search term
    await page.fill('input[type="search"]', 'love')
    await page.click('button[type="submit"]')

    // Should show loading state
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible()

    // Should display search results
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount({ min: 1 })

    // Results should contain the search term
    const firstResult = page.locator('[data-testid="search-result"]').first()
    await expect(firstResult).toContainText('love')
  })

  test('should highlight search terms in results', async ({ page }) => {
    await page.fill('input[type="search"]', 'God')
    await page.click('button[type="submit"]')

    // Wait for results
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount({ min: 1 })

    // Search term should be highlighted
    await expect(page.locator('mark')).toContainText('God')
  })

  test('should navigate to verse from search result', async ({ page }) => {
    await page.fill('input[type="search"]', 'beginning')
    await page.click('button[type="submit"]')

    // Wait for results and click first one
    await page.locator('[data-testid="search-result"]').first().click()

    // Should navigate to the verse
    await expect(page).toHaveURL(/\/bible\//)

    // Should highlight the verse
    await expect(page.locator('[data-testid="verse"].highlighted')).toBeVisible()
  })

  test('should handle empty search results', async ({ page }) => {
    await page.fill('input[type="search"]', 'xyzabc123nonexistent')
    await page.click('button[type="submit"]')

    // Should show no results message
    await expect(page.locator('text=No results found')).toBeVisible()

    // Should suggest trying different terms
    await expect(page.locator('text=Try different search terms')).toBeVisible()
  })

  test('should support phrase search with quotes', async ({ page }) => {
    await page.fill('input[type="search"]', '"In the beginning"')
    await page.click('button[type="submit"]')

    // Should find exact phrase matches
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount({ min: 1 })

    // Results should contain the exact phrase
    const result = page.locator('[data-testid="search-result"]').first()
    await expect(result).toContainText('In the beginning')
  })

  test('should filter results by book', async ({ page }) => {
    await page.fill('input[type="search"]', 'love')

    // Select book filter
    await page.selectOption('[data-testid="book-filter"]', 'John')

    await page.click('button[type="submit"]')

    // Results should only be from John
    const results = page.locator('[data-testid="search-result"]')
    await expect(results.first().locator('text=John')).toBeVisible()
  })

  test('should save and display search history', async ({ page }) => {
    // Perform a search
    await page.fill('input[type="search"]', 'faith')
    await page.click('button[type="submit"]')

    // Clear search and check history
    await page.fill('input[type="search"]', '')

    // Should show recent searches
    await expect(page.locator('[data-testid="search-history"]')).toBeVisible()
    await expect(page.locator('text=faith')).toBeVisible()
  })

  test('should work offline with downloaded content', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Perform search
    await page.fill('input[type="search"]', 'love')
    await page.click('button[type="submit"]')

    // Should still return results from local storage
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount({ min: 1 })

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-search"]')).toBeVisible()
  })

  test('should support keyboard navigation in results', async ({ page }) => {
    await page.fill('input[type="search"]', 'love')
    await page.click('button[type="submit"]')

    // Wait for results
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount({ min: 1 })

    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown')

    // First result should be focused
    await expect(page.locator('[data-testid="search-result"]:focus')).toBeVisible()

    // Press Enter to navigate
    await page.keyboard.press('Enter')

    // Should navigate to verse
    await expect(page).toHaveURL(/\/bible\//)
  })

  test('should clear search results', async ({ page }) => {
    // Perform search
    await page.fill('input[type="search"]', 'love')
    await page.click('button[type="submit"]')

    // Wait for results
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount({ min: 1 })

    // Clear search
    await page.click('[data-testid="clear-search"]')

    // Results should be cleared
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount(0)
    await expect(page.locator('text=Enter a search term')).toBeVisible()
  })
})
