import { NextRequest, NextResponse } from 'next/server'
import { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow, toggleWorkflow } from '@/lib/automation-services'
import { requireAdminUser, hasAnyPermission } from '@/middleware/admin-auth'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'
import { validateApiRequest, createAutomationSchema } from '@/lib/validation/input-validation'

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

    // Validate and sanitize input
    const validation = await validateApiRequest(createAutomationSchema, request, {
      sanitizeStrings: true,
      sanitizeHtml: false
    })

    if (!validation.success) {
      return validation.response
    }

    const { name, description, trigger, actions, isActive = true } = validation.data

    const workflowData = {
      name,
      description,
      isActive,
      trigger,
      triggerConfig: {},
      actions,
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









