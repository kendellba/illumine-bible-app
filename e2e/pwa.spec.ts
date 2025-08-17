import { test, expect } from '@playwright/test'

test.describe('PWA Functionality', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('/')

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        return !!registration
      }
      return false
    })

    expect(swRegistered).toBe(true)
  })

  test('should show install prompt on supported browsers', async ({ page, browserName }) => {
    // Skip on browsers that don't support PWA install
    test.skip(browserName === 'webkit', 'Safari does not support PWA install prompt')

    await page.goto('/')

    // Simulate beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
    })

    // Should show install button or prompt
    await expect(page.locator('[data-testid="install-pwa"]')).toBeVisible()
  })

  test('should work offline after caching', async ({ page, context }) => {
    await page.goto('/')

    // Wait for initial load and caching
    await page.waitForLoadState('networkidle')

    // Go offline
    await context.setOffline(true)

    // Reload page
    await page.reload()

    // Should still load the app
    await expect(page.locator('body')).toBeVisible()

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
  })

  test('should cache Bible content for offline reading', async ({ page, context }) => {
    await page.goto('/bible')

    // Wait for content to load
    await expect(page.locator('[data-testid="verse"]')).toHaveCount({ min: 1 })

    // Go offline
    await context.setOffline(true)

    // Navigate to different chapter
    await page.goto('/bible/genesis/2')

    // Should still display content
    await expect(page.locator('[data-testid="verse"]')).toHaveCount({ min: 1 })
  })

  test('should sync data when coming back online', async ({ page, context }) => {
    // Start offline
    await context.setOffline(true)
    await page.goto('/')

    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }))
    })

    await page.goto('/bible')

    // Bookmark a verse while offline
    const verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Should show pending sync
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Pending')

    // Go back online
    await context.setOffline(false)

    // Should sync data
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Synced')
  })

  test('should show update notification when new version available', async ({ page }) => {
    await page.goto('/')

    // Simulate service worker update
    await page.evaluate(() => {
      // Mock service worker update event
      const event = new CustomEvent('swUpdated', {
        detail: { registration: { waiting: {} } }
      })
      window.dispatchEvent(event)
    })

    // Should show update notification
    await expect(page.locator('[data-testid="update-notification"]')).toBeVisible()
    await expect(page.locator('text=Update available')).toBeVisible()
  })

  test('should handle background sync for user actions', async ({ page, context }) => {
    await page.goto('/')

    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }))
    })

    await page.goto('/bible')

    // Go offline
    await context.setOffline(true)

    // Perform user action (bookmark)
    const verse = page.locator('[data-testid="verse"]').first()
    await verse.click()
    await page.click('[data-testid="bookmark-button"]')

    // Should queue for background sync
    const syncQueue = await page.evaluate(() => {
      return localStorage.getItem('sync-queue')
    })

    expect(syncQueue).toBeTruthy()
  })

  test('should respect user preferences for notifications', async ({ page }) => {
    await page.goto('/settings')

    // Disable notifications
    await page.uncheck('[data-testid="enable-notifications"]')

    // Go back to main app
    await page.goto('/')

    // Simulate update available
    await page.evaluate(() => {
      const event = new CustomEvent('swUpdated')
      window.dispatchEvent(event)
    })

    // Should not show notification if disabled
    await expect(page.locator('[data-testid="update-notification"]')).not.toBeVisible()
  })

  test('should maintain app state during offline/online transitions', async ({ page, context }) => {
    await page.goto('/bible/genesis/1')

    // Scroll to specific position
    await page.locator('[data-verse="10"]').scrollIntoViewIfNeeded()

    // Go offline
    await context.setOffline(true)
    await page.reload()

    // Should maintain position
    await expect(page.locator('[data-verse="10"]')).toBeInViewport()

    // Go back online
    await context.setOffline(false)
    await page.reload()

    // Should still maintain position
    await expect(page.locator('[data-verse="10"]')).toBeInViewport()
  })
})
