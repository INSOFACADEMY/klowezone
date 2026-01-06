import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-keys'

// POST /api/auth/verify-key - Verify an API key (public endpoint)
export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header with Bearer token required' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.replace('Bearer ', '')

    if (!apiKey || apiKey.length < 20) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      )
    }

    // Verify the API key
    const verification = await verifyApiKey(apiKey)

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or revoked API key' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key is valid',
      data: {
        organizationId: verification.orgId,
        apiKeyId: verification.apiKeyId,
        name: verification.name
      }
    })

  } catch (error) {
    console.error('Error verifying API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
