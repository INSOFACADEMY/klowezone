import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { TenantError, getCurrentUserId } from './getOrgContext'

/**
 * Cambia la organización activa del usuario
 * Valida membership, actualiza activeOrgId y setea cookie kz_org
 */
export async function setActiveOrg(orgId: string, request?: NextRequest): Promise<{ success: true } | { success: false, error: string }> {
  try {
    // 1. Obtener userId desde las mismas fuentes que admin auth
    const userId = await getCurrentUserId(request)

    // 2. Validar que el user sea miembro de la organización
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId
        }
      }
    })

    if (!membership) {
      return { success: false, error: 'NOT_MEMBER' }
    }

    // 3. Actualizar activeOrgId en user_profiles
    await prisma.$executeRaw`
      UPDATE user_profiles
      SET active_org_id = ${orgId}
      WHERE id = ${userId}
    `

    // 4. Setear cookie kz_org
    const cookieStore = cookies()
    cookieStore.set('kz_org', orgId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/'
    })

    return { success: true }

  } catch (error) {
    console.error('Error setting active org:', error)
    return { success: false, error: 'INTERNAL_ERROR' }
  }
}

/**
 * Función helper para usar en API routes (devuelve NextResponse con cookie)
 */
export async function setActiveOrgApi(orgId: string, request: NextRequest): Promise<NextResponse> {
  try {
    const result = await setActiveOrg(orgId, request)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Organization changed successfully'
    })

  } catch (error) {
    console.error('Error in setActiveOrgApi:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
