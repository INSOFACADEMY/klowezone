import { prisma } from './prisma'
import { supabase } from './supabase'
import { onNewUserWithCampaign } from './agents/cgo-pulse'

/**
 * Sincroniza la creación de un usuario desde Supabase hacia Prisma
 * Incluye el metaCampaignId para atribución de ROI
 */
export async function syncUserToPrisma(supabaseUserId: string) {
  try {
    // Obtener datos del usuario desde Supabase
    const { data: supabaseUser, error } = await supabase.auth.admin.getUserById(supabaseUserId)

    if (error || !supabaseUser.user) {
      console.error('Error obteniendo usuario de Supabase:', error)
      return null
    }

    const user = supabaseUser.user
    const userMetadata = user.user_metadata || {}
    const appMetadata = user.app_metadata || {}

    // Extraer datos del usuario
    const email = user.email
    const fullName = userMetadata.full_name || userMetadata.name || ''
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Extraer campaign_id de los metadatos
    const metaCampaignId = userMetadata.meta_campaign_id || appMetadata.meta_campaign_id

    if (metaCampaignId) {
      console.log(`📊 UserSync: Usuario ${email} registrado con campaign_id: ${metaCampaignId}`)
    }

    // Verificar si el usuario ya existe en Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log(`ℹ️ UserSync: Usuario ${email} ya existe en Prisma`)
      return existingUser
    }

    // Crear usuario en Prisma
    const prismaUser = await prisma.user.create({
      data: {
        id: supabaseUserId, // Usar el mismo ID que Supabase
        email,
        password: '', // No almacenamos contraseña en Prisma (Supabase la maneja)
        firstName,
        lastName,
        isActive: true,
        isVerified: user.email_confirmed_at ? true : false,
        roleId: 'default-role-id', // TODO: Definir rol por defecto
        metaCampaignId: metaCampaignId || null
      }
    })

    console.log(`✅ UserSync: Usuario ${email} creado en Prisma con ID: ${prismaUser.id}`)

    // Si hay campaign_id, incrementar el contador de leads en AiCampaignLog
    if (metaCampaignId) {
      await updateCampaignLeads(metaCampaignId)

      // Notificar al CGO Pulse sobre el nuevo lead
      try {
        await onNewUserWithCampaign(metaCampaignId, prismaUser.id)
      } catch (pulseError) {
        console.error('Error en CGO Pulse notification para nuevo lead:', pulseError)
        // No fallar la sincronización por error en notificaciones
      }
    }

    return prismaUser

  } catch (error) {
    console.error('Error sincronizando usuario a Prisma:', error)
    return null
  }
}

/**
 * Actualiza el contador de leads para una campaña específica
 */
async function updateCampaignLeads(campaignId: string) {
  try {
    // Verificar si la campaña existe en AiCampaignLog
    const existingCampaign = await prisma.aiCampaignLog.findUnique({
      where: { campaignId }
    })

    if (existingCampaign) {
      // Incrementar contador de leads
      await prisma.aiCampaignLog.update({
        where: { campaignId },
        data: {
          leadsCount: existingCampaign.leadsCount + 1
        }
      })

      console.log(`📊 CampaignLog: Lead añadido a campaña ${campaignId}. Total leads: ${existingCampaign.leadsCount + 1}`)
    } else {
      // Crear entrada de campaña si no existe
      await prisma.aiCampaignLog.create({
        data: {
          campaignId,
          name: `Campaña ${campaignId}`,
          leadsCount: 1 // Este es el primer lead
        }
      })

      console.log(`📊 CampaignLog: Nueva campaña ${campaignId} creada con 1 lead inicial`)
    }

  } catch (error) {
    console.error('Error actualizando contador de leads:', error)
  }
}

/**
 * Función utilitaria para obtener el campaign_id de un usuario
 */
export async function getUserCampaignId(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metaCampaignId: true }
    })

    return user?.metaCampaignId || null
  } catch (error) {
    console.error('Error obteniendo campaign_id del usuario:', error)
    return null
  }
}

/**
 * Función utilitaria para asignar campaign_id a un usuario existente
 */
export async function assignCampaignToUser(userId: string, campaignId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metaCampaignId: true }
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    if (user.metaCampaignId) {
      console.log(`ℹ️ Usuario ${userId} ya tiene campaign_id asignado: ${user.metaCampaignId}`)
      return
    }

    // Actualizar usuario con campaign_id
    await prisma.user.update({
      where: { id: userId },
      data: { metaCampaignId: campaignId }
    })

    // Actualizar contador de leads
    await updateCampaignLeads(campaignId)

    console.log(`✅ Campaign_id ${campaignId} asignado al usuario ${userId}`)
  } catch (error) {
    console.error('Error asignando campaign_id al usuario:', error)
  }
}
