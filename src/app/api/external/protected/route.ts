import { NextRequest, NextResponse } from 'next/server'
import { apiKeyAuth, isApiKeyAuthResult } from '@/middleware/api-key-auth'

// POST /api/external/protected - Example protected endpoint using API key auth
export async function POST(request: NextRequest) {
  try {
    // Authenticate using API key
    const authResult = await apiKeyAuth(request)

    if (!isApiKeyAuthResult(authResult)) {
      // authResult is a NextResponse with error
      return authResult
    }

    // At this point, we have valid API key authentication
    const { orgId, apiKeyId, apiKeyName } = authResult

    // Get request body if needed
    const body = await request.json().catch(() => ({}))

    // Process the request with organization context
    return NextResponse.json({
      success: true,
      message: 'Protected endpoint accessed successfully',
      data: {
        organizationId: orgId,
        apiKeyId,
        apiKeyName,
        timestamp: new Date().toISOString(),
        receivedData: body,
      }
    })

  } catch (error) {
    console.error('Protected endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/external/protected - Also protected
export async function GET(request: NextRequest) {
  try {
    // Authenticate using API key
    const authResult = await apiKeyAuth(request)

    if (!isApiKeyAuthResult(authResult)) {
      return authResult
    }

    const { orgId, apiKeyId, apiKeyName } = authResult

    return NextResponse.json({
      success: true,
      message: 'Protected GET endpoint accessed successfully',
      data: {
        organizationId: orgId,
        apiKeyId,
        apiKeyName,
        timestamp: new Date().toISOString(),
        method: 'GET',
      }
    })

  } catch (error) {
    console.error('Protected GET endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







