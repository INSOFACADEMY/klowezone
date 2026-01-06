/**
 * WEBHOOK INGESTION SERVICE
 *
 * Handles webhook event ingestion, validation, persistence, and workflow triggering
 */

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createAutomationRun, queueJob } from '@/lib/automation-services'
import { logAuditEvent } from '@/lib/logging-service'
import { validateEvent } from '@/lib/events/catalog'

// Rate limiting (in-memory MVP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per minute per API key

// Zod schema for webhook payload validation
export const webhookPayloadSchema = z.object({
  eventType: z.string().min(1).max(100),
  idempotencyKey: z.string().optional(),
  payload: z.any(),
  source: z.string().optional(),
})

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>

export interface WebhookIngestionResult {
  success: true
  eventId: string
  triggered: number
  runIds: string[]
  jobIds: string[]
}

export interface WebhookIngestionError {
  success: false
  error: string
  code: string
}

/**
 * Check rate limit for API key
 */
function checkRateLimit(apiKeyPrefix: string): boolean {
  const now = Date.now()
  const keyData = rateLimitMap.get(apiKeyPrefix)

  if (!keyData || now > keyData.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(apiKeyPrefix, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }

  if (keyData.count >= RATE_LIMIT_MAX) {
    return false
  }

  keyData.count++
  return true
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimit(): void {
  const now = Date.now()
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Ingest a webhook event
 */
export async function ingestWebhookEvent(
  orgId: string,
  apiKeyId: string,
  apiKeyPrefix: string,
  payload: WebhookPayload
): Promise<WebhookIngestionResult | WebhookIngestionError> {
  try {
    // Rate limiting check
    if (!checkRateLimit(apiKeyPrefix)) {
      return {
        success: false,
        error: 'Rate limit exceeded. Maximum 100 requests per minute.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    }

    // Clean up old rate limit entries periodically
    cleanupRateLimit()

    // Check idempotency if provided
    if (payload.idempotencyKey) {
      const existingEvent = await prisma.eventLog.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: orgId,
            idempotencyKey: payload.idempotencyKey
          }
        }
      })

      if (existingEvent) {
        return {
          success: false,
          error: 'Event already processed (idempotency key)',
          code: 'DUPLICATE_EVENT'
        }
      }
    }

    // Validate payload against event schema
    const validationResult = validateEvent(payload.eventType, payload.payload)

    let validatedPayload: any
    let unvalidated = false

    if (validationResult.success && validationResult.validated) {
      // Payload validated successfully
      validatedPayload = validationResult.data
      unvalidated = false
    } else if (validationResult.success && !validationResult.validated) {
      // Event type not in catalog, allow but mark as unvalidated
      validatedPayload = payload.payload
      unvalidated = true
    } else {
      // Validation failed
      return {
        success: false,
        error: validationResult.error || 'Payload validation failed',
        code: 'VALIDATION_FAILED'
      }
    }

    // Persist the event
    const eventLog = await prisma.eventLog.create({
      data: {
        organizationId: orgId,
        eventType: payload.eventType,
        payload: validatedPayload,
        source: payload.source,
        idempotencyKey: payload.idempotencyKey,
        apiKeyId: apiKeyId,
        unvalidated,
      },
    })

    // Find matching workflows and trigger them
    const triggeredWorkflows = await triggerWorkflowsForEvent(orgId, payload.eventType)

    // Audit logging
    await logAuditEvent({
      userId: null, // Webhook events don't have user context
      organizationId: orgId,
      action: 'WEBHOOK_INGESTED',
      resourceType: 'WEBHOOK_EVENT',
      resourceId: eventLog.id,
      details: {
        eventType: payload.eventType,
        source: payload.source,
        apiKeyPrefix,
        triggered: triggeredWorkflows.length,
        idempotencyKey: payload.idempotencyKey,
      },
    })

    return {
      success: true,
      eventId: eventLog.id,
      triggered: triggeredWorkflows.length,
      runIds: triggeredWorkflows.map(w => w.runId).slice(0, 20), // Limit to 20 IDs
      jobIds: triggeredWorkflows.flatMap(w => w.jobIds).slice(0, 20), // Limit to 20 IDs
    }

  } catch (error) {
    console.error('Webhook ingestion error:', error)
    return {
      success: false,
      error: 'Internal server error during webhook ingestion',
      code: 'INTERNAL_ERROR'
    }
  }
}

/**
 * Find and trigger workflows that match the event type
 */
async function triggerWorkflowsForEvent(orgId: string, eventType: string): Promise<Array<{ runId: string; jobIds: string[] }>> {
  try {
    // Find active workflows that match the event type
    // For MVP, we'll use exact match on trigger field
    const matchingWorkflows = await prisma.automationWorkflow.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        trigger: eventType, // Exact match for MVP
      },
      select: {
        id: true,
        name: true,
      },
    })

    const results: Array<{ runId: string; jobIds: string[] }> = []

    for (const workflow of matchingWorkflows) {
      try {
        // Create automation run
        const automationRun = await createAutomationRun(workflow.id, {
          trigger: 'WEBHOOK',
          eventType,
          source: 'webhook_ingestion',
        })

        // Queue initial job for the workflow
        const job = await queueJob(automationRun.id, 'EXECUTE_WORKFLOW', {
          workflowId: workflow.id,
          runId: automationRun.id,
          trigger: 'WEBHOOK',
          eventType,
        })

        results.push({
          runId: automationRun.id,
          jobIds: [job.id],
        })

      } catch (error) {
        console.error(`Failed to trigger workflow ${workflow.id}:`, error)
        // Continue with other workflows even if one fails
      }
    }

    return results

  } catch (error) {
    console.error('Error triggering workflows for event:', error)
    return []
  }
}

/**
 * Get recent events for an organization (for debugging/admin)
 */
export async function getRecentEvents(orgId: string, limit = 50): Promise<any[]> {
  const events = await prisma.eventLog.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      eventType: true,
      source: true,
      unvalidated: true,
      createdAt: true,
      apiKey: {
        select: {
          keyPrefix: true,
          name: true,
        },
      },
    },
  })

  return events
}
