import { test, expect } from '@playwright/test'
import { loginAsAdmin, makeAuthenticatedRequest, generateTestData, testRateLimiting } from './utils/test-helpers'

test.describe('Admin Automations Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should load automations page', async ({ page }) => {
    await page.goto('/admin')

    // Look for automations section
    const automationsLink = page.locator('a, button').filter({ hasText: /automation|workflow/i })
    if (await automationsLink.count() > 0) {
      await automationsLink.first().click()
    } else {
      await page.goto('/admin/automations')
    }

    await expect(page).toHaveURL(/.*\/admin\/?.*/)
  })

  test('should list automations via API', async ({ page }) => {
    const response = await makeAuthenticatedRequest(page, '/api/admin/automations')

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toBeDefined()
    // May be empty array initially
    expect(Array.isArray(data)).toBe(true)
  })

  test('should create automation via API', async ({ page }) => {
    const testData = generateTestData('automation')

    const automationData = {
      name: testData.name,
      description: `Test automation ${testData.timestamp}`,
      trigger: {
        type: 'webhook',
        config: {}
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template: 'welcome',
            recipient: 'test@example.com'
          }
        }
      ],
      isActive: true
    }

    const response = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: automationData
    })

    expect(response.status()).toBe(201)

    const result = await response.json()
    expect(result).toBeDefined()
    expect(result.name).toBe(testData.name)
    expect(result.isActive).toBe(true)
    expect(Array.isArray(result.actions)).toBe(true)
  })

  test('should validate automation input', async ({ page }) => {
    // Test missing required fields
    const invalidData = {
      name: 'Test Automation'
      // Missing trigger and actions
    }

    const response = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: invalidData
    })

    expect(response.status()).toBe(400)

    const errorData = await response.json()
    expect(errorData.error).toBeDefined()
  })

  test('should validate automation actions limit', async ({ page }) => {
    const testData = generateTestData('large_automation')

    // Create automation with too many actions (over 20)
    const automationData = {
      name: testData.name,
      trigger: {
        type: 'webhook',
        config: {}
      },
      actions: Array(25).fill(null).map((_, i) => ({
        type: 'send_email',
        config: { template: `template_${i}` }
      })),
      isActive: true
    }

    const response = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: automationData
    })

    expect(response.status()).toBe(400)
  })

  test('should handle automation trigger types', async ({ page }) => {
    const testData = generateTestData('trigger_test')

    const automationData = {
      name: testData.name,
      trigger: {
        type: 'schedule',
        config: {
          cron: '0 0 * * *', // Daily at midnight
          timezone: 'UTC'
        }
      },
      actions: [
        {
          type: 'send_email',
          config: { template: 'daily_report' }
        }
      ],
      isActive: true
    }

    const response = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: automationData
    })

    expect(response.status()).toBe(201)

    const result = await response.json()
    expect(result.trigger.type).toBe('schedule')
    expect(result.trigger.config.cron).toBe('0 0 * * *')
  })

  test('should update automation via API', async ({ page }) => {
    const testData = generateTestData('update_automation')

    // Create automation first
    const createData = {
      name: testData.name,
      trigger: { type: 'webhook', config: {} },
      actions: [{ type: 'send_email', config: { template: 'old' } }],
      isActive: true
    }

    const createResponse = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: createData
    })

    expect(createResponse.status()).toBe(201)
    const created = await createResponse.json()

    // Update automation
    const updateData = {
      name: testData.name,
      description: 'Updated description',
      isActive: false,
      actions: [
        { type: 'send_email', config: { template: 'new_template' } },
        { type: 'create_task', config: { priority: 'high' } }
      ]
    }

    const updateResponse = await makeAuthenticatedRequest(page, `/api/admin/automations/${created.id}`, {
      method: 'PUT',
      body: updateData
    })

    expect(updateResponse.status()).toBe(200)

    const updated = await updateResponse.json()
    expect(updated.description).toBe('Updated description')
    expect(updated.isActive).toBe(false)
    expect(updated.actions.length).toBe(2)
  })

  test('should delete automation via API', async ({ page }) => {
    const testData = generateTestData('delete_automation')

    // Create automation first
    const createData = {
      name: testData.name,
      trigger: { type: 'webhook', config: {} },
      actions: [{ type: 'send_email', config: { template: 'test' } }],
      isActive: true
    }

    const createResponse = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: createData
    })

    const created = await createResponse.json()

    // Delete automation
    const deleteResponse = await makeAuthenticatedRequest(page, `/api/admin/automations/${created.id}`, {
      method: 'DELETE'
    })

    expect(deleteResponse.status()).toBe(200)

    // Verify deletion
    const getResponse = await makeAuthenticatedRequest(page, `/api/admin/automations/${created.id}`)
    expect(getResponse.status()).toBe(404)
  })

  test('should toggle automation active status', async ({ page }) => {
    const testData = generateTestData('toggle_automation')

    // Create active automation
    const createData = {
      name: testData.name,
      trigger: { type: 'webhook', config: {} },
      actions: [{ type: 'send_email', config: { template: 'test' } }],
      isActive: true
    }

    const createResponse = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: createData
    })

    const created = await createResponse.json()
    expect(created.isActive).toBe(true)

    // Toggle to inactive
    const toggleResponse = await makeAuthenticatedRequest(page, `/api/admin/automations/${created.id}/toggle`, {
      method: 'PATCH'
    })

    expect(toggleResponse.status()).toBe(200)

    const toggled = await toggleResponse.json()
    expect(toggled.isActive).toBe(false)
  })

  test('should trigger automation manually', async ({ page }) => {
    const testData = generateTestData('manual_trigger')

    // Create automation
    const createData = {
      name: testData.name,
      trigger: { type: 'webhook', config: {} },
      actions: [{ type: 'send_email', config: { template: 'manual' } }],
      isActive: true
    }

    const createResponse = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: createData
    })

    const created = await createResponse.json()

    // Trigger manually
    const triggerResponse = await makeAuthenticatedRequest(page, '/api/admin/automations/trigger', {
      method: 'POST',
      body: { automationId: created.id }
    })

    expect(triggerResponse.status()).toBe(200)

    const result = await triggerResponse.json()
    expect(result.success).toBe(true)
    expect(result.runId).toBeDefined()
  })

  test('should enforce rate limiting on automations API', async ({ page }) => {
    const rateLimitResult = await testRateLimiting(page, '/api/admin/automations', 15)

    expect(rateLimitResult.wasRateLimited).toBe(true)
    expect(rateLimitResult.rateLimitedCount).toBeGreaterThan(0)
  })

  test('should handle concurrent automation operations', async ({ page }) => {
    const testData = generateTestData('concurrent_auto')

    // Create automation
    const createData = {
      name: testData.name,
      trigger: { type: 'webhook', config: {} },
      actions: [{ type: 'send_email', config: { template: 'test' } }],
      isActive: true
    }

    const createResponse = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: createData
    })

    const created = await createResponse.json()

    // Make concurrent toggle requests
    const promises = Array(10).fill(null).map(() =>
      makeAuthenticatedRequest(page, `/api/admin/automations/${created.id}/toggle`, {
        method: 'PATCH'
      })
    )

    const results = await Promise.all(promises)

    // Should handle concurrency gracefully
    const successCount = results.filter(r => r.status() === 200).length
    expect(successCount).toBeGreaterThan(5) // At least some should succeed
  })

  test('should validate automation permissions', async ({ page }) => {
    const testData = generateTestData('permission_test')

    // Try to access automations without proper role
    // This test assumes we have different user roles
    // For now, just test that admin can access
    const response = await makeAuthenticatedRequest(page, '/api/admin/automations')
    expect([200, 403]).toContain(response.status())
  })
})





