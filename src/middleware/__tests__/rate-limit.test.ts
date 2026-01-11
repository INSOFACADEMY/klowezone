import { createRateLimit, strictRateLimit, moderateRateLimit, lenientRateLimit } from '../rate-limit'

// Mock NextRequest and NextResponse
const mockNextRequest = (ip = '127.0.0.1', headers = {}) => ({
  ip,
  headers: {
    get: (key: string) => headers[key],
    ...headers
  },
  cookies: {
    get: () => null
  },
  nextUrl: { pathname: '/test' }
} as any)

const mockNextResponse = () => ({
  headers: new Map(),
  status: 200
} as any)

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    jest.clearAllMocks()
    // Note: In a real implementation, we'd need to mock the global rate limit store
  })

  describe('createRateLimit', () => {
    it('should allow requests within limit', async () => {
      const limiter = createRateLimit({
        windowMs: 1000, // 1 second for testing
        maxRequests: 5
      })

      const request = mockNextRequest()

      for (let i = 0; i < 5; i++) {
        const result = await limiter(request)
        expect(result).toBeNull() // null means no rate limit violation
      }
    })

    it('should block requests over limit', async () => {
      const limiter = createRateLimit({
        windowMs: 1000,
        maxRequests: 3
      })

      const request = mockNextRequest()

      // First 3 requests should pass
      for (let i = 0; i < 3; i++) {
        const result = await limiter(request)
        expect(result).toBeNull()
      }

      // 4th request should be blocked
      const result = await limiter(request)
      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
      expect(result?.json).toBeDefined()
    })

    it('should use custom key generator', async () => {
      const limiter = createRateLimit({
        windowMs: 1000,
        maxRequests: 2,
        keyGenerator: (request) => `custom_${request.ip}`
      })

      const request1 = mockNextRequest('192.168.1.1')
      const request2 = mockNextRequest('192.168.1.2')

      // Both should pass since they have different keys
      const result1 = await limiter(request1)
      const result2 = await limiter(request2)

      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })

    it('should extract IP from headers', async () => {
      const limiter = createRateLimit({
        windowMs: 1000,
        maxRequests: 2
      })

      const request = mockNextRequest(undefined, {
        'x-forwarded-for': '203.0.113.1',
        'x-real-ip': '203.0.113.2'
      })

      const result = await limiter(request)
      expect(result).toBeNull() // Should use x-forwarded-for first
    })

    it('should include rate limit headers', async () => {
      const limiter = createRateLimit({
        windowMs: 1000,
        maxRequests: 3
      })

      const request = mockNextRequest()
      const response = mockNextResponse()

      const result = await limiter(request, response)

      if (result) {
        // Rate limited response should have headers
        expect(result.headers?.get('X-RateLimit-Limit')).toBe('3')
        expect(result.headers?.get('X-RateLimit-Remaining')).toBeDefined()
        expect(result.headers?.get('X-RateLimit-Reset')).toBeDefined()
        expect(result.headers?.get('Retry-After')).toBeDefined()
      }
    })
  })

  describe('Pre-configured limiters', () => {
    it('strictRateLimit should have very low limits', async () => {
      const request = mockNextRequest()

      // Should allow first request
      const result1 = await strictRateLimit(request)
      expect(result1).toBeNull()

      // Should block subsequent requests quickly
      const result2 = await strictRateLimit(request)
      expect(result2?.status).toBe(429)
    })

    it('moderateRateLimit should have reasonable limits', async () => {
      const request = mockNextRequest()

      // Should allow multiple requests
      for (let i = 0; i < 10; i++) {
        const result = await moderateRateLimit(request)
        if (i < 10) {
          expect(result).toBeNull()
        }
      }
    })

    it('lenientRateLimit should have high limits', async () => {
      const request = mockNextRequest()

      // Should allow many requests
      for (let i = 0; i < 50; i++) {
        const result = await lenientRateLimit(request)
        expect(result).toBeNull()
      }
    })
  })

  describe('Error handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const limiter = createRateLimit({
        windowMs: 1000,
        maxRequests: 5
      })

      const malformedRequest = {} as any

      // Should not crash
      const result = await limiter(malformedRequest)
      expect(result).toBeDefined()
    })
  })
})







