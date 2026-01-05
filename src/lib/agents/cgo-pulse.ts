import { prisma } from '../prisma'
import { sendWhatsAppMessage } from './agent-tools'
import { getCampaignROIMetrics } from '../actions/sales'

/**
 * CGO Pulse - Servicio de Notificaciones Proactivas
 *
 * Sistema inteligente que notifica eventos importantes del negocio
 * para mantener al equipo informado sobre el crecimiento
 */

export interface PulseNotification {
  id: string
  type: 'lead' | 'sale' | 'campaign' | 'alert' | 'milestone'
  title: string
  message: string
  data: Record<string, any>
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

/**
 * Notifica cuando un nuevo usuario se registra con atribución de campaña
 */
export async function notifyNewLead(campaignId: string, userId: string): Promise<PulseNotification> {
  try {
    // Obtener datos de la campaña
    const campaign = await prisma.aiCampaignLog.findUnique({
      where: { campaignId }
    })

    if (!campaign) {
      throw new Error(`Campaña ${campaignId} no encontrada`)
    }

    // Calcular CAC actual (Customer Acquisition Cost)
    const cac = campaign.spend > 0 ? campaign.spend / Math.max(campaign.leadsCount, 1) : 0

    // Crear mensaje del CGO
    const message = `🚀 ¡Nuevo Lead! Atribuido a la campaña "${campaign.name}". CAC actual: $${cac.toFixed(2)}.`

    const notification: PulseNotification = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'lead',
      title: 'Nuevo Lead Atribuido',
      message,
      data: {
        campaignId,
        campaignName: campaign.name,
        userId,
        cac: cac,
        totalLeads: campaign.leadsCount,
        totalSpend: campaign.spend
      },
      timestamp: new Date(),
      read: false,
      priority: 'medium'
    }

    // Guardar notificación en base de datos (podemos añadir una tabla después)
    console.log('📢 CGO Pulse - Nuevo Lead:', notification)

    // Notificación opcional por WhatsApp (deshabilitado por defecto)
    // await sendLeadNotificationToAdmin(notification)

    return notification

  } catch (error) {
    console.error('Error creando notificación de lead:', error)
    throw error
  }
}

/**
 * Notifica cuando se cierra una venta exitosamente
 */
export async function notifySaleClosed(projectId: string, saleAmount: number, campaignId?: string): Promise<PulseNotification> {
  try {
    let campaignData = null
    let roi = 0
    let conversionRate = 0

    if (campaignId) {
      // Obtener datos actualizados de la campaña
      const campaign = await prisma.aiCampaignLog.findUnique({
        where: { campaignId }
      })

      if (campaign) {
        campaignData = {
          name: campaign.name,
          totalLeads: campaign.leadsCount,
          totalRevenue: campaign.revenueGenerated,
          totalSpend: campaign.spend
        }

        // Calcular ROI
        roi = campaign.spend > 0 ? ((campaign.revenueGenerated - campaign.spend) / campaign.spend) * 100 : 0

        // Calcular tasa de conversión aproximada (revenue / leads como proxy)
        conversionRate = campaign.leadsCount > 0 ? (campaign.revenueGenerated / campaign.leadsCount) * 100 : 0
      }
    }

    // Crear mensaje de victoria
    let message = `💰 ¡Venta Cerrada! Proyecto ${projectId} por $${saleAmount.toFixed(2)}.`

    if (campaignData) {
      message = `💰 ¡Venta Cerrada! ROI de la campaña "${campaignData.name}" subió a ${roi.toFixed(1)}%. Ratio de conversión: ${conversionRate.toFixed(1)}%.`
    }

    const notification: PulseNotification = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'sale',
      title: 'Venta Cerrada con Éxito',
      message,
      data: {
        projectId,
        saleAmount,
        campaignId,
        campaignData,
        roi,
        conversionRate
      },
      timestamp: new Date(),
      read: false,
      priority: 'high'
    }

    // Guardar notificación en base de datos
    console.log('🎉 CGO Pulse - Venta Cerrada:', notification)

    // Notificación opcional por WhatsApp al admin
    // await sendSaleNotificationToAdmin(notification)

    return notification

  } catch (error) {
    console.error('Error creando notificación de venta:', error)
    throw error
  }
}

/**
 * Notifica hitos importantes del negocio
 */
export async function notifyMilestone(type: 'revenue' | 'leads' | 'roi', value: number, context?: string): Promise<PulseNotification> {
  const milestones = {
    revenue: {
      title: 'Hito de Revenue Alcanzado',
      message: `🎯 ¡Felicitaciones! Has alcanzado $${value.toLocaleString()} en revenue total.`,
      priority: 'high' as const
    },
    leads: {
      title: 'Hito de Leads Alcanzado',
      message: `👥 ¡Excelente! Has generado ${value} leads cualificados.`,
      priority: 'medium' as const
    },
    roi: {
      title: 'Hito de ROI Alcanzado',
      message: `📈 ¡Impresionante! Has alcanzado ${value}% de ROI promedio.`,
      priority: 'urgent' as const
    }
  }

  const milestone = milestones[type]

  const notification: PulseNotification = {
    id: `milestone_${type}_${Date.now()}`,
    type: 'milestone',
    title: milestone.title,
    message: context ? `${milestone.message} ${context}` : milestone.message,
    data: { type, value, context },
    timestamp: new Date(),
    read: false,
    priority: milestone.priority
  }

  console.log('🏆 CGO Pulse - Milestone:', notification)
  return notification
}

/**
 * Envía notificación de lead por WhatsApp al admin
 */
async function sendLeadNotificationToAdmin(notification: PulseNotification): Promise<void> {
  try {
    // Buscar admin con número de teléfono
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          name: 'admin'
        },
        telefono: {
          not: null
        }
      }
    })

    if (!adminUser?.telefono) {
      console.log('No se encontró admin con teléfono para notificación WhatsApp')
      return
    }

    await sendWhatsAppMessage(
      'system', // userId del sistema
      adminUser.telefono,
      'welcome', // Usar template de bienvenida como notificación
      'Admin',
      [`${notification.message} Proyecto: ${notification.data.projectId || 'N/A'}`]
    )

  } catch (error) {
    console.error('Error enviando notificación WhatsApp:', error)
  }
}

/**
 * Envía notificación de venta por WhatsApp al admin
 */
async function sendSaleNotificationToAdmin(notification: PulseNotification): Promise<void> {
  try {
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          name: 'admin'
        },
        telefono: {
          not: null
        }
      }
    })

    if (!adminUser?.telefono) {
      console.log('No se encontró admin con teléfono para notificación WhatsApp')
      return
    }

    await sendWhatsAppMessage(
      'system',
      adminUser.telefono,
      'paymentReminder', // Usar template de pago como notificación positiva
      'Admin',
      [`${notification.message} ¡Felicitaciones!`]
    )

  } catch (error) {
    console.error('Error enviando notificación WhatsApp:', error)
  }
}

/**
 * Obtiene todas las notificaciones activas (últimas 24 horas)
 */
export async function getActiveNotifications(): Promise<PulseNotification[]> {
  // Por ahora, devolver un array vacío ya que no tenemos tabla de notificaciones
  // En el futuro, implementar consulta a base de datos
  return []
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // Implementar cuando tengamos tabla de notificaciones
  console.log(`Notificación ${notificationId} marcada como leída`)
}

/**
 * Limpia notificaciones antiguas (más de 7 días)
 */
export async function cleanupOldNotifications(): Promise<void> {
  // Implementar cuando tengamos tabla de notificaciones
  console.log('Limpieza de notificaciones antiguas completada')
}

// ========================================
// INTEGRACIONES AUTOMÁTICAS
// ========================================

/**
 * Hook que se llama automáticamente desde user-sync.ts
 * cuando se registra un nuevo usuario con campaign attribution
 */
export async function onNewUserWithCampaign(campaignId: string, userId: string): Promise<void> {
  try {
    const notification = await notifyNewLead(campaignId, userId)
    // Aquí podríamos guardar en una tabla de notificaciones persistentes
    console.log('✅ Notificación de lead creada automáticamente')
  } catch (error) {
    console.error('Error en notificación automática de lead:', error)
  }
}

/**
 * Hook que se llama automáticamente desde sales.ts
 * cuando se cierra una venta exitosamente
 */
export async function onSaleClosed(projectId: string, saleAmount: number, campaignId?: string): Promise<void> {
  try {
    const notification = await notifySaleClosed(projectId, saleAmount, campaignId)
    // Aquí podríamos guardar en una tabla de notificaciones persistentes
    console.log('✅ Notificación de venta creada automáticamente')
  } catch (error) {
    console.error('Error en notificación automática de venta:', error)
  }
}





