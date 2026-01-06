import { NextRequest, NextResponse } from 'next/server'
import { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow, toggleWorkflow } from '@/lib/automation-services'
import { requireAdminUser, hasAnyPermission } from '@/middleware/admin-auth'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'

// GET /api/admin/automations - List all workflows
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;

    // Check permissions: need read access to automations/workflows
    if (!hasAnyPermission(user, ['automations:read', 'workflows:read'])) {
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

    const workflows = await getWorkflows(orgContext.orgId)
    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/automations - Create new workflow
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;

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

    // Basic validation
    if (!body.name || !body.trigger || !Array.isArray(body.actions)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger, actions' },
        { status: 400 }
      )
    }

    const workflowData = {
      name: body.name,
      description: body.description,
      isActive: body.isActive || false,
      trigger: body.trigger,
      triggerConfig: body.triggerConfig || {},
      actions: body.actions,
      createdBy: orgContext.userId // Use real user ID from org context
    }

    const workflow = await createWorkflow(orgContext.orgId, workflowData)
    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









