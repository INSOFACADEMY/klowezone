import { NextRequest, NextResponse } from 'next/server'
import { updateWorkflow, deleteWorkflow, toggleWorkflow } from '@/lib/automation-services'

// PUT /api/admin/automations/[id] - Update workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const workflow = await updateWorkflow(params.id, body)
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
    await deleteWorkflow(params.id)
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
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }

    const workflow = await toggleWorkflow(params.id, isActive)
    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error toggling workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




