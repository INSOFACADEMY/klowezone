import { NextRequest, NextResponse } from 'next/server'
import { moderateRateLimit, apiKeyRateLimit } from '@/middleware/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Special handling for webhook ingestion (more lenient)
    if (pathname === '/api/hooks/ingest') {
      const rateLimitResult = await apiKeyRateLimit(request)
      if (rateLimitResult) return rateLimitResult
    }
    // Admin routes get stricter rate limiting
    else if (pathname.startsWith('/api/admin/')) {
      const rateLimitResult = await moderateRateLimit(request)
      if (rateLimitResult) return rateLimitResult
    }
    // General API routes get moderate rate limiting
    else if (pathname.startsWith('/api/')) {
      const rateLimitResult = await moderateRateLimit(request)
      if (rateLimitResult) return rateLimitResult
    }
  }

  return NextResponse.next()
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}













