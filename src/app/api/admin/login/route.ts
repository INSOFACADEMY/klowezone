import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// POST /api/admin/login - Admin login with JWT token in httpOnly cookie
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: { select: { name: true } }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    const adminRoles = ['superadmin', 'admin', 'editor', 'analyst', 'support']
    const roleName = user.role?.name?.toLowerCase?.() ?? ''
    if (!adminRoles.includes(roleName)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: roleName
    })

    // Create response with httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: roleName
      }
    })

    // Set admin_token cookie with security flags
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400, // 24 hours
    })

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/logout - Clear admin token cookie
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear admin_token cookie
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Expire immediately
    })

    // Also clear kz_org cookie for completeness
    response.cookies.set('kz_org', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response

  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

