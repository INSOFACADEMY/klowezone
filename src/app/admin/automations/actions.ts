'use server'

import { getWorkflows as getWorkflowsService, toggleWorkflow as toggleWorkflowService, deleteWorkflow as deleteWorkflowService, createWorkflow as createWorkflowService } from '@/lib/automation-services'
import { revalidatePath } from 'next/cache'

export async function getWorkflows() {
  try {
    const workflows = await getWorkflowsService()
    return { success: true, data: workflows }
  } catch (error) {
    console.error('Error in getWorkflows server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function toggleWorkflow(id: string, isActive: boolean) {
  try {
    await toggleWorkflowService(id, isActive)
    revalidatePath('/admin/automations')
    return { success: true }
  } catch (error) {
    console.error('Error in toggleWorkflow server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteWorkflow(id: string) {
  try {
    await deleteWorkflowService(id)
    revalidatePath('/admin/automations')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteWorkflow server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function createWorkflow(data: {
  name: string
  description: string
  trigger: string
  actions: any[]
}) {
  try {
    const workflow = await createWorkflowService({
      name: data.name,
      description: data.description,
      trigger: data.trigger as any,
      triggerConfig: {},
      actions: data.actions,
      isActive: false,
      createdBy: 'admin' // TODO: Get from auth context
    })
    revalidatePath('/admin/automations')
    return { success: true, data: workflow }
  } catch (error) {
    console.error('Error in createWorkflow server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
