import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/middleware/admin-auth'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'
import { validateOrgPermission } from '@/lib/rbac/org-rbac'
import { revokeApiKey, getApiKeyById } from '@/lib/api-keys'

// DELETE /api/admin/api-keys/[id] - Revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply admin authentication middleware
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user, orgId } = auth;

    // Create orgContext for permission validation (admin users have ADMIN role)
    const orgContext = {
      userId: user.id,
      orgId,
      orgRole: 'ADMIN' as const
    }

    // RBAC: API keys revoke requires OWNER or ADMIN role
    const permissionCheck = validateOrgPermission(orgContext, 'api-keys:revoke', 'revoke API keys')
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode }
      )
    }

    const apiKeyId = params.id

    if (!apiKeyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    // Verify the API key exists and belongs to the organization
    const apiKey = await getApiKeyById(apiKeyId, orgContext.orgId)
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    // Revoke the API key
    await revokeApiKey(apiKeyId, orgContext.orgId, user.id)

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    })

  } catch (error) {
    console.error('Error revoking API key:', error)

    if (error instanceof Error && error.message === 'API key not found or already revoked') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
