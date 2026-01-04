'use server'

import { syncUserToPrisma } from '@/lib/user-sync'

/**
 * Server Action para sincronizar usuario después del registro
 */
export async function syncUserAfterSignup(supabaseUserId: string) {
  try {
    console.log(`🔄 Sincronizando usuario ${supabaseUserId} con Prisma después del registro`)

    const prismaUser = await syncUserToPrisma(supabaseUserId)

    if (prismaUser) {
      console.log(`✅ Usuario ${supabaseUserId} sincronizado exitosamente`)
      return { success: true, userId: prismaUser.id }
    } else {
      console.error(`❌ Error sincronizando usuario ${supabaseUserId}`)
      return { success: false, error: 'Error en sincronización' }
    }
  } catch (error) {
    console.error('Error en syncUserAfterSignup:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}




