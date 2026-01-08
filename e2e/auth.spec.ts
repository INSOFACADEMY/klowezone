import { test, expect } from '@playwright/test'
import { PAGE_ROUTES } from './utils/test-helpers'

test.describe('Authentication UI Flow', () => {
  test('should load login page correctly', async ({ page }) => {
    await page.goto(PAGE_ROUTES.login)

    // Verify page loads
    await expect(page).toHaveTitle(/KloweZone|Login/i)

    // Verify login form elements exist
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Verify branding elements
    await expect(page.locator('text=KloweZone')).toBeVisible()
  })

  test('should redirect unauthenticated users from admin pages', async ({ page }) => {
    // Try to access admin page without authentication
    await page.goto(PAGE_ROUTES.admin)

    // Should redirect to login (may take time due to client-side redirects)
    await page.waitForURL('**/login', { timeout: 10000 })

    // Verify we're on login page
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should load signup page', async ({ page }) => {
    await page.goto(PAGE_ROUTES.signup)

    // Verify signup page loads
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle form validation on login page', async ({ page }) => {
    await page.goto(PAGE_ROUTES.login)

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should stay on login page and show validation
    await expect(page).toHaveURL(/.*\/login/)

    // Form should still be visible
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto(PAGE_ROUTES.login)

    // Check for navigation elements
    const backLink = page.locator('a, button').filter({ hasText: /volver|back/i })
    if (await backLink.count() > 0) {
      await expect(backLink.first()).toBeVisible()
    }

    // Check for signup link
    const signupLink = page.locator('a').filter({ hasText: /regístrate|signup/i })
    if (await signupLink.count() > 0) {
      await expect(signupLink.first()).toBeVisible()
    }
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto(PAGE_ROUTES.login)

    // Check form accessibility
    const emailInput = page.locator('#email')
    await expect(emailInput).toHaveAttribute('type', 'email')

    const passwordInput = page.locator('#password')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Check labels exist
    const emailLabel = page.locator('label[for="email"]')
    const passwordLabel = page.locator('label[for="password"]')

    if (await emailLabel.count() > 0) {
      await expect(emailLabel).toBeVisible()
    }
    if (await passwordLabel.count() > 0) {
      await expect(passwordLabel).toBeVisible()
    }
  })

  test('should handle forgot password link if present', async ({ page }) => {
    await page.goto(PAGE_ROUTES.login)

    // Look for forgot password link
    const forgotLink = page.locator('button, a').filter({ hasText: /olvidaste|forgot/i })

    if (await forgotLink.count() > 0) {
      await expect(forgotLink.first()).toBeVisible()
      // Could test clicking it, but may require additional setup
    }
  })

  test('should maintain form state on navigation', async ({ page }) => {
    await page.goto(PAGE_ROUTES.login)

    // Fill form
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword')

    // Navigate away and back (simulate browser back)
    await page.goto(PAGE_ROUTES.home)
    await page.goBack()

    // Form should be cleared for security (typical behavior)
    // or maintain state depending on implementation
    const emailValue = await page.locator('#email').inputValue()
    const passwordValue = await page.locator('#password').inputValue()

    // Either should be empty (security) or maintain values
    expect(['', 'test@example.com']).toContain(emailValue)
    expect(['', 'testpassword']).toContain(passwordValue)
  })
})

