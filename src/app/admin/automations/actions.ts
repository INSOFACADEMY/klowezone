'use server'

import { getWorkflows as getWorkflowsService, toggleWorkflow as toggleWorkflowService, deleteWorkflow as deleteWorkflowService, createWorkflow as createWorkflowService } from '@/lib/automation-services'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Automation Workflows Actions
export async function getWorkflows() {
  try {
    const { orgId } = await getOrgContext()
    const workflows = await getWorkflowsService(orgId)
    return { success: true, data: workflows }
  } catch (error) {
    console.error('Error in getWorkflows server action:', error)
    if (error instanceof TenantError) {
      return { success: false, error: error.message, statusCode: 403 }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function toggleWorkflow(id: string, isActive: boolean) {
  try {
    const { orgId } = await getOrgContext()
    await toggleWorkflowService(orgId, id, isActive)
    revalidatePath('/admin/automations')
    return { success: true }
  } catch (error) {
    console.error('Error in toggleWorkflow server action:', error)
    if (error instanceof TenantError) {
      return { success: false, error: error.message, statusCode: 403 }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteWorkflow(id: string) {
  try {
    const { orgId } = await getOrgContext()
    await deleteWorkflowService(orgId, id)
    revalidatePath('/admin/automations')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteWorkflow server action:', error)
    if (error instanceof TenantError) {
      return { success: false, error: error.message, statusCode: 403 }
    }
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
    const { orgId, userId } = await getOrgContext()
    const workflow = await createWorkflowService(orgId, {
      name: data.name,
      description: data.description,
      trigger: data.trigger as any,
      triggerConfig: {},
      actions: data.actions,
      isActive: false,
      createdBy: userId
    })
    revalidatePath('/admin/automations')
    return { success: true, data: workflow }
  } catch (error) {
    console.error('Error in createWorkflow server action:', error)
    if (error instanceof TenantError) {
      return { success: false, error: error.message, statusCode: 403 }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Project Management Actions
export async function updateProject(projectId: string, updates: {
  nombre_proyecto?: string
  descripcion?: string
  fecha_entrega?: string
  estado?: 'PLANIFICACION' | 'EN_PROGRESO' | 'COMPLETADO' | 'PAUSADO' | 'CANCELADO'
}) {
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...updates,
        updated_at: new Date()
      },
      include: {
        cliente: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    revalidatePath(`/dashboard/clients/${project.cliente_id}`)
    return { success: true, data: project }
  } catch (error) {
    console.error('Error in updateProject server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteProject(projectId: string) {
  try {
    // First get the project to know the client_id for revalidation
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { cliente_id: true }
    })

    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Delete the project
    await prisma.project.delete({
      where: { id: projectId }
    })

    // Log the deletion in audit_logs
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resource: 'PROJECT',
        resourceId: projectId,
        oldValues: { deleted: true },
        userId: 'system' // TODO: Get actual user ID
      }
    })

    revalidatePath(`/dashboard/clients/${project.cliente_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error in deleteProject server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updateProjectStatus(projectId: string, newStatus: 'PLANIFICACION' | 'EN_PROGRESO' | 'COMPLETADO' | 'PAUSADO' | 'CANCELADO') {
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        estado: newStatus,
        updated_at: new Date()
      },
      include: {
        cliente: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    revalidatePath(`/dashboard/clients/${project.cliente_id}`)
    return { success: true, data: project }
  } catch (error) {
    console.error('Error in updateProjectStatus server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
