import { test, expect } from '@playwright/test'
import { loginAsAdmin, makeAuthenticatedRequest, PAGE_ROUTES } from './utils/test-helpers'

test.describe('Organization Switching (Multi-Tenant)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should load user organizations', async ({ page }) => {
    const response = await makeAuthenticatedRequest(page, '/api/me/orgs')

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)
  })

  test('should get current organization context', async ({ page }) => {
    const response = await makeAuthenticatedRequest(page, '/api/me/org')

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('orgId')
    expect(data.data).toHaveProperty('orgRole')
    expect(data.data).toHaveProperty('userId')
  })

  test('should switch organizations successfully', async ({ page }) => {
    // First get available organizations
    const orgsResponse = await makeAuthenticatedRequest(page, '/api/me/orgs')
    const orgsData = await orgsResponse.json()

    expect(orgsData.data.length).toBeGreaterThan(0)

    const targetOrg = orgsData.data[0]
    const originalOrgResponse = await makeAuthenticatedRequest(page, '/api/me/org')
    const originalOrg = (await originalOrgResponse.json()).data

    // If user has only one org, create a test scenario
    if (orgsData.data.length === 1) {
      console.log('User has only one organization, testing single-org behavior')
      return
    }

    // Switch to different organization
    const switchResponse = await makeAuthenticatedRequest(page, '/api/me/org/switch', {
      method: 'POST',
      body: { orgId: targetOrg.id }
    })

    expect(switchResponse.status()).toBe(200)

    // Verify organization was switched
    const newOrgResponse = await makeAuthenticatedRequest(page, '/api/me/org')
    const newOrg = (await newOrgResponse.json()).data

    expect(newOrg.orgId).toBe(targetOrg.id)
  })

  test('should reject switching to invalid organization', async ({ page }) => {
    const invalidOrgId = 'invalid-org-id-12345'

    const response = await makeAuthenticatedRequest(page, '/api/me/org/switch', {
      method: 'POST',
      body: { orgId: invalidOrgId }
    })

    expect(response.status()).toBe(400)

    const error = await response.json()
    expect(error.error).toBeDefined()
  })

  test('should maintain organization context across API calls', async ({ page }) => {
    // Get current org
    const orgResponse = await makeAuthenticatedRequest(page, '/api/me/org')
    const currentOrg = (await orgResponse.json()).data

    // Make API calls that should be scoped to this org
    const settingsResponse = await makeAuthenticatedRequest(page, '/api/admin/settings')
    expect(settingsResponse.status()).toBe(200)

    const automationsResponse = await makeAuthenticatedRequest(page, '/api/admin/automations')
    expect(automationsResponse.status()).toBe(200)

    // All these calls should return data only for the current org
    const settingsData = await settingsResponse.json()
    const automationsData = await automationsResponse.json()

    // Verify data isolation (this assumes the API properly filters by org)
    expect(settingsData.success).toBe(true)
    expect(automationsData).toBeDefined()
  })

  test('should show organization switcher in admin UI', async ({ page }) => {
    await page.goto('/admin')

    // Look for organization switcher component
    const orgSwitcher = page.locator('[data-testid="org-switcher"], .org-switcher, [aria-label*="organization"]')

    // Organization switcher might not be implemented in UI yet
    // This test checks if the component exists or if we need to implement it
    const switcherExists = await orgSwitcher.count() > 0

    if (switcherExists) {
      // If it exists, test its functionality
      await expect(orgSwitcher).toBeVisible()

      // Test opening dropdown
      await orgSwitcher.click()

      // Should show organization list
      const orgList = page.locator('.org-dropdown, [role="listbox"]')
      await expect(orgList).toBeVisible()
    } else {
      console.log('Organization switcher not yet implemented in UI')
    }
  })

  test('should handle organization permissions correctly', async ({ page }) => {
    // Test that user can only access organizations they belong to
    const orgsResponse = await makeAuthenticatedRequest(page, '/api/me/orgs')
    const userOrgs = (await orgsResponse.json()).data

    // Try to access settings for each organization the user belongs to
    for (const org of userOrgs) {
      // Switch to this org
      const switchResponse = await makeAuthenticatedRequest(page, '/api/me/org/switch', {
        method: 'POST',
        body: { orgId: org.id }
      })

      if (switchResponse.status() === 200) {
        // Should be able to access settings for this org
        const settingsResponse = await makeAuthenticatedRequest(page, '/api/admin/settings')
        expect([200, 403]).toContain(settingsResponse.status()) // Either success or permission denied
      }
    }
  })

  test('should persist organization selection across sessions', async ({ page, context }) => {
    // Get current org
    const orgResponse = await makeAuthenticatedRequest(page, '/api/me/org')
    const currentOrg = (await orgResponse.json()).data

    // Create new page in same context (simulates new tab)
    const newPage = await context.newPage()
    await newPage.goto('/admin')

    // Check if org context is maintained
    const newPageOrgResponse = await makeAuthenticatedRequest(newPage, '/api/me/org')
    const newPageOrg = (await newPageOrgResponse.json()).data

    expect(newPageOrg.orgId).toBe(currentOrg.orgId)

    await newPage.close()
  })

  test('should handle organization member roles correctly', async ({ page }) => {
    const orgResponse = await makeAuthenticatedRequest(page, '/api/me/org')
    const orgData = (await orgResponse.json()).data

    // Verify role is valid
    expect(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).toContain(orgData.orgRole)

    // Test role-based permissions
    const settingsResponse = await makeAuthenticatedRequest(page, '/api/admin/settings')

    if (orgData.orgRole === 'OWNER' || orgData.orgRole === 'ADMIN') {
      // Should have access to settings
      expect(settingsResponse.status()).toBe(200)
    } else {
      // May have restricted access
      expect([200, 403]).toContain(settingsResponse.status())
    }
  })

  test('should validate organization membership', async ({ page }) => {
    // Try to switch to a non-existent organization
    const fakeOrgId = '00000000-0000-0000-0000-000000000000'

    const response = await makeAuthenticatedRequest(page, '/api/me/org/switch', {
      method: 'POST',
      body: { orgId: fakeOrgId }
    })

    expect(response.status()).toBe(400)

    const error = await response.json()
    expect(error.error).toContain('organization')
  })

  test('should handle concurrent organization switches', async ({ page, context }) => {
    const orgsResponse = await makeAuthenticatedRequest(page, '/api/me/orgs')
    const userOrgs = (await orgsResponse.json()).data

    if (userOrgs.length < 2) {
      console.log('Need at least 2 organizations for concurrent switching test')
      return
    }

    // Create multiple pages
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ])

    // Login on each page
    await Promise.all(pages.map(async (p) => {
      await p.goto('/login')
      await p.fill('input[type="email"]', 'admin@klowezone.com')
      await p.fill('input[type="password"]', 'SuperAdmin123!')
      await p.click('button[type="submit"]')
      await p.waitForURL('**/admin')
    }))

    // Switch each page to different organizations concurrently
    const switchPromises = pages.map(async (p, index) => {
      const targetOrg = userOrgs[index % userOrgs.length]
      const response = await makeAuthenticatedRequest(p, '/api/me/org/switch', {
        method: 'POST',
        body: { orgId: targetOrg.id }
      })
      return response
    })

    const results = await Promise.all(switchPromises)

    // All switches should succeed
    results.forEach(response => {
      expect(response.status()).toBe(200)
    })

    // Cleanup
    await Promise.all(pages.map(p => p.close()))
  })

  test('should maintain data isolation between organizations', async ({ page }) => {
    const orgsResponse = await makeAuthenticatedRequest(page, '/api/me/orgs')
    const userOrgs = (await orgsResponse.json()).data

    if (userOrgs.length < 2) {
      console.log('Need at least 2 organizations for data isolation test')
      return
    }

    const orgA = userOrgs[0]
    const orgB = userOrgs[1]

    // Switch to org A and create a setting
    await makeAuthenticatedRequest(page, '/api/me/org/switch', {
      method: 'POST',
      body: { orgId: orgA.id }
    })

    const settingNameA = `test_isolation_a_${Date.now()}`
    await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: settingNameA,
        value: 'value_for_org_a',
        category: 'test'
      }
    })

    // Switch to org B and create a different setting
    await makeAuthenticatedRequest(page, '/api/me/org/switch', {
      method: 'POST',
      body: { orgId: orgB.id }
    })

    const settingNameB = `test_isolation_b_${Date.now()}`
    await makeAuthenticatedRequest(page, '/api/admin/settings', {
      method: 'POST',
      body: {
        key: settingNameB,
        value: 'value_for_org_b',
        category: 'test'
      }
    })

    // Verify data isolation
    const settingsResponse = await makeAuthenticatedRequest(page, '/api/admin/settings')
    const settings = (await settingsResponse.json()).data

    // Should only see settings from current org (B)
    const settingFromOrgB = settings.find((s: any) => s.key === settingNameB)
    const settingFromOrgA = settings.find((s: any) => s.key === settingNameA)

    expect(settingFromOrgB).toBeDefined()
    expect(settingFromOrgA).toBeUndefined()
  })
})







