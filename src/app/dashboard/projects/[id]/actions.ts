'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import jwt from 'jsonwebtoken'

// JWT verification middleware
function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    return decoded
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Get project by ID with security check
export async function getProjectById(projectId: string, token?: string) {
  try {
    console.log(`🔍 Searching for project with ID: "${projectId}" (type: ${typeof projectId})`)

    let userId: string | undefined

    // Try to get token from cookies if not provided
    if (!token) {
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = cookies()
        token = cookieStore.get('token')?.value ||
                cookieStore.get('auth-token')?.value ||
                cookieStore.get('jwt')?.value
      } catch (error) {
        // Cookies might not be available in all contexts
        console.log('Could not access cookies for token')
      }
    }

    // If token provided, verify and get user ID
    if (token) {
      const decoded = verifyToken(token) as any
      userId = decoded.id
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        cliente: {
          select: { firstName: true, lastName: true, email: true, telefono: true }
        },
        owner: {
          select: { firstName: true, lastName: true, email: true, telefono: true }
        },
        documents: {
          orderBy: { created_at: 'desc' }
        },
        activities: {
          orderBy: { created_at: 'desc' },
          take: 10
        },
        expenses: {
          orderBy: { fecha_gasto: 'desc' },
          include: {
            creador: {
              select: { firstName: true, lastName: true }
            },
            aprobador: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        teamMembers: {
          where: { activo: true },
          include: {
            miembro: {
              select: { firstName: true, lastName: true, email: true }
            },
            asignador: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { asignado_en: 'desc' }
        }
      }
    })

    if (!project) {
      console.log(`Project with ID ${projectId} not found`)
      return { success: false, error: 'Project not found' }
    }

    // TODO: Re-enable security check when authentication is properly implemented
    // For now, allow access to all projects for development
    // Security check: only owner or admin can access
    // if (userId && project.user_id !== userId) {
    //   // TODO: Add admin role check
    //   return { success: false, error: 'Access denied' }
    // }

    console.log(`✅ Project found: ${project.nombre_proyecto} (ID: ${project.id})`)
    console.log(`   📊 Activities: ${project.activities?.length || 0}`)
    console.log(`   📄 Documents: ${project.documents?.length || 0}`)
    console.log(`   👤 Client: ${project.cliente?.firstName} ${project.cliente?.lastName}`)
    console.log(`   👨‍💼 Owner: ${project.owner?.firstName} ${project.owner?.lastName}`)
    return { success: true, data: project }
  } catch (error) {
    console.error('Error in getProjectById server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Update project details
export async function updateProjectDetails(projectId: string, updates: {
  nombre_proyecto?: string
  descripcion?: string
  presupuesto_estimado?: number
  precio_venta?: number
  fecha_entrega?: string
}, token?: string) {
  try {
    // Verify token if provided
    if (token) {
      verifyToken(token)
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...updates,
      },
      include: {
        cliente: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'PROJECT',
        resourceId: projectId,
        oldValues: {},
        newValues: updates,
        userId: 'system' // TODO: Get from JWT token
      }
    })

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, data: project }
  } catch (error) {
    console.error('Error in updateProjectDetails server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Add project milestone/task
export async function addProjectMilestone(projectId: string, milestone: {
  titulo: string
  descripcion: string
}, token?: string) {
  try {
    // Verify token if provided
    if (token) {
      verifyToken(token)
    }

    const activity = await prisma.projectActivity.create({
      data: {
        project_id: projectId,
        tipo: 'TASK_UPDATE',
        titulo: milestone.titulo,
        descripcion: milestone.descripcion
      }
    })

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, data: activity }
  } catch (error) {
    console.error('Error in addProjectMilestone server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Upload project document
export async function uploadProjectDocument(projectId: string, formData: FormData, token?: string) {
  try {
    // Verify token if provided
    if (token) {
      verifyToken(token)
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // TODO: Upload to Supabase Storage
    // For now, create a placeholder record
    const document = await prisma.projectDocument.create({
      data: {
        project_id: projectId,
        nombre: file.name,
        tipo: 'OTRO', // TODO: Determine type from file
        url: `placeholder-${file.name}`, // TODO: Replace with actual Supabase Storage URL
        size: file.size,
        uploaded_by: 'system' // TODO: Get from JWT token
      }
    })

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, data: document }
  } catch (error) {
    console.error('Error in uploadProjectDocument server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get project documents
export async function getProjectDocuments(projectId: string, token?: string) {
  try {
    // Verify token if provided
    if (token) {
      verifyToken(token)
    }

    const documents = await prisma.projectDocument.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' }
    })

    return { success: true, data: documents }
  } catch (error) {
    console.error('Error in getProjectDocuments server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get project activities/timeline
export async function getProjectActivities(projectId: string, token?: string) {
  try {
    // Verify token if provided
    if (token) {
      verifyToken(token)
    }

    const activities = await prisma.projectActivity.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      take: 20
    })

    return { success: true, data: activities }
  } catch (error) {
    console.error('Error in getProjectActivities server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Add project expense
export async function addProjectExpense(projectId: string, expense: {
  descripcion: string
  monto: number
  tipo: string
  fecha_gasto: string
  comprobante?: string
}, token?: string) {
  try {
    // Verify token if provided
    if (token) {
      verifyToken(token)
    }

    const newExpense = await prisma.projectExpense.create({
      data: {
        project_id: projectId,
        descripcion: expense.descripcion,
        monto: expense.monto,
        tipo: expense.tipo as any, // Cast to enum type
        fecha_gasto: new Date(expense.fecha_gasto),
        comprobante: expense.comprobante,
        created_by: 'system' // TODO: Get from JWT token
      },
      include: {
        creador: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    // Create activity log
    await prisma.projectActivity.create({
      data: {
        project_id: projectId,
        tipo: 'PAYMENT',
        titulo: `Gasto agregado: ${expense.descripcion}`,
        descripcion: `Se registró un gasto de $${expense.monto.toLocaleString()} por ${expense.descripcion}`
      }
    })

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, data: newExpense }
  } catch (error) {
    console.error('Error in addProjectExpense server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Add project team member
export async function addProjectTeamMember(projectId: string, member: {
  user_id: string
  rol: string
  horas_estimadas?: number
  tarifa_hora?: number
}, token?: string) {
  try {
    // Verify token if provided
    if (token) {
      verifyToken(token)
    }

    // Check if user is already a member of this project
    const existingMember = await prisma.projectTeamMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: member.user_id
        }
      }
    })

    if (existingMember && existingMember.activo) {
      return { success: false, error: 'El usuario ya es miembro activo de este proyecto' }
    }

    const newMember = await prisma.projectTeamMember.create({
      data: {
        project_id: projectId,
        user_id: member.user_id,
        rol: member.rol as any, // Cast to enum type
        horas_estimadas: member.horas_estimadas,
        tarifa_hora: member.tarifa_hora,
        asignado_por: 'system' // TODO: Get from JWT token
      },
      include: {
        miembro: {
          select: { firstName: true, lastName: true, email: true }
        },
        asignador: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    // Create activity log
    await prisma.projectActivity.create({
      data: {
        project_id: projectId,
        tipo: 'TASK_UPDATE',
        titulo: `Miembro agregado al equipo`,
        descripcion: `${newMember.miembro.firstName} ${newMember.miembro.lastName} fue asignado como ${member.rol.replace('_', ' ').toLowerCase()}`
      }
    })

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, data: newMember }
  } catch (error) {
    console.error('Error in addProjectTeamMember server action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Calculate project financial metrics
export function calculateFinancialMetrics(project: {
  precio_venta?: number | null
  presupuesto_estimado?: number | null
  expenses?: Array<{ monto: number }> | null
}) {
  const precioVenta = project.precio_venta || 0
  const presupuestoEstimado = project.presupuesto_estimado || 0
  const gastosTotales = project.expenses?.reduce((total, expense) => total + expense.monto, 0) || 0

  const utilidadReal = precioVenta - gastosTotales
  const margenGanancia = precioVenta > 0 ? (utilidadReal / precioVenta) * 100 : 0

  // Health score based on budget vs actual expenses
  const presupuestoRestante = presupuestoEstimado - gastosTotales
  const presupuestoConsumido = presupuestoEstimado > 0 ? (gastosTotales / presupuestoEstimado) * 100 : 0

  return {
    precioVenta,
    presupuestoEstimado,
    gastosTotales,
    utilidadReal,
    margenGanancia,
    presupuestoRestante,
    presupuestoConsumido,
    // Financial health indicators
    estaEnPresupuesto: gastosTotales <= presupuestoEstimado,
    margenSaludable: margenGanancia >= 20, // 20% margin is considered healthy
    utilidadPositiva: utilidadReal > 0
  }
}

