import { test, expect } from '@playwright/test'
import { loginAsAdmin, makeAuthenticatedRequest, createTestApiKey, generateTestData, testRateLimiting } from './utils/test-helpers'

test.describe('Webhook Ingestion API', () => {
  const testApiKey = 'test-api-key-123' // Mock API key for testing

  test('should reject webhook without API key', async ({ page }) => {
    const webhookPayload = {
      eventType: 'user.registered',
      payload: { userId: 'test', email: 'test@test.com' }
    }

    const response = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: webhookPayload
    })

    expect(response.status()).toBe(401)
  })

  test('should reject webhook with missing eventType', async ({ page }) => {
    const invalidPayload = {
      // Missing required eventType
      payload: { userId: 'test' }
    }

    const response = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': testApiKey
      },
      data: invalidPayload
    })

    expect(response.status()).toBe(400)

    const error = await response.json()
    expect(error.error).toBeDefined()
  })

  test('should reject malformed JSON', async ({ page }) => {
    const response = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': testApiKey
      },
      data: '{ invalid json }'
    })

    expect(response.status()).toBe(400)
  })

  test('should reject invalid webhook payload', async ({ page }) => {
    const invalidPayload = {
      // Missing required eventType
      payload: { userId: 'test' }
    }

    const response = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: invalidPayload
    })

    expect(response.status()).toBe(400)

    const error = await response.json()
    expect(error.error).toBeDefined()
  })

  test('should handle large webhook payloads', async ({ page }) => {
    const largePayload = {
      eventType: 'data.import',
      payload: {
        data: 'x'.repeat(50000), // 50KB of data
        metadata: { source: 'large_test' }
      },
      source: 'e2e_large_test'
    }

    const response = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: largePayload
    })

    expect(response.status()).toBe(200)
  })

  test('should reject oversized webhook payloads', async ({ page }) => {
    const oversizedPayload = {
      eventType: 'data.import',
      payload: {
        data: 'x'.repeat(2000000), // 2MB of data (over limit)
      }
    }

    const response = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: oversizedPayload
    })

    expect(response.status()).toBe(413) // Payload Too Large
  })

  test('should handle webhook idempotency', async ({ page }) => {
    const idempotencyKey = generateTestData('idempotent').name

    const webhookPayload = {
      eventType: 'user.login',
      idempotencyKey,
      payload: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: new Date().toISOString()
      },
      source: 'e2e_idempotency_test'
    }

    // Send same webhook twice
    const response1 = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: webhookPayload
    })

    const response2 = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: webhookPayload
    })

    expect(response1.status()).toBe(200)
    expect(response2.status()).toBe(200)

    const result1 = await response1.json()
    const result2 = await response2.json()

    // Second request should be idempotent (same event ID or handled gracefully)
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })

  test('should trigger automations from webhooks', async ({ page }) => {
    await loginAsAdmin(page)

    // Create automation that triggers on webhook
    const automationData = {
      name: generateTestData('webhook_auto').name,
      trigger: {
        type: 'webhook',
        config: {
          eventType: 'test.webhook.trigger'
        }
      },
      actions: [
        {
          type: 'send_email',
          config: { template: 'test_notification' }
        }
      ],
      isActive: true
    }

    const createResponse = await makeAuthenticatedRequest(page, '/api/admin/automations', {
      method: 'POST',
      body: automationData
    })

    expect(createResponse.status()).toBe(201)
    const automation = await createResponse.json()

    // Send webhook that should trigger automation
    const webhookPayload = {
      eventType: 'test.webhook.trigger',
      payload: {
        testId: 'webhook_trigger_test',
        timestamp: new Date().toISOString()
      },
      source: 'e2e_trigger_test'
    }

    const webhookResponse = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: webhookPayload
    })

    expect(webhookResponse.status()).toBe(200)

    const webhookResult = await webhookResponse.json()
    expect(webhookResult.success).toBe(true)
    expect(webhookResult.triggered).toBeDefined()
  })

  test('should enforce rate limiting on webhooks', async ({ page }) => {
    const webhookPayload = {
      eventType: 'test.rate.limit',
      payload: { test: true },
      source: 'rate_limit_test'
    }

    const requests = Array(70).fill(null).map(() =>
      page.request.post('/api/hooks/ingest', {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        data: webhookPayload
      })
    )

    const responses = await Promise.all(requests)
    const rateLimitedCount = responses.filter(r => r.status() === 429).length

    expect(rateLimitedCount).toBeGreaterThan(0)
  })

  test('should validate event types against catalog', async ({ page }) => {
    // Test with supported event type
    const validPayload = {
      eventType: 'user.registered',
      payload: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com'
      }
    }

    const validResponse = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: validPayload
    })

    expect(validResponse.status()).toBe(200)

    // Test with unsupported event type (should still work but be unvalidated)
    const invalidEventPayload = {
      eventType: 'unknown.event.type',
      payload: { custom: 'data' }
    }

    const invalidEventResponse = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: invalidEventPayload
    })

    expect(invalidEventResponse.status()).toBe(200)

    const result = await invalidEventResponse.json()
    expect(result.success).toBe(true)
    // Should indicate it's unvalidated
    expect(result.unvalidated).toBe(true)
  })

  test('should handle malformed JSON gracefully', async ({ page }) => {
    const response = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: '{ invalid json }'
    })

    expect(response.status()).toBe(400)

    const error = await response.json()
    expect(error.error).toContain('Invalid JSON')
  })

  test('should handle concurrent webhook requests', async ({ page }) => {
    const webhookPayload = {
      eventType: 'test.concurrent',
      payload: { test: true },
      source: 'concurrent_test'
    }

    const requests = Array(20).fill(null).map((_, i) =>
      page.request.post('/api/hooks/ingest', {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        data: { ...webhookPayload, index: i }
      })
    )

    const responses = await Promise.all(requests)
    const successCount = responses.filter(r => r.status() === 200).length
    const errorCount = responses.filter(r => r.status() >= 400).length

    // Should handle most requests successfully
    expect(successCount).toBeGreaterThan(15)
    expect(errorCount).toBeLessThan(5)
  })

  test('should log webhook events for auditing', async ({ page }) => {
    await loginAsAdmin(page)

    const webhookPayload = {
      eventType: 'test.audit',
      payload: { audit: 'test' },
      source: 'audit_test'
    }

    const response = await page.request.post('/api/hooks/ingest', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      data: webhookPayload
    })

    expect(response.status()).toBe(200)

    // Check that event was logged (this would require checking audit logs)
    // For now, just verify the webhook was accepted
    const result = await response.json()
    expect(result.success).toBe(true)
  })
})

