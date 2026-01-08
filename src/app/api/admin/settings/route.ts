import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/middleware/admin-auth'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'
import { validateOrgPermission } from '@/lib/rbac/org-rbac'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import { validateApiRequest, createSettingsSchema } from '@/lib/validation/input-validation'

export async function GET(request: NextRequest) {
  try {
    // Apply admin authentication
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;

    // Get organization context (required for multi-tenant)
    let orgContext
    try {
      orgContext = await getOrgContext(request)
    } catch (error) {
      if (error instanceof TenantError) {
        return NextResponse.json(
          { error: `Organization context required: ${error.message}` },
          { status: 400 }
        )
      }
      throw error
    }

    // Parse pagination parameters
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 100) : 50
    const offset = offsetParam ? Math.max(parseInt(offsetParam, 10) || 0, 0) : 0

    // Get system configuration settings for the organization with pagination
    const where = { organizationId: orgContext.orgId }

    const [settings, total] = await prisma.$transaction([
      prisma.systemConfig.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.systemConfig.count({ where })
    ])

    // Decrypt sensitive values for admin users
    const processedSettings = settings.map(setting => ({
      id: setting.id,
      key: setting.key,
      value: setting.isSecret ? decrypt(setting.value) : setting.value,
      isSecret: setting.isSecret,
      category: setting.category,
      description: setting.description,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: processedSettings,
      pageInfo: {
        limit,
        offset,
        returned: processedSettings.length,
        hasMore: offset + processedSettings.length < total
      },
      total
    })

  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply admin authentication
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;

    // Get organization context (required for multi-tenant)
    let orgContext
    try {
      orgContext = await getOrgContext(request)
    } catch (error) {
      if (error instanceof TenantError) {
        return NextResponse.json(
          { error: `Organization context required: ${error.message}` },
          { status: 400 }
        )
      }
      throw error
    }

    // RBAC: Settings write requires OWNER or ADMIN role
    const permissionCheck = validateOrgPermission(orgContext, 'settings:write', 'write settings')
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode }
      )
    }

    // Validate and sanitize input
    const validation = await validateApiRequest(createSettingsSchema, request, {
      sanitizeStrings: true,
      sanitizeHtml: false
    })

    if (!validation.success) {
      return validation.response
    }

    const { key, value, isSecret = false, category, description } = validation.data

    // Encrypt value if it's marked as secret
    const processedValue = isSecret ? encrypt(value) : value

    // Create or update setting for the organization
    const setting = await prisma.systemConfig.upsert({
      where: {
        key_organizationId: {
          key: key,
          organizationId: orgContext.orgId
        }
      },
      update: {
        value: processedValue,
        isSecret,
        category,
        description,
        updatedAt: new Date()
      },
      create: {
        key,
        value: processedValue,
        isSecret,
        category,
        description,
        organizationId: orgContext.orgId
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: setting.id,
        key: setting.key,
        value: isSecret ? '[ENCRYPTED]' : setting.value,
        isSecret: setting.isSecret,
        category: setting.category,
        description: setting.description
      }
    })

  } catch (error) {
    console.error('Error updating admin setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Apply admin authentication
    const auth = await requireAdminUser(request);
    if (auth instanceof NextResponse) return auth;

    const { user } = auth;

    // Get organization context (required for multi-tenant)
    let orgContext
    try {
      orgContext = await getOrgContext(request)
    } catch (error) {
      if (error instanceof TenantError) {
        return NextResponse.json(
          { error: `Organization context required: ${error.message}` },
          { status: 400 }
        )
      }
      throw error
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      )
    }

    // Delete setting from the organization
    await prisma.systemConfig.delete({
      where: {
        key_organizationId: {
          key: key,
          organizationId: orgContext.orgId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting admin setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







