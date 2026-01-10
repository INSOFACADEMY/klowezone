import { NextRequest, NextResponse } from 'next/server'
import { updateWorkflow, deleteWorkflow, toggleWorkflow } from '@/lib/automation-services'
import { requireAdminUser, hasAnyPermission } from '@/middleware/admin-auth'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'
import { validateOrgPermission } from '@/lib/rbac/org-rbac'

// PUT /api/admin/automations/[id] - Update workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user, orgId } = auth;

    // Check permissions: need write access to automations
    if (!hasAnyPermission(user, ['automations:write'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

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

    const body = await request.json()
    const workflow = await updateWorkflow(orgContext.orgId, params.id, body)
    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/automations/[id] - Delete workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user, orgId } = auth;

    // Check permissions: need write access to automations
    if (!hasAnyPermission(user, ['automations:write'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

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

    // RBAC: Workflow delete requires OWNER or ADMIN role
    const permissionCheck = validateOrgPermission(orgContext, 'workflows:delete', 'delete workflow')
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode }
      )
    }

    await deleteWorkflow(orgContext.orgId, params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/automations/[id]/toggle - Toggle workflow active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user, orgId } = auth;

    // Check permissions: need write access to automations
    if (!hasAnyPermission(user, ['automations:write'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

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

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }

    const workflow = await toggleWorkflow(orgContext.orgId, params.id, isActive)
    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error toggling workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









