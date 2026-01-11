import { NextRequest, NextResponse } from 'next/server'
import { setActiveOrg } from '@/lib/tenant/setActiveOrg'
import { prisma } from '@/lib/prisma'

// Función helper para autenticar usuario
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

export async function POST(request: NextRequest) {
  try {
    // Autenticar usuario
    const authResult = await authenticateUser(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const { userId } = authResult

    // Obtener orgId del body
    const body = await request.json()
    const { orgId } = body

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      )
    }

    // Verificar que el usuario es miembro de la organización
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: userId
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied: You are not a member of this organization' },
        { status: 403 }
      )
    }

    // Cambiar organización activa
    const result = await setActiveOrg(userId, orgId)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Obtener detalles de la nueva organización activa
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        isActive: true
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Organization switched successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        logo: organization.logo,
        isActive: organization.isActive
      },
      role: membership.role
    })

  } catch (error) {
    console.error('Error in POST /api/me/org/switch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







