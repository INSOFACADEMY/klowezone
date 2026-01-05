import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Función helper para autenticar usuario (similar a otros endpoints)
async function authenticateUser(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      // Try to get from cookies as fallback
      const cookies = request.cookies
      const cookieToken = cookies.get('token')?.value ||
                         cookies.get('auth-token')?.value ||
                         cookies.get('jwt')?.value

      if (cookieToken) {
        // For now, accept admin token or jwt secret
        if (cookieToken === process.env.ADMIN_TOKEN || cookieToken === process.env.JWT_SECRET) {
          const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@klowezone.com' }
          })

          if (adminUser) {
            return { userId: adminUser.id }
          }
        }
      }

      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For now, accept admin token or jwt secret
    if (token === process.env.ADMIN_TOKEN || token === process.env.JWT_SECRET) {
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@klowezone.com' }
      })

      if (!adminUser) {
        return NextResponse.json(
          { error: 'Admin user not found' },
          { status: 500 }
        )
      }

      return { userId: adminUser.id }
    }

    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Autenticar usuario
    const authResult = await authenticateUser(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const { userId } = authResult

    // Obtener todas las membresías del usuario con detalles completos
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logo: true,
            isActive: true,
            createdAt: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    })

    // Obtener organización activa actual (desde user_profiles)
    let activeOrgId: string | null = null
    try {
      const userProfile = await prisma.$queryRaw<Array<{ active_org_id: string | null }>>`
        SELECT active_org_id FROM user_profiles WHERE id = ${userId}
      `
      activeOrgId = userProfile[0]?.active_org_id || null
    } catch (error) {
      // Si no hay user_profiles, usar null
      activeOrgId = null
    }

    // Formatear respuesta
    const organizations = memberships.map(membership => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      description: membership.organization.description,
      logo: membership.organization.logo,
      isActive: membership.organization.isActive,
      role: membership.role,
      joinedAt: membership.joinedAt,
      isCurrent: membership.organization.id === activeOrgId
    }))

    return NextResponse.json({
      organizations,
      currentOrgId: activeOrgId,
      total: organizations.length
    })

  } catch (error) {
    console.error('Error in GET /api/me/orgs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
