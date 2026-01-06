import { NextRequest, NextResponse } from 'next/server'
import { apiKeyAuth, isApiKeyAuthResult } from '@/middleware/api-key-auth'
import { ingestWebhookEvent, webhookPayloadSchema } from '@/lib/webhook-service'
import { prisma } from '@/lib/prisma'

// POST /api/hooks/ingest - Ingest webhook events
export async function POST(request: NextRequest) {
  try {
    // Authenticate using API key
    const authResult = await apiKeyAuth(request)

    if (!isApiKeyAuthResult(authResult)) {
      return authResult // This is already a NextResponse with error
    }

    const { orgId, apiKeyId, apiKeyName } = authResult

    // Get and validate request body
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    // Validate payload with Zod
    const validationResult = webhookPayloadSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const payload = validationResult.data

    // Check payload size (basic protection against giant payloads)
    const payloadSize = JSON.stringify(payload.payload).length
    if (payloadSize > 1024 * 1024) { // 1MB limit
      return NextResponse.json(
        { error: 'Payload too large (max 1MB)', code: 'PAYLOAD_TOO_LARGE' },
        { status: 413 }
      )
    }

    // Extract API key prefix for rate limiting
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { keyPrefix: true }
    })

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: 'API key not found', code: 'API_KEY_NOT_FOUND' },
        { status: 401 }
      )
    }

    // Ingest the webhook event
    const result = await ingestWebhookEvent(
      orgId,
      apiKeyId,
      apiKeyRecord.keyPrefix,
      payload
    )

    if (!result.success) {
      const statusCode = result.code === 'RATE_LIMIT_EXCEEDED' ? 429 :
                        result.code === 'DUPLICATE_EVENT' ? 409 : 400

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusCode }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        eventId: result.eventId,
        eventType: payload.eventType,
        triggered: result.triggered,
        runIds: result.runIds,
        jobIds: result.jobIds,
        organizationId: orgId,
        apiKeyName,
      }
    })

  } catch (error) {
    console.error('Webhook ingestion endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
