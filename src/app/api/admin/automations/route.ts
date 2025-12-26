import { NextRequest, NextResponse } from 'next/server'
import { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow, toggleWorkflow } from '@/lib/automation-services'
import { auth } from '@/lib/auth'

// GET /api/admin/automations - List all workflows
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await auth()
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const workflows = await getWorkflows()
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
    // TODO: Add authentication check
    // const session = await auth()
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

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
      createdBy: 'admin' // TODO: Get from session
    }

    const workflow = await createWorkflow(workflowData)
    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




