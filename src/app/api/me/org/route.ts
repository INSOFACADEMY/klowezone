import { NextRequest, NextResponse } from 'next/server'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'
import { setActiveOrg } from '@/lib/tenant/setActiveOrg'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Función helper para autenticar usuario (similar a otros endpoints)
async function authenticateUser(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return { userId: payload.userId }
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

    const { searchParams } = new URL(request.url)
    const forceOrgId = searchParams.get('force')

    // Si hay force parameter, solo permitir en desarrollo
    if (forceOrgId) {
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Force parameter only allowed in development' },
          { status: 403 }
        )
      }

      // Validar y forzar cambio de org
      const result = await setActiveOrg(forceOrgId, request)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
    }

    // Obtener contexto actual
    const orgContext = await getOrgContext(request)

    // Obtener detalles completos de la organización
    const organization = await prisma.organization.findUnique({
      where: { id: orgContext.orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      userId: orgContext.userId,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        logo: organization.logo,
        isActive: organization.isActive,
        createdAt: organization.createdAt
      },
      role: orgContext.orgRole,
      forced: forceOrgId ? true : false
    })

  } catch (error) {
    console.error('Error in /api/me/org:', error)

    if (error instanceof TenantError) {
      const statusCode = {
        'NO_AUTH': 401,
        'NO_ORG': 404,
        'INVALID_ORG': 400,
        'INTERNAL_ERROR': 500
      }[error.message] || 500

      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Cambiar organización activa
    const result = await setActiveOrg(userId, orgId)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Obtener contexto actualizado
    const orgContext = await getOrgContext(request)

    // Obtener detalles completos de la organización
    const organization = await prisma.organization.findUnique({
      where: { id: orgContext.orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        isActive: true,
        createdAt: true
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
      userId: orgContext.userId,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        logo: organization.logo,
        isActive: organization.isActive,
        createdAt: organization.createdAt
      },
      role: orgContext.orgRole
    })

  } catch (error) {
    console.error('Error in POST /api/me/org:', error)

    if (error instanceof TenantError) {
      const statusCode = {
        'NO_AUTH': 401,
        'NO_ORG': 404,
        'INVALID_ORG': 400,
        'INTERNAL_ERROR': 500
      }[error.message] || 500

      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
