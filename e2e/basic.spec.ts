import { test, expect } from '@playwright/test'

test.describe('Basic App Functionality', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Just check that page loaded (don't assume specific content)
    const bodyContent = await page.textContent('body')
    expect(bodyContent).toBeTruthy()
    expect(bodyContent!.length).toBeGreaterThan(0)
  })

  test('should have page title', async ({ page }) => {
    await page.goto('/')

    // Check that title exists
    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('should load login page', async ({ page }) => {
    await page.goto('/login')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check that login form elements exist
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const submitButton = page.locator('button[type="submit"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/non-existent-page')

    // Should load some content (could be 404 page or redirect)
    await page.waitForLoadState('networkidle')

    const bodyContent = await page.textContent('body')
    expect(bodyContent).toBeTruthy()
  })
})
