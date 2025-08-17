import { test, expect } from '@playwright/test'

test.describe('Bookmarking System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }))
    })

    await page.goto('/bible')
  })

  test('should bookmark a verse', async ({ page }) => {
    // Click on a verse to select it
    const verse = page.locator('[data-testid="verse"]').first()
    await verse.click()

    // Click bookmark button
    await page.click('[data-testid="bookmark-button"]')

    // Should show bookmark confirmation
    await expect(page.locator('text=Bookmarked')).toBeVisible()

    // Verse should show as bookmarked
    await expect(verse).toHaveClass(/bookmarked/)
  })

  test('should remove bookmark', async ({ page }) => {
    // First bookmark a verse
    const verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Wait for bookmark to be added
    await expect(verse).toHaveClass(/bookmarked/)

    // Click bookmark button again to remove
    await page.click('[data-testid="bookmark-button"]')

    // Should show removal confirmation
    await expect(page.locator('text=Bookmark removed')).toBeVisible()

    // Verse should no longer be bookmarked
    await expect(verse).not.toHaveClass(/bookmarked/)
  })

  test('should display bookmarks in bookmarks view', async ({ page }) => {
    // Bookmark a verse first
    const verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Navigate to bookmarks
    await page.goto('/bookmarks')

    // Should display the bookmarked verse
    await expect(page.locator('[data-testid="bookmark-item"]')).toHaveCount({ min: 1 })

    // Should show verse reference and text
    await expect(page.locator('text=Genesis 1:1')).toBeVisible()
  })

  test('should navigate to verse from bookmark', async ({ page }) => {
    // Bookmark a specific verse
    await page.goto('/bible/genesis/1')
    const verse = page.locator('[data-verse="5"]')
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Go to bookmarks page
    await page.goto('/bookmarks')

    // Click on the bookmark
    await page.click('[data-testid="bookmark-item"]')

    // Should navigate to the verse
    await expect(page).toHaveURL(/\/bible\/genesis\/1/)
    await expect(page.locator('[data-verse="5"]')).toBeInViewport()
  })

  test('should sort bookmarks by book order', async ({ page }) => {
    // Bookmark verses from different books
    await page.goto('/bible/exodus/1')
    let verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    await page.goto('/bible/genesis/1')
    verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Go to bookmarks
    await page.goto('/bookmarks')

    // Genesis should appear before Exodus
    const bookmarks = page.locator('[data-testid="bookmark-item"]')
    const firstBookmark = bookmarks.first()
    const secondBookmark = bookmarks.nth(1)

    await expect(firstBookmark.locator('text=Genesis')).toBeVisible()
    await expect(secondBookmark.locator('text=Exodus')).toBeVisible()
  })

  test('should delete bookmark from bookmarks view', async ({ page }) => {
    // Bookmark a verse
    const verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Go to bookmarks
    await page.goto('/bookmarks')

    // Delete the bookmark
    await page.click('[data-testid="delete-bookmark"]')

    // Should confirm deletion
    await page.click('text=Delete')

    // Bookmark should be removed
    await expect(page.locator('[data-testid="bookmark-item"]')).toHaveCount(0)
  })

  test('should sync bookmarks when online', async ({ page }) => {
    // Bookmark a verse
    const verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Should show sync status
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Synced')
  })

  test('should store bookmarks locally when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Bookmark a verse
    const verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Should show pending sync status
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Pending')

    // Bookmark should still be visible in bookmarks view
    await page.goto('/bookmarks')
    await expect(page.locator('[data-testid="bookmark-item"]')).toHaveCount({ min: 1 })
  })
})
