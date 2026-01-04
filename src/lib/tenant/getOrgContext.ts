import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export interface OrgContext {
  userId: string
  orgId: string
  orgRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
}

export class TenantError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TenantError'
  }
}

/**
 * Obtiene userId desde las mismas fuentes que admin auth:
 * 1. JWT token (Authorization header o admin_token cookie)
 * 2. Supabase server auth como fallback
 */
async function getCurrentUserId(request?: NextRequest): Promise<string> {
  try {
    // Intentar JWT primero (igual que admin auth)
    const authHeader = request?.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') ||
                  request?.cookies.get('admin_token')?.value

    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        return payload.userId
      }
    }

    // Fallback a Supabase auth
    const { data: { user }, error } = await supabaseServer.auth.getUser()
    if (!error && user) {
      return user.id
    }

    throw new TenantError('NO_AUTH')

  } catch (error) {
    throw new TenantError('NO_AUTH')
  }
}

/**
 * Obtiene el contexto de organización del usuario
 * Prioridad: cookie kz_org -> User.activeOrgId -> primera membership
 */
export async function getOrgContext(request?: NextRequest): Promise<OrgContext> {
  try {
    // 1. Obtener userId desde las mismas fuentes que admin auth
    const userId = await getCurrentUserId(request)

    // 2. Obtener memberships del usuario
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, isActive: true }
        }
      },
      orderBy: { joinedAt: 'asc' } // Primera membership primero
    })

    if (memberships.length === 0) {
      throw new TenantError('NO_ORG')
    }

    // 3. Resolver orgId activa con prioridad:
    //    cookie kz_org (si user es miembro) -> User.activeOrgId -> primera membership

    let activeOrgId: string | null = null

    // a) Intentar cookie kz_org
    let cookieOrgId: string | null = null
    try {
      if (request) {
        cookieOrgId = request.cookies.get('kz_org')?.value || null
      } else {
        // Para server components/actions
        const cookieStore = cookies()
        cookieOrgId = cookieStore.get('kz_org')?.value || null
      }
    } catch (error) {
      // Ignorar errores de cookies
    }

    if (cookieOrgId) {
      // Verificar que el user sea miembro de esta org
      const cookieMembership = memberships.find(m => m.organizationId === cookieOrgId)
      if (cookieMembership) {
        activeOrgId = cookieOrgId
      }
    }

    // b) Si no hay cookie válida, intentar User.activeOrgId desde user_profiles
    if (!activeOrgId) {
      const userProfile = await prisma.$queryRaw<Array<{ active_org_id: string | null }>>`
        SELECT active_org_id FROM user_profiles WHERE id = ${userId}
      `

      if (userProfile.length > 0 && userProfile[0].active_org_id) {
        // Verificar que el user sea miembro de esta org
        const profileMembership = memberships.find(m => m.organizationId === userProfile[0].active_org_id)
        if (profileMembership) {
          activeOrgId = userProfile[0].active_org_id
        }
      }
    }

    // c) Si no hay ninguna preferencia, usar primera membership
    if (!activeOrgId) {
      activeOrgId = memberships[0].organizationId
    }

    // 4. Obtener el role para la org activa
    const activeMembership = memberships.find(m => m.organizationId === activeOrgId)
    if (!activeMembership) {
      throw new TenantError('INVALID_ORG')
    }

    return {
      userId,
      orgId: activeOrgId,
      orgRole: activeMembership.role
    }

  } catch (error) {
    if (error instanceof TenantError) {
      throw error
    }
    console.error('Error getting org context:', error)
    throw new TenantError('INTERNAL_ERROR')
  }
}
