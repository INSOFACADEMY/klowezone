import { NextRequest, NextResponse } from 'next/server'
import { adminAuthMiddleware } from '@/middleware/admin-auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  try {
    // Apply admin authentication middleware
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get all system configuration settings
    const settings = await prisma.systemConfig.findMany({
      orderBy: { createdAt: 'desc' }
    })

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
      data: processedSettings
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
    // Apply admin authentication middleware
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const { key, value, isSecret = false, category, description } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Encrypt value if it's marked as secret
    const processedValue = isSecret ? encrypt(value) : value

    // Create or update setting
    const setting = await prisma.systemConfig.upsert({
      where: { key },
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
        description
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
    // Apply admin authentication middleware
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      )
    }

    // Delete setting
    await prisma.systemConfig.delete({
      where: { key }
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







