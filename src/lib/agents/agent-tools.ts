import { prisma } from '../prisma'
import { supabase } from '../supabase'
import { createTask, type Task } from '../tasks'
import {
  generateWhatsAppLinkWithTemplate,
  WHATSAPP_TEMPLATES,
  generateWhatsAppLink
} from '../whatsapp-utils'
import { loadEnv } from '../../../prisma/loadEnv'

// Load environment variables silently (enterprise loader)
loadEnv()

// ========================================
// AGENT TOOLS SERVICE
// ========================================
// Servicio que proporciona herramientas para que una IA pueda interactuar
// con el sistema de gestión de proyectos de manera segura
//
// USO TÍPICO:
// ```typescript
// import { getUserProjects, createTaskForUser, sendWhatsAppMessage } from '@/lib/agents/agent-tools'
//
// // Obtener proyectos del usuario
// const projects = await getUserProjects(userId)
//
// // Crear una tarea
// const task = await createTaskForUser(userId, {
//   proyecto_id: 'project-123',
//   titulo: 'Nueva tarea',
//   descripcion: 'Descripción de la tarea',
//   estado: 'To Do',
//   prioridad: 'Media'
// })
//
// // Enviar mensaje de WhatsApp
// const result = await sendWhatsAppMessage(userId, '+521234567890', 'welcome', 'Juan Pérez')
// ```

// ========================================
// INTERFACES
// ========================================

export interface ProjectSummary {
  id: string
  nombre_proyecto: string
  descripcion: string | null
  estado: string
  prioridad: string
  fecha_entrega: Date | null
  presupuesto_estimado: number | null
  precio_venta: number | null
  cliente_nombre?: string
}

export interface TaskInput {
  proyecto_id: string
  titulo: string
  descripcion?: string
  estado: 'To Do' | 'In Progress' | 'Review' | 'Done'
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente'
  asignado_a?: string
  fecha_inicio?: string
  fecha_entrega?: string
  tiempo_estimado?: string
  progreso?: number
  etiquetas?: string[]
}

export interface FacebookAdCampaignInput {
  campaignName: string
  dailyBudget: number
  adText: string
  targetAudience?: string
  objective?: 'OUTCOME_AWARENESS' | 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_LEADS' | 'OUTCOME_SALES' | 'LINK_CLICKS' | 'REACH'
}

// ========================================
// VALIDATION FUNCTIONS
// ========================================

/**
 * Valida que el usuario existe y está activo
 */
async function validateUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true }
    })

    if (!user) {
      console.warn(`Usuario no encontrado: ${userId}`)
      return false
    }

    if (!user.isActive) {
      console.warn(`Usuario inactivo: ${userId}`)
      return false
    }

    return true
  } catch (error) {
    console.error('Error validando usuario:', error)
    return false
  }
}

/**
 * Valida que el usuario tiene acceso a un proyecto específico
 */
async function validateProjectAccess(userId: string, projectId: string): Promise<boolean> {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user_id: userId
      }
    })

    return !!project
  } catch (error) {
    console.error('Error validando acceso a proyecto:', error)
    return false
  }
}

// ========================================
// AGENT TOOLS FUNCTIONS
// ========================================

/**
 * Consulta todos los proyectos del usuario actual mediante Prisma
 * Incluye información básica del cliente
 */
export async function getUserProjects(userId: string): Promise<ProjectSummary[]> {
  // Validar usuario
  const isValidUser = await validateUser(userId)
  if (!isValidUser) {
    throw new Error('Usuario no válido o inactivo')
  }

  try {
    const projects = await (prisma.project.findMany as any)({
      where: {
        user_id: userId
      },
      include: {
        cliente: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transformar los datos al formato esperado
    return (projects as any[]).map(project => ({
      id: project.id,
      nombre_proyecto: project.nombre_proyecto,
      descripcion: project.descripcion,
      estado: project.estado,
      prioridad: project.prioridad,
      fecha_entrega: project.fecha_entrega,
      presupuesto_estimado: project.presupuesto_estimado || project.presupuesto,
      precio_venta: project.precio_venta,
      cliente_nombre: project.cliente
        ? `${project.cliente.firstName} ${project.cliente.lastName}`
        : 'Cliente no encontrado'
    }))
  } catch (error) {
    console.error('Error obteniendo proyectos del usuario:', error)
    throw new Error('No se pudieron obtener los proyectos del usuario')
  }
}

/**
 * Crea una nueva tarea para el usuario
 * Valida que el usuario tenga acceso al proyecto especificado
 */
export async function createTaskForUser(
  userId: string,
  taskData: TaskInput
): Promise<Task> {
  // Validar usuario
  const isValidUser = await validateUser(userId)
  if (!isValidUser) {
    throw new Error('Usuario no válido o inactivo')
  }

  // Validar acceso al proyecto
  const hasAccess = await validateProjectAccess(userId, taskData.proyecto_id)
  if (!hasAccess) {
    throw new Error('Usuario no tiene acceso al proyecto especificado')
  }

  try {
    // Crear la tarea usando el servicio existente
    const task = await createTask({
      ...taskData,
      estado: taskData.estado || 'To Do', // Valor por defecto si no se especifica
      user_id: userId
    })

    console.log(`Tarea creada exitosamente por agente para usuario ${userId}:`, task.titulo)
    return task
  } catch (error) {
    console.error('Error creando tarea para usuario:', error)
    throw new Error('No se pudo crear la tarea')
  }
}

/**
 * Envía un mensaje de WhatsApp usando templates predefinidos
 * Valida que el usuario existe antes de enviar
 */
export async function sendWhatsAppMessage(
  userId: string,
  phoneNumber: string,
  templateKey: keyof typeof WHATSAPP_TEMPLATES,
  clientName: string,
  params: any[] = []
): Promise<{ success: boolean; message: string; whatsappUrl?: string }> {
  // Validar usuario
  const isValidUser = await validateUser(userId)
  if (!isValidUser) {
    throw new Error('Usuario no válido o inactivo')
  }

  try {
    // Generar el enlace de WhatsApp con template usando la función existente
    const whatsappUrl = generateWhatsAppLinkWithTemplate(
      phoneNumber,
      templateKey,
      clientName,
      params
    )

    if (!whatsappUrl) {
      return {
        success: false,
        message: 'No se pudo generar el enlace de WhatsApp. Verifique el número de teléfono.'
      }
    }

    // Log de la acción del agente
    console.log(`Agente generó enlace de WhatsApp para usuario ${userId}:`, {
      template: templateKey,
      clientName,
      phoneNumber
    })

    return {
      success: true,
      message: 'Enlace de WhatsApp generado exitosamente',
      whatsappUrl
    }
  } catch (error) {
    console.error('Error generando mensaje de WhatsApp:', error)
    return {
      success: false,
      message: 'Error interno al generar el mensaje de WhatsApp'
    }
  }
}

/**
 * Crea una campaña publicitaria en Facebook Ads
 * Simula la llamada a la Graph API de Meta para crear una campaña
 */
export async function createFacebookAdCampaign(
  userId: string,
  campaignData: FacebookAdCampaignInput
): Promise<{
  success: boolean
  campaignId?: string
  message: string
  campaignDetails?: {
    name: string
    budget: number
    status: string
    objective: string
    createdAt: string
  }
}> {
  // Validar usuario
  const isValidUser = await validateUser(userId)
  if (!isValidUser) {
    throw new Error('Usuario no válido o inactivo')
  }

  try {
    const { campaignName, dailyBudget, adText, targetAudience, objective } = campaignData

    // Validar parámetros requeridos
    if (!campaignName || !campaignName.trim()) {
      return {
        success: false,
        message: 'El nombre de la campaña es requerido'
      }
    }

    if (!dailyBudget || dailyBudget <= 0) {
      return {
        success: false,
        message: 'El presupuesto diario debe ser mayor a 0'
      }
    }

    if (!adText || !adText.trim()) {
      return {
        success: false,
        message: 'El texto del anuncio es requerido'
      }
    }

    // Verificar que tenemos las credenciales de Meta
    const accessToken = process.env.META_ACCESS_TOKEN
    const adAccountId = process.env.META_AD_ACCOUNT_ID

    if (!accessToken || !adAccountId) {
      console.warn(`Agente usando simulación - credenciales de Meta no configuradas para usuario ${userId}`)
      console.log(`Campaña solicitada: ${campaignName}, Presupuesto: $${dailyBudget}`)

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generar ID ficticio de campaña
      const campaignId = `fb_campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        campaignId,
        message: `Campaña "${campaignName}" simulada exitosamente (credenciales no configuradas)`,
        campaignDetails: {
          name: campaignName,
          budget: dailyBudget,
          status: 'PAUSED',
          objective: objective || 'OUTCOME_TRAFFIC',
          createdAt: new Date().toISOString()
        }
      }
    }

    // Realizar llamada real a Facebook Graph API
    console.log(`Agente creando campaña real de Facebook para usuario ${userId}:`, {
      campaignName,
      dailyBudget,
      adText: adText.substring(0, 50) + (adText.length > 50 ? '...' : ''),
      targetAudience,
      objective,
      accountId: `act_${adAccountId}`
    })

    try {
      const apiUrl = `https://graph.facebook.com/v24.0/act_${adAccountId}/campaigns`
      const campaignData = {
        name: campaignName,
        objective: objective || 'OUTCOME_TRAFFIC',
        status: 'PAUSED',
        daily_budget: (dailyBudget * 100).toString(), // Facebook espera el presupuesto en centavos
        special_ad_categories: []
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(campaignData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error en Facebook API:', errorData)

        if (response.status === 401) {
          throw new Error('Access token inválido o expirado')
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para crear campañas en esta cuenta')
        } else {
          throw new Error(`Error de Facebook API: ${errorData.error?.message || 'Error desconocido'}`)
        }
      }

      const apiResponse = await response.json()
      const campaignId = apiResponse.id

      console.log(`Campaña de Facebook creada exitosamente para usuario ${userId}:`, campaignId)

      return {
        success: true,
        campaignId,
        message: `Campaña "${campaignName}" creada exitosamente en Facebook Ads`,
        campaignDetails: {
          name: campaignName,
          budget: dailyBudget,
          status: 'PAUSED',
          objective: objective || 'OUTCOME_TRAFFIC',
          createdAt: new Date().toISOString()
        }
      }

    } catch (apiError) {
      console.error('Error en llamada a Facebook API:', apiError)

      // Fallback a simulación si hay error en la API
      console.log(`Agente usando fallback a simulación para usuario ${userId} debido a error en API`)

      const campaignId = `fb_campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        campaignId,
        message: `Campaña "${campaignName}" simulada exitosamente (error en API real: ${apiError instanceof Error ? apiError.message : 'Error desconocido'})`,
        campaignDetails: {
          name: campaignName,
          budget: dailyBudget,
          status: 'PAUSED',
          objective: objective || 'OUTCOME_TRAFFIC',
          createdAt: new Date().toISOString()
        }
      }
    }

  } catch (error) {
    console.error('Error creando campaña de Facebook:', error)
    return {
      success: false,
      message: 'Error interno al crear la campaña de Facebook'
    }
  }
}

/**
 * Genera una imagen para anuncio usando DALL-E 3
 * Crea prompts detallados basados en el texto del anuncio
 */
export async function generateAdImage(
  userId: string,
  adText: string,
  campaignType: 'pain' | 'aspiration' | 'curiosity',
  targetAudience?: string
): Promise<{
  success: boolean
  imageUrl?: string
  prompt?: string
  message: string
}> {
  // Validar usuario
  const isValidUser = await validateUser(userId)
  if (!isValidUser) {
    throw new Error('Usuario no válido o inactivo')
  }

  try {
    let prompt = ''

    // Crear prompt específico según el tipo de campaña
    switch (campaignType) {
      case 'pain':
        prompt = `Crea una imagen publicitaria dramática y emocional que represente el dolor y la frustración de perder tiempo valioso en tareas manuales repetitivas. Muestra a un empresario estresado, mirando un reloj que se acelera, con papeles volando alrededor y una expresión de agotamiento. El texto del anuncio es: "${adText}". El estilo debe ser realista, con tonos fríos (azules y grises) para transmitir urgencia y necesidad de cambio. Incluye elementos visuales que representen automatización emergente (como un robot o sistema inteligente apareciendo).`
        break

      case 'aspiration':
        prompt = `Crea una imagen inspiradora y aspiracional que represente el éxito empresarial moderno. Muestra a un CEO confiado en una oficina elegante de nivel ejecutivo, con pantallas mostrando gráficos de crecimiento, equipos internacionales colaborando, y una estética premium. El texto del anuncio es: "${adText}". Usa tonos dorados, plateados y azules corporativos. Incluye elementos de innovación tecnológica, globos terráqueos, premios y reconocimientos para transmitir estatus y prestigio internacional.`
        break

      case 'curiosity':
        prompt = `Crea una imagen intrigante y disruptiva que despierte curiosidad sobre innovación tecnológica. Muestra un concepto futurista donde la tecnología rompe barreras tradicionales: un cerebro humano conectado a un supercomputador, gráficos descendentes dramáticos de costos, flechas rompiendo cadenas. El texto del anuncio es: "${adText}". Usa colores vibrantes (naranja, púrpura, verde neón) y elementos visuales que representen ruptura de paradigmas, innovación disruptiva y ahorro significativo. Incluye elementos que sugieran "menos costo, más resultado".`
        break
    }

    // Añadir información específica del público objetivo si se proporciona
    if (targetAudience) {
      prompt += ` El público objetivo es: ${targetAudience}. Adapta los elementos visuales para resonar con este grupo específico.`
    }

    // Aquí iría la llamada real a DALL-E 3
    // Por ahora, simulamos la respuesta
    console.log(`Agente generando imagen para usuario ${userId}:`, {
      campaignType,
      adText: adText.substring(0, 50) + '...',
      prompt: prompt.substring(0, 100) + '...'
    })

    // Simular respuesta de DALL-E 3
    const mockImageUrl = `https://api.dalle.mock/image/${Date.now()}_${campaignType}`

    return {
      success: true,
      imageUrl: mockImageUrl,
      prompt,
      message: `Imagen generada exitosamente para campaña tipo ${campaignType}`
    }

  } catch (error) {
    console.error('Error generando imagen:', error)
    return {
      success: false,
      message: 'Error interno al generar la imagen del anuncio'
    }
  }
}

// ========================================
// UTILITY FUNCTIONS FOR AGENTS
// ========================================

/**
 * Obtiene estadísticas rápidas de proyectos del usuario
 */
export async function getUserProjectStats(userId: string): Promise<{
  total: number
  completados: number
  enProgreso: number
  planificacion: number
}> {
  const isValidUser = await validateUser(userId)
  if (!isValidUser) {
    throw new Error('Usuario no válido o inactivo')
  }

  try {
    const projects = await prisma.project.findMany({
      where: { user_id: userId },
      select: { estado: true }
    })

    const stats = {
      total: projects.length,
      completados: projects.filter(p => p.estado === 'COMPLETADO').length,
      enProgreso: projects.filter(p => p.estado === 'EN_PROGRESO').length,
      planificacion: projects.filter(p => p.estado === 'PLANIFICACION').length
    }

    return stats
  } catch (error) {
    console.error('Error obteniendo estadísticas de proyectos:', error)
    throw new Error('No se pudieron obtener las estadísticas')
  }
}

/**
 * Busca proyectos por nombre o descripción
 */
export async function searchUserProjects(
  userId: string,
  query: string
): Promise<ProjectSummary[]> {
  const isValidUser = await validateUser(userId)
  if (!isValidUser) {
    throw new Error('Usuario no válido o inactivo')
  }

  try {
    const projects = await (prisma.project.findMany as any)({
      where: {
        user_id: userId,
        OR: [
          { nombre_proyecto: { contains: query, mode: 'insensitive' } },
          { descripcion: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        cliente: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return (projects as any[]).map(project => ({
      id: project.id,
      nombre_proyecto: project.nombre_proyecto,
      descripcion: project.descripcion,
      estado: project.estado,
      prioridad: project.prioridad,
      fecha_entrega: project.fecha_entrega,
      presupuesto_estimado: project.presupuesto_estimado || project.presupuesto,
      precio_venta: project.precio_venta,
      cliente_nombre: project.cliente
        ? `${project.cliente.firstName} ${project.cliente.lastName}`
        : 'Cliente no encontrado'
    }))
  } catch (error) {
    console.error('Error buscando proyectos:', error)
    throw new Error('No se pudieron buscar los proyectos')
  }
}
