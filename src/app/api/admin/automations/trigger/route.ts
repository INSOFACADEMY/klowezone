import { NextRequest, NextResponse } from 'next/server'
import { triggerAutomation } from '@/lib/automation-services'
import { requireAdminUser, hasAnyPermission } from '@/middleware/admin-auth'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'

// POST /api/admin/automations/trigger - Trigger automation manually or from external events
export async function POST(request: NextRequest) {
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
    const { triggerType, triggerData } = body

    if (!triggerType) {
      return NextResponse.json(
        { error: 'triggerType is required' },
        { status: 400 }
      )
    }

    const validTriggers = [
      'NEW_LEAD',
      'PROJECT_STATUS_CHANGE',
      'FEEDBACK_RECEIVED',
      'CRITICAL_ERROR',
      'USER_REGISTERED',
      'PAYMENT_RECEIVED',
      'DEADLINE_APPROACHING'
    ]

    if (!validTriggers.includes(triggerType)) {
      return NextResponse.json(
        { error: 'Invalid trigger type' },
        { status: 400 }
      )
    }

    const results = await triggerAutomation(orgContext.orgId, triggerType, triggerData || {})

    return NextResponse.json({
      triggered: results.length,
      runs: results
    })
  } catch (error) {
    console.error('Error triggering automation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









