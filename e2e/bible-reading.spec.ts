import { test, expect } from '@playwright/test'

test.describe('Bible Reading Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }))
    })

    await page.goto('/')
  })

  test('should display Bible text on home page', async ({ page }) => {
    // Should show Bible reader or navigate to it
    await expect(page.locator('text=Genesis')).toBeVisible({ timeout: 10000 })

    // Should display verses
    await expect(page.locator('[data-testid="verse"]')).toHaveCount({ min: 1 })
  })

  test('should navigate between books and chapters', async ({ page }) => {
    await page.goto('/bible')

    // Open book navigation
    await page.click('[data-testid="book-selector"]')

    // Select a different book
    await page.click('text=Exodus')

    // Should update the display
    await expect(page.locator('text=Exodus')).toBeVisible()

    // Navigate to different chapter
    await page.click('[data-testid="chapter-selector"]')
    await page.click('text=Chapter 2')

    // Should display chapter 2
    await expect(page.locator('text=Chapter 2')).toBeVisible()
  })

  test('should highlight verses when clicked', async ({ page }) => {
    await page.goto('/bible')

    // Click on a verse
    const firstVerse = page.locator('[data-testid="verse"]').first()
    await firstVerse.click()

    // Should highlight the verse
    await expect(firstVerse).toHaveClass(/selected|highlighted/)

    // Should show verse actions
    await expect(page.locator('[data-testid="verse-actions"]')).toBeVisible()
  })

  test('should support font size adjustment', async ({ page }) => {
    await page.goto('/bible')

    // Open settings or font controls
    await page.click('[data-testid="font-size-control"]')

    // Increase font size
    await page.click('[data-testid="increase-font"]')

    // Should apply larger font
    const verseText = page.locator('[data-testid="verse"]').first()
    const fontSize = await verseText.evaluate(el =>
      window.getComputedStyle(el).fontSize
    )

    expect(parseInt(fontSize)).toBeGreaterThan(16)
  })

  test('should toggle between light and dark themes', async ({ page }) => {
    await page.goto('/bible')

    // Toggle theme
    await page.click('[data-testid="theme-toggle"]')

    // Should apply dark theme
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Toggle back
    await page.click('[data-testid="theme-toggle"]')

    // Should return to light theme
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('should maintain reading position on navigation', async ({ page }) => {
    await page.goto('/bible/genesis/1')

    // Scroll to a specific verse
    await page.locator('[data-verse="10"]').scrollIntoViewIfNeeded()

    // Navigate away and back
    await page.goto('/bookmarks')
    await page.goto('/bible')

    // Should return to the same position
    await expect(page.locator('[data-verse="10"]')).toBeInViewport()
  })

  test('should work offline after initial load', async ({ page, context }) => {
    await page.goto('/bible')

    // Wait for content to load
    await expect(page.locator('[data-testid="verse"]')).toHaveCount({ min: 1 })

    // Go offline
    await context.setOffline(true)

    // Should still display content
    await page.reload()
    await expect(page.locator('[data-testid="verse"]')).toHaveCount({ min: 1 })

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
  })
})
