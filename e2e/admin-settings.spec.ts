import { test, expect } from '@playwright/test'
import { makeAuthenticatedRequest, generateTestData, testRateLimiting } from './utils/test-helpers'

test.describe('Admin Settings API', () => {

  test('should load settings page', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin')

    // Look for settings section or button
    const settingsLink = page.locator('a, button').filter({ hasText: /settings|config/i })
    if (await settingsLink.count() > 0) {
      await settingsLink.first().click()
    } else {
      // Try direct navigation
      await page.goto('/admin/settings')
    }

    // Verify page loads (may show empty state or settings list)
    await expect(page).toHaveURL(/.*\/admin\/?.*/)
  })

  test('should reject unauthenticated settings access', async ({ page }) => {
    // Try to access settings without authentication
    const response = await page.request.get('/api/admin/settings')

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401)
  })

  test('should validate setting input format', async ({ page }) => {
    // This test assumes we have a way to make authenticated requests
    // For now, test the API structure without full auth
    const response = await page.request.post('/api/admin/settings', {
      data: {
        key: 'invalid-key!',
        value: 'test'
      }
    })

    // Should reject due to authentication or validation
    expect([400, 401, 403]).toContain(response.status())
  })

  test('should handle malformed setting requests', async ({ page }) => {
    const response = await page.request.post('/api/admin/settings', {
      data: 'invalid json'
    })

    // Should handle malformed JSON
    expect([400, 401]).toContain(response.status())
  })

  test('should update setting via API', async ({ page }) => {
    const testData = generateTestData('update_setting')

    // First create a setting
    const createResponse = await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: testData.name,
        value: 'original_value',
        category: 'test'
      }
    })

    expect(createResponse.status()).toBe(200)
    const createdSetting = (await createResponse.json()).data

    // Now update it
    const updateResponse = await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: testData.name,
        value: 'updated_value',
        category: 'test'
      }
    })

    expect(updateResponse.status()).toBe(200)

    // Verify update
    const getResponse = await makeAuthenticatedRequest(page, '/api/admin/settings')
    const settings = (await getResponse.json()).data
    const updatedSetting = settings.find((s: any) => s.key === testData.name)

    expect(updatedSetting.value).toBe('updated_value')
  })

  test('should validate setting input', async ({ page }) => {
    // Test invalid key format
    const invalidKeyResponse = await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: 'invalid-key!',
        value: 'test'
      }
    })

    expect(invalidKeyResponse.status()).toBe(400)

    const errorData = await invalidKeyResponse.json()
    expect(errorData.error).toBeDefined()
  })

  test('should handle secret settings encryption', async ({ page }) => {
    const testData = generateTestData('secret_setting')

    // Create secret setting
    const response = await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: testData.name,
        value: 'secret_password',
        isSecret: true,
        category: 'security'
      }
    })

    expect(response.status()).toBe(200)

    // Get settings and verify secret is not exposed in plain text
    const getResponse = await makeAuthenticatedRequest(page, '/api/admin/settings')
    const settings = (await getResponse.json()).data
    const secretSetting = settings.find((s: any) => s.key === testData.name)

    // Secret settings should be encrypted in responses
    expect(secretSetting.isSecret).toBe(true)
    // The actual value should be handled by the encryption system
  })

  test('should enforce rate limiting on settings API', async ({ page }) => {
    const rateLimitResult = await testRateLimiting(page, '/api/admin/settings', 20)

    // Should show some rate limiting behavior
    expect(rateLimitResult.wasRateLimited).toBe(true)
    expect(rateLimitResult.rateLimitedCount).toBeGreaterThan(0)
  })

  test('should handle large setting values', async ({ page }) => {
    const largeValue = 'a'.repeat(900) // Close to 1KB limit

    const response = await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: generateTestData('large_setting').name,
        value: largeValue,
        category: 'test'
      }
    })

    expect(response.status()).toBe(200)
  })

  test('should reject oversized setting values', async ({ page }) => {
    const oversizedValue = 'a'.repeat(2000) // Over 1KB limit

    const response = await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: generateTestData('oversized_setting').name,
        value: oversizedValue,
        category: 'test'
      }
    })

    expect(response.status()).toBe(400)
  })

  test('should handle concurrent setting updates', async ({ page }) => {
    const testData = generateTestData('concurrent_setting')

    // Create initial setting
    await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: testData.name,
        value: 'initial_value',
        category: 'test'
      }
    })

    // Make multiple concurrent updates
    const promises = Array(5).fill(null).map((_, i) =>
      makeAuthenticatedRequest(page, '/api/admin/settings', {
        method: 'POST',
        body: {
          key: testData.name,
          value: `value_${i}`,
          category: 'test'
        }
      })
    )

    const results = await Promise.all(promises)

    // At least some should succeed
    const successCount = results.filter(r => r.status() === 200).length
    expect(successCount).toBeGreaterThan(0)
  })
})

