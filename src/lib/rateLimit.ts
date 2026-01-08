/**
 * REDIS-BASED RATE LIMITING
 *
 * Fixed-window rate limiting using Redis INCR + EXPIRE
 * Distributed and scalable across multiple instances
 */

import { createClient } from 'redis'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyPrefix?: string // Prefix for Redis keys
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

type RateLimitResult =
  | {
      success: true
      remaining: number
      resetTime: number
    }
  | {
      success: false
      limit: number
      remaining: number
      resetTime: number
      retryAfter: number
    }

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null

function getRedisClient(): ReturnType<typeof createClient> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      console.log('Connected to Redis for rate limiting')
    })
  }

  return redisClient
}

export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'ratelimit',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config

  return async function rateLimit(
    identifier: string,
    options?: {
      skipCheck?: boolean
    }
  ): Promise<RateLimitResult> {
    try {
      const client = getRedisClient()

      // Ensure connection
      if (!client.isOpen) {
        await client.connect()
      }

      const key = `${keyPrefix}:${identifier}`
      const now = Date.now()
      const windowStart = Math.floor(now / windowMs) * windowMs
      const windowKey = `${key}:${windowStart}`

      // Get current count
      const currentCount = Number(await client.incr(windowKey))

      // Set expiry if this is the first request in the window
      if (currentCount === 1) {
        await client.expire(windowKey, Math.ceil(windowMs / 1000))
      }

      const remaining = Math.max(0, maxRequests - currentCount)
      const resetTime = windowStart + windowMs

      if (currentCount > maxRequests) {
        return {
          success: false,
          limit: maxRequests,
          remaining,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000)
        }
      }

      return {
        success: true,
        remaining,
        resetTime
      }

    } catch (error) {
      console.error('Rate limiting error:', error)

      // Fallback to allow request if Redis fails
      // This prevents blocking legitimate requests when Redis is down
      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowMs
      }
    }
  }
}

// Pre-configured rate limiters
export const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // Very strict for sensitive operations
  keyPrefix: 'ratelimit:strict'
})

export const moderateRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Moderate for general API access
  keyPrefix: 'ratelimit:moderate'
})

export const lenientRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // Lenient for webhooks and public endpoints
  keyPrefix: 'ratelimit:lenient'
})

// API Key specific rate limiting
export const apiKeyRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute per API key
  keyPrefix: 'ratelimit:apikey'
})

// Admin operations rate limiting
export const adminRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 50, // 50 admin operations per 5 minutes
  keyPrefix: 'ratelimit:admin'
})

// Helper function to generate rate limit key from NextRequest
export function getRateLimitKey(request: any, type: 'ip' | 'user' | 'apikey' = 'ip'): string {
  switch (type) {
    case 'ip':
      return request.ip ||
             request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

    case 'user':
      // For user-based limiting, you'd need to extract user ID from auth
      return request.userId || 'anonymous'

    case 'apikey':
      const apiKey = request.headers.get('x-api-key')
      return apiKey ? `apikey_${apiKey}` : 'unknown_apikey'

    default:
      return 'unknown'
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit()
  }
})

process.on('SIGTERM', async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit()
  }
})
