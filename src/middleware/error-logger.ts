import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging-service'

export async function errorLoggerMiddleware(request: NextRequest, response: NextResponse) {
  // Only log errors (5xx status codes)
  if (response.status >= 500) {
    try {
      const url = request.nextUrl.pathname
      const method = request.method
      const userAgent = request.headers.get('user-agent') || 'Unknown'
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       request.headers.get('x-real-ip') ||
                       request.headers.get('cf-connecting-ip') ||
                       'Unknown'

      await logger.logError(
        `HTTP ${response.status} Error: ${method} ${url}`,
        undefined, // No error object available in middleware
        {
          statusCode: response.status,
          method,
          url,
          userAgent,
          ipAddress,
          timestamp: new Date().toISOString()
        },
        request
      )
    } catch (logError) {
      // Don't let logging errors break the response
      console.error('Failed to log error:', logError)
    }
  }

  return response
}








