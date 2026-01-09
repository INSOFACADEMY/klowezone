/**
 * API KEY AUTHENTICATION MIDDLEWARE
 *
 * Validates API keys for external routes and attaches organization context
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-keys'

export interface ApiKeyAuthResult {
  orgId: string
  apiKeyId: string
  apiKeyName: string
}

/**
 * Middleware function to authenticate requests using API keys
 * Reads x-api-key header and validates the key
 */
export async function apiKeyAuth(request: NextRequest): Promise<ApiKeyAuthResult | NextResponse> {
  try {
    // Get API key from x-api-key header
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Use x-api-key header.' },
        { status: 401 }
      )
    }

    if (typeof apiKey !== 'string' || apiKey.length < 20) {
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

    // Return the authentication result with organization context
    return {
      orgId: verification.orgId,
      apiKeyId: verification.apiKeyId,
      apiKeyName: verification.name,
    }

  } catch (error) {
    console.error('API key authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get API key auth result or throw error
 * Useful for API route handlers that require API key authentication
 */
export async function requireApiKeyAuth(request: NextRequest): Promise<ApiKeyAuthResult> {
  const result = await apiKeyAuth(request)

  if (result instanceof NextResponse) {
    // This will throw an error that can be caught by Next.js error handling
    throw new Error(`API key authentication failed: ${result.status}`)
  }

  return result
}

/**
 * Type guard to check if result is ApiKeyAuthResult (not NextResponse)
 */
export function isApiKeyAuthResult(result: ApiKeyAuthResult | NextResponse): result is ApiKeyAuthResult {
  return !(result instanceof NextResponse)
}





