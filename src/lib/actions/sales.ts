import { prisma } from '../prisma'
import { revalidatePath } from 'next/cache'
import { onSaleClosed } from '../agents/cgo-pulse'

/**
 * Cierra una venta marcando un proyecto como completado y actualizando el ROI
 * @param projectId ID del proyecto a cerrar
 * @param saleAmount Monto de la venta (opcional, si no se proporciona usa precio_venta del proyecto)
 * @returns Resultado de la operación
 */
export async function closeSale(projectId: string, saleAmount?: number) {
  try {
    // 1. Obtener el proyecto con información del cliente
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        cliente: {
          select: {
            metaCampaignId: true
          }
        }
      }
    })

    if (!project) {
      return {
        success: false,
        error: 'Proyecto no encontrado'
      }
    }

    // 2. Verificar que el proyecto no esté ya completado
    if (project.estado === 'COMPLETADO') {
      return {
        success: false,
        error: 'El proyecto ya está marcado como completado'
      }
    }

    // 3. Determinar el monto de la venta
    const finalSaleAmount = saleAmount || project.precio_venta || 0

    if (finalSaleAmount <= 0) {
      return {
        success: false,
        error: 'No se puede determinar el monto de la venta. Especifique un monto o configure precio_venta en el proyecto.'
      }
    }

    // 4. Marcar el proyecto como completado
    await prisma.project.update({
      where: { id: projectId },
      data: {
        estado: 'COMPLETADO',
        updated_at: new Date()
      }
    })

    // 5. Si el cliente tiene una campaña asociada, actualizar el ROI
    if (project.cliente?.metaCampaignId) {
      const campaignId = project.cliente.metaCampaignId

      // Buscar la campaña en AiCampaignLog
      const campaignLog = await prisma.aiCampaignLog.findUnique({
        where: { campaignId }
      })

      if (campaignLog) {
        // Actualizar el revenue generado
        await prisma.aiCampaignLog.update({
          where: { campaignId },
          data: {
            revenueGenerated: campaignLog.revenueGenerated + finalSaleAmount,
            updatedAt: new Date()
          }
        })

        console.log(`✅ Venta cerrada: Proyecto ${projectId}, Monto: $${finalSaleAmount}, Campaña: ${campaignId}`)

        // Revalidar las páginas que muestran métricas de campañas
        revalidatePath('/admin/ai-campaigns')
        revalidatePath('/admin/dashboard')

        return {
          success: true,
          message: `Venta cerrada exitosamente. Revenue actualizado en campaña ${campaignId}`,
          data: {
            projectId,
            saleAmount: finalSaleAmount,
            campaignId,
            newRevenue: campaignLog.revenueGenerated + finalSaleAmount
          }
        }
      } else {
        console.warn(`⚠️ Campaña ${campaignId} no encontrada en AiCampaignLog. Creando entrada...`)

        // Si no existe la campaña en el log, la creamos
        await prisma.aiCampaignLog.create({
          data: {
            campaignId,
            name: `Campaña ${campaignId}`,
            revenueGenerated: finalSaleAmount
          }
        })

        console.log(`✅ Venta cerrada y campaña ${campaignId} creada en AiCampaignLog`)
      }
    } else {
      console.log(`ℹ️ Venta cerrada: Proyecto ${projectId}, Monto: $${finalSaleAmount} (sin campaña asociada)`)
    }

    // Revalidar las páginas relevantes
    revalidatePath('/admin/ai-campaigns')
    revalidatePath('/admin/dashboard')

    // Notificar al CGO Pulse sobre la venta cerrada
    try {
      await onSaleClosed(projectId, finalSaleAmount, project.cliente?.metaCampaignId)
    } catch (pulseError) {
      console.error('Error en CGO Pulse notification:', pulseError)
      // No fallar la venta por error en notificaciones
    }

    return {
      success: true,
      message: 'Venta cerrada exitosamente',
      data: {
        projectId,
        saleAmount: finalSaleAmount,
        hasCampaign: !!project.cliente?.metaCampaignId
      }
    }

  } catch (error) {
    console.error('Error cerrando venta:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }
  }
}

/**
 * Asocia una campaña de Meta a un cliente (para atribución de ROI)
 * @param clientId ID del cliente
 * @param campaignId ID de la campaña de Meta
 * @returns Resultado de la operación
 */
export async function assignCampaignToClient(clientId: string, campaignId: string) {
  try {
    // Verificar que el cliente existe
    const client = await prisma.user.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return {
        success: false,
        error: 'Cliente no encontrado'
      }
    }

    // Actualizar el cliente con la campaña
    await prisma.user.update({
      where: { id: clientId },
      data: {
        metaCampaignId: campaignId,
        updatedAt: new Date()
      }
    })

    // Verificar si la campaña ya existe en AiCampaignLog, si no, crearla
    const existingCampaign = await prisma.aiCampaignLog.findUnique({
      where: { campaignId }
    })

    if (!existingCampaign) {
      await prisma.aiCampaignLog.create({
        data: {
          campaignId,
          name: `Campaña ${campaignId}`,
          leadsCount: 1 // Este cliente cuenta como 1 lead
        }
      })

      console.log(`✅ Campaña ${campaignId} creada en AiCampaignLog con 1 lead inicial`)
    } else {
      // Incrementar el contador de leads
      await prisma.aiCampaignLog.update({
        where: { campaignId },
        data: {
          leadsCount: existingCampaign.leadsCount + 1
        }
      })

      console.log(`✅ Lead añadido a campaña ${campaignId}. Total leads: ${existingCampaign.leadsCount + 1}`)
    }

    console.log(`✅ Campaña ${campaignId} asignada al cliente ${clientId}`)

    return {
      success: true,
      message: `Campaña ${campaignId} asignada exitosamente al cliente`,
      data: {
        clientId,
        campaignId
      }
    }

  } catch (error) {
    console.error('Error asignando campaña al cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }
  }
}

/**
 * Obtiene métricas de ROI para todas las campañas
 * @returns Métricas consolidadas de ROI
 */
export async function getCampaignROIMetrics(limit: number = 1000, offset: number = 0) {
  try {
    // Validate and sanitize parameters
    const sanitizedLimit = Math.min(Math.max(limit, 1), 5000) // Allow larger limit for analytics
    const sanitizedOffset = Math.max(offset, 0)

    const [campaigns, total] = await Promise.all([
      prisma.aiCampaignLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: sanitizedLimit,
        skip: sanitizedOffset
      }),
      prisma.aiCampaignLog.count()
    ])

    const totalInvestment = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0)
    const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.revenueGenerated, 0)
    const totalLeads = campaigns.reduce((sum, campaign) => sum + campaign.leadsCount, 0)

    const overallROI = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0

    return {
      success: true,
      data: {
        totalCampaigns: total, // Total en BD, no solo los retornados
        totalInvestment,
        totalRevenue,
        totalLeads,
        overallROI,
        campaigns: campaigns.map(campaign => ({
          id: campaign.id,
          campaignId: campaign.campaignId,
          name: campaign.name,
          spend: campaign.spend,
          leadsCount: campaign.leadsCount,
          revenueGenerated: campaign.revenueGenerated,
          roi: campaign.spend > 0 ? ((campaign.revenueGenerated - campaign.spend) / campaign.spend) * 100 : 0,
          createdAt: campaign.createdAt
        }))
      },
      pageInfo: {
        limit: sanitizedLimit,
        offset: sanitizedOffset,
        returned: campaigns.length,
        hasMore: sanitizedOffset + campaigns.length < total
      },
      total
    }

  } catch (error) {
    console.error('Error obteniendo métricas de ROI:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }
  }
}
