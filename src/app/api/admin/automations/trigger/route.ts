import { NextRequest, NextResponse } from 'next/server'
import { triggerAutomation } from '@/lib/automation-services'

// POST /api/admin/automations/trigger - Trigger automation manually or from external events
export async function POST(request: NextRequest) {
  try {
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

    const results = await triggerAutomation(triggerType, triggerData || {})

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


