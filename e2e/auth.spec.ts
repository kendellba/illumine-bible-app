import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form when not authenticated', async ({ page }) => {
    // Check if we're redirected to login or if login form is visible
    await expect(page).toHaveURL(/\/(login|auth)/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/auth/login')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should navigate to signup from login', async ({ page }) => {
    await page.goto('/auth/login')

    // Click signup link
    await page.click('text=Sign up')

    // Should navigate to signup page
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.locator('text=Create Account')).toBeVisible()
  })

  test('should show password reset option', async ({ page }) => {
    await page.goto('/auth/login')

    // Click forgot password link
    await page.click('text=Forgot password')

    // Should navigate to forgot password page
    await expect(page).toHaveURL(/\/auth\/forgot-password/)
    await expect(page.locator('text=Reset Password')).toBeVisible()
  })

  test('should handle signup form validation', async ({ page }) => {
    await page.goto('/auth/signup')

    // Fill form with invalid data
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[name="password"]', '123') // Too short
    await page.fill('input[name="confirmPassword"]', '456') // Doesn't match

    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=Invalid email format')).toBeVisible()
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('should persist session across page reloads', async ({ page, context }) => {
    // Mock successful authentication
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      }
    ])

    await page.goto('/')

    // Should stay authenticated after reload
    await page.reload()

    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/(login|auth)/)
  })
})
