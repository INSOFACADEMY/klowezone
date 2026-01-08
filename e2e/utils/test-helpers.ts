import { Page, expect } from '@playwright/test'
import { createHash } from 'crypto'

/**
 * Test helpers for KloweZone E2E tests
 */

// Test user credentials
export const TEST_USERS = {
  admin: {
    email: 'admin@klowezone.com',
    password: 'SuperAdmin123!',
  },
  member: {
    email: 'test@klowezone.com', // Updated to match Supabase test user
    password: 'TestPass123!',
  }
}

// API endpoints
export const API_ENDPOINTS = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  me: '/api/me',
  orgs: '/api/me/orgs',
  orgSwitch: '/api/me/org/switch',
  settings: '/api/admin/settings',
  automations: '/api/admin/automations',
  webhooks: '/api/hooks/ingest',
}

// Page routes
export const PAGE_ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  admin: '/admin',
  onboarding: '/onboarding',
}

/**
 * Login helper function
 */
export async function loginAsAdmin(page: Page) {
  await page.goto(PAGE_ROUTES.login)

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Fill login form using correct selectors
  await page.fill('#email', TEST_USERS.admin.email)
  await page.fill('#password', TEST_USERS.admin.password)

  // Click login button
  await page.click('button[type="submit"]')

  // Wait for redirect to admin
  await page.waitForURL('**/admin', { timeout: 15000 })

  // Verify we're on admin page
  await expect(page).toHaveURL(/.*\/admin/)
}

/**
 * Login helper for regular users
 */
export async function loginAsUser(page: Page, userType: 'admin' | 'member' = 'admin') {
  await page.goto(PAGE_ROUTES.login)

  await page.waitForLoadState('networkidle')

  const user = TEST_USERS[userType]
  await page.fill('#email', user.email)
  await page.fill('#password', user.password)

  await page.click('button[type="submit"]')

  // Wait for redirect
  if (userType === 'admin') {
    await page.waitForURL('**/admin', { timeout: 15000 })
  } else {
    await page.waitForURL('**/dashboard', { timeout: 15000 })
  }
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Look for logout button - it should be in the header
  const logoutButton = page.locator('button').filter({ hasText: 'Salir' })
  await expect(logoutButton).toBeVisible()
  await logoutButton.click()

  // Should redirect to login
  await page.waitForURL('**/login')
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(page: Page, url: string, method: string = 'GET') {
  return page.waitForResponse(response =>
    response.url().includes(url) && response.request().method() === method
  )
}

/**
 * Create API key for testing
 */
export async function createTestApiKey(page: Page, name: string = 'Test API Key') {
  // Navigate to API keys section
  await page.goto('/admin')
  await page.click('text=API Keys')

  // Click create button
  await page.click('button:has-text("Create API Key")')

  // Fill form
  await page.fill('input[name="name"]', name)

  // Submit
  await page.click('button[type="submit"]')

  // Wait for success and get the API key
  await page.waitForSelector('.api-key-display')

  const apiKey = await page.locator('.api-key-display').textContent()
  return apiKey?.trim()
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(
  page: Page,
  endpoint: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
) {
  const { method = 'GET', body, headers = {} } = options

  // Get auth token from cookies
  const cookies = await page.context().cookies()
  const adminToken = cookies.find(c => c.name === 'admin_token')?.value
  const kzOrg = cookies.find(c => c.name === 'kz_org')?.value

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  }

  if (adminToken) {
    requestHeaders['Cookie'] = `admin_token=${adminToken}; kz_org=${kzOrg || ''}`
  }

  const requestOptions = {
    headers: requestHeaders,
    data: body ? JSON.stringify(body) : undefined,
  }

  let response: any
  const methodUpper = method.toUpperCase()

  switch (methodUpper) {
    case 'GET':
      response = await page.request.get(endpoint, requestOptions)
      break
    case 'POST':
      response = await page.request.post(endpoint, requestOptions)
      break
    case 'PUT':
      response = await page.request.put(endpoint, requestOptions)
      break
    case 'PATCH':
      response = await page.request.patch(endpoint, requestOptions)
      break
    case 'DELETE':
      response = await page.request.delete(endpoint, requestOptions)
      break
    default:
      throw new Error(`Unsupported HTTP method: ${method}`)
  }

  return response
}

/**
 * Generate test data
 */
export function generateTestData(prefix: string = 'test') {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  return {
    name: `${prefix}_${timestamp}_${random}`,
    email: `${prefix}_${timestamp}_${random}@test.com`,
    description: `Test ${prefix} created at ${new Date(timestamp).toISOString()}`,
    timestamp,
    random
  }
}

/**
 * Wait for element with better error messages
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' | 'detached' } = {}
) {
  const { timeout = 5000, state = 'visible' } = options

  try {
    await page.waitForSelector(selector, { timeout, state })
  } catch (error) {
    const currentUrl = page.url()
    const pageContent = await page.textContent('body')
    throw new Error(
      `Element "${selector}" not found on page ${currentUrl}. ` +
      `Page content: ${pageContent?.substring(0, 500)}...`
    )
  }
}

/**
 * Take screenshot on failure
 */
export async function takeScreenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({
    path: `test-results/screenshots/${testName}_failure.png`,
    fullPage: true
  })
}

/**
 * Clean up test data
 */
export async function cleanupTestData(page: Page) {
  // This would clean up any test data created during tests
  // For now, just log that cleanup is needed
  console.log('Note: Test data cleanup should be implemented')
}

/**
 * Verify rate limiting is working
 */
export async function testRateLimiting(page: Page, endpoint: string, maxRequests: number = 10) {
  const responses = []

  for (let i = 0; i < maxRequests + 5; i++) {
    try {
      const response = await makeAuthenticatedRequest(page, endpoint)
      responses.push({
        status: response.status(),
        rateLimitRemaining: response.headers()['x-ratelimit-remaining'],
        rateLimitReset: response.headers()['x-ratelimit-reset']
      })
    } catch (error) {
      responses.push({ error: error instanceof Error ? error.message : String(error) })
    }
  }

  // Check that some requests were rate limited
  const rateLimitedResponses = responses.filter(r =>
    r.status === 429 || r.error?.includes('rate limit')
  )

  return {
    totalRequests: responses.length,
    rateLimitedCount: rateLimitedResponses.length,
    wasRateLimited: rateLimitedResponses.length > 0,
    responses
  }
}

