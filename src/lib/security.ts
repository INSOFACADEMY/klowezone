/**
 * Security utilities for request analysis and protection
 */

/**
 * Internal helper to get header value from either Headers object or Record
 */
function getHeaderValue(
  headers: Headers | Record<string, string | string[] | undefined>,
  key: string
): string | string[] | undefined {
  // Duck-typed detection: check if it's a Headers-like object with .get method
  if (headers && typeof (headers as any).get === 'function') {
    return (headers as Headers).get(key) || undefined
  }

  // For Record objects, do case-insensitive lookup
  if (headers && typeof headers === 'object') {
    const normalizedKey = key.toLowerCase()
    // Find the key case-insensitively
    const foundKey = Object.keys(headers).find(k => k.toLowerCase() === normalizedKey)
    return foundKey ? (headers as any)[foundKey] : undefined
  }

  return undefined
}

/**
 * Heuristic detection: Determines if a request likely comes from a browser
 * based on typical browser headers (origin, sec-fetch-*).
 *
 * This is NOT a cryptographic proof - serves to prevent accidental frontend usage
 * and reduce risk of API key exposure, but can be bypassed by determined actors.
 *
 * Accepts both Headers (Next.js) and Record objects for flexibility.
 */
export function isLikelyBrowserRequest(headers: Headers | Record<string, string | string[] | undefined>): boolean {
  return Boolean(
    getHeaderValue(headers, 'origin') ||
    getHeaderValue(headers, 'sec-fetch-site') ||
    getHeaderValue(headers, 'sec-fetch-mode') ||
    getHeaderValue(headers, 'sec-fetch-dest')
  )
}

/**
 * Extracts IP address from request headers, handling forwarded headers correctly.
 * Handles both Headers objects and Record objects, and supports x-forwarded-for as string or string[].
 *
 * Always takes the first IP from comma-separated values (handles proxies/load balancers).
 */
export function extractIPAddress(headers: Headers | Record<string, string | string[] | undefined>): string {
  // Get x-forwarded-for header
  const forwardedFor = getHeaderValue(headers, 'x-forwarded-for')

  // Handle string or string[] case
  let forwardedValue: string | undefined
  if (Array.isArray(forwardedFor)) {
    forwardedValue = forwardedFor[0] // Take first element if array
  } else if (typeof forwardedFor === 'string') {
    forwardedValue = forwardedFor
  }

  // Take first IP if comma-separated (handles multiple proxies)
  if (forwardedValue) {
    return forwardedValue.split(',')[0].trim()
  }

  // Fallback to x-real-ip
  const realIP = getHeaderValue(headers, 'x-real-ip')
  if (typeof realIP === 'string') {
    return realIP
  }

  return 'unknown'
}
