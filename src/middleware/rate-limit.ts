import { NextRequest, NextResponse } from 'next/server'
import {
  strictRateLimit as redisStrictRateLimit,
  moderateRateLimit as redisModerateRateLimit,
  lenientRateLimit as redisLenientRateLimit,
  apiKeyRateLimit as redisApiKeyRateLimit,
  adminRateLimit as redisAdminRateLimit
} from '@/lib/rateLimit'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
  skipSuccessfulRequests?: boolean // Skip rate limiting for successful requests
  skipFailedRequests?: boolean // Skip rate limiting for failed requests
}

/**
 * LEGACY COMPATIBILITY LAYER
 *
 * This middleware maintains the same interface as the old in-memory version
 * but now uses Redis under the hood for distributed rate limiting
 */
export function createRateLimit(config: RateLimitConfig) {
  // This creates a middleware wrapper around the Redis rate limiting
  const {
    windowMs,
    maxRequests,
    keyGenerator = getRateLimitKey,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config

  // Select appropriate Redis rate limiter based on config
  let redisLimiter: (identifier: string) => Promise<any>
  if (maxRequests <= 10) {
    redisLimiter = redisStrictRateLimit
  } else if (maxRequests <= 100) {
    redisLimiter = redisModerateRateLimit
  } else {
    redisLimiter = redisLenientRateLimit
  }

  return async function rateLimitMiddleware(
    request: NextRequest,
    response?: NextResponse
  ): Promise<NextResponse | null> {
    try {
      const key = keyGenerator(request, 'ip')
      const result = await redisLimiter(key)

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter
          },
          {
            status: 429,
            headers: {
              'Retry-After': result.retryAfter.toString(),
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString()
            }
          }
        )
      }

      // Add rate limit headers to response if provided
      if (response) {
        response.headers.set('X-RateLimit-Limit', result.limit?.toString() || maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
      }

      return null // No rate limit violation

    } catch (error) {
      console.error('Rate limiting error:', error)

      // Fallback: allow request if Redis fails to prevent blocking legitimate traffic
      if (response) {
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', (maxRequests - 1).toString())
        response.headers.set('X-RateLimit-Reset', (Date.now() + windowMs).toString())
      }

      return null
    }
  }
}

// Helper function to generate rate limit key from NextRequest
function getRateLimitKey(request: NextRequest, type: 'ip' | 'user' | 'apikey' = 'ip'): string {
  switch (type) {
    case 'ip':
      return request.ip ||
             request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'

    case 'user':
      // For user-based limiting, you'd need to extract user ID from auth
      return request.headers.get('x-user-id') || 'anonymous'

    case 'apikey':
      const apiKey = request.headers.get('x-api-key')
      return apiKey ? `apikey_${apiKey}` : 'unknown_apikey'

    default:
      return 'unknown'
  }
}

// Pre-configured middleware functions (compatibility layer around Redis)
export const strictRateLimitMiddleware = async (request: NextRequest, response?: NextResponse): Promise<NextResponse | null> => {
  const result = await redisStrictRateLimit(getRateLimitKey(request, 'ip'))
  return handleRateLimitResult(result, request, response, 10)
}

export const moderateRateLimitMiddleware = async (request: NextRequest, response?: NextResponse): Promise<NextResponse | null> => {
  const result = await redisModerateRateLimit(getRateLimitKey(request, 'ip'))
  return handleRateLimitResult(result, request, response, 100)
}

export const lenientRateLimitMiddleware = async (request: NextRequest, response?: NextResponse): Promise<NextResponse | null> => {
  const result = await redisLenientRateLimit(getRateLimitKey(request, 'ip'))
  return handleRateLimitResult(result, request, response, 1000)
}

export const apiKeyRateLimitMiddleware = async (request: NextRequest, response?: NextResponse): Promise<NextResponse | null> => {
  const apiKey = request.headers.get('x-api-key')
  const key = apiKey ? `apikey_${apiKey}` : 'unknown_apikey'
  const result = await redisApiKeyRateLimit(key)
  return handleRateLimitResult(result, request, response, 60)
}

export const adminRateLimitMiddleware = async (request: NextRequest, response?: NextResponse): Promise<NextResponse | null> => {
  const token = request.cookies.get('admin_token')?.value
  const key = token ? `admin_${token}` : 'unknown_admin'
  const result = await redisAdminRateLimit(key)
  return handleRateLimitResult(result, request, response, 50)
}

// Helper function to handle rate limit results consistently
function handleRateLimitResult(
  result: any,
  request: NextRequest,
  response?: NextResponse,
  limit?: number
): NextResponse | null {
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.retryAfter.toString(),
          'X-RateLimit-Limit': (result.limit || limit || 100).toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    )
  }

  // Add rate limit headers to response if provided
  if (response) {
    response.headers.set('X-RateLimit-Limit', (result.limit || limit || 100).toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
  }

  return null // No rate limit violation
}

// Export legacy names for backward compatibility
export const strictRateLimit = strictRateLimitMiddleware
export const moderateRateLimit = moderateRateLimitMiddleware
export const lenientRateLimit = lenientRateLimitMiddleware
export const apiKeyRateLimit = apiKeyRateLimitMiddleware
export const adminRateLimit = adminRateLimitMiddleware


