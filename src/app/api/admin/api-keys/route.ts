import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/middleware/admin-auth'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'
import { validateOrgPermission } from '@/lib/rbac/org-rbac'
import { createApiKey, listApiKeys } from '@/lib/api-keys'

// GET /api/admin/api-keys - List API keys for organization
export async function GET(request: NextRequest) {
  try {
    // Apply admin authentication middleware
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;

    // Get organization context (required for multi-tenant)
    let orgContext
    try {
      orgContext = await getOrgContext(request)
    } catch (error) {
      if (error instanceof TenantError) {
        return NextResponse.json(
          { error: `Organization context required: ${error.message}` },
          { status: 400 }
        )
      }
      throw error
    }

    // RBAC: API keys read requires OWNER or ADMIN role
    const permissionCheck = validateOrgPermission(orgContext, 'api-keys:read', 'read API keys')
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode }
      )
    }

    // List API keys for the organization
    const apiKeys = await listApiKeys(orgContext.orgId)

    return NextResponse.json({
      success: true,
      data: apiKeys
    })

  } catch (error) {
    console.error('Error listing API keys:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    // Apply admin authentication middleware
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;

    // Get organization context (required for multi-tenant)
    let orgContext
    try {
      orgContext = await getOrgContext(request)
    } catch (error) {
      if (error instanceof TenantError) {
        return NextResponse.json(
          { error: `Organization context required: ${error.message}` },
          { status: 400 }
        )
      }
      throw error
    }

    // RBAC: API keys create requires OWNER or ADMIN role
    const permissionCheck = validateOrgPermission(orgContext, 'api-keys:create', 'create API keys')
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be less than 100 characters' },
        { status: 400 }
      )
    }

    // Create the API key
    const result = await createApiKey(orgContext.orgId, user.id, name.trim())

    return NextResponse.json({
      success: true,
      message: 'API key created successfully',
      data: {
        apiKey: result.apiKeyPlain, // Only returned once on creation
        record: result.apiKeyRecord
      }
    })

  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
