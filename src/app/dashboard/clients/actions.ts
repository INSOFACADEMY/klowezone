'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Project Management Actions for Client Dashboard
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
        userId: 'system' // TODO: Get actual user ID from auth
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

// Document Management Actions
export async function uploadProjectDocument(projectId: string, formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // TODO: Upload file to Supabase Storage
    // For now, we'll create a placeholder record
    const document = await prisma.projectDocument.create({
      data: {
        project_id: projectId,
        nombre: file.name,
        tipo: 'OTRO', // TODO: Determine type from file
        url: `placeholder-${file.name}`, // TODO: Replace with actual Supabase Storage URL
        size: file.size,
        uploaded_by: 'system' // TODO: Get actual user ID from auth
      }
    })

    revalidatePath(`/dashboard/clients/${document.project_id}`)
    return { success: true, data: document }
  } catch (error) {
    console.error('Error in uploadProjectDocument server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Activity Management Actions
export async function getProjectActivities(clientId: string) {
  try {
    const activities = await prisma.projectActivity.findMany({
      where: {
        project: {
          cliente_id: clientId
        }
      },
      include: {
        project: {
          select: { nombre_proyecto: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })

    return { success: true, data: activities }
  } catch (error) {
    console.error('Error in getProjectActivities server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}


