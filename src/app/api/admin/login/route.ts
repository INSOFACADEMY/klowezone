import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { isAdminRole } from '@/lib/roles'

/**
 * Enterprise Admin Auth (Session-based, Postgres-backed)
 * - No permissions in token
 * - No JWT for admin session
 * - Stores ONLY hashed session token in DB
 * - Cookie is httpOnly; server resolves user/org/permissions
 *
 * Cookies:
 * - admin_session: session token (httpOnly) -> hashed + stored in DB
 * - kz_org: active orgId (httpOnly) optional convenience (server can override)
 */

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const SESSION_TTL_DAYS = 1 // 24h default for admin UI
const COOKIE_NAME = 'admin_session'
const ORG_COOKIE = 'kz_org'

function sha256(input: string) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url')
}

function getClientIP(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xr = req.headers.get('x-real-ip')
  if (xr) return xr.trim()
  return 'unknown'
}

function isProd() {
  return process.env.NODE_ENV === 'production'
}

function sessionExpiryDate() {
  const d = new Date()
  d.setDate(d.getDate() + SESSION_TTL_DAYS)
  return d
}

// POST /api/admin/login - creates Postgres-backed admin session (httpOnly cookie)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const email = parsed.data.email.trim().toLowerCase()
    const password = parsed.data.password

    // Find user with role + memberships (choose active org)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        organizationMemberships: {
          select: { organizationId: true },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const roleName = (user.role?.name ?? '').toLowerCase()
    if (!isAdminRole(roleName)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Determine org (first membership) – you can enhance later (user picks org)
    const orgId = user.organizationMemberships?.[0]?.organizationId ?? null
    if (!orgId) {
      // Admin without org is typically misconfiguration; fail closed.
      return NextResponse.json(
        { error: 'No active organization found for this user' },
        { status: 403 }
      )
    }

    // Create session token (store only hash in DB)
    const token = randomToken(32)
    const tokenHash = sha256(token)

    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') ?? 'unknown'
    const expiresAt = sessionExpiryDate()

    // Optional: revoke other active sessions for same user (strict mode)
    // Comment out if you want multi-device admin sessions.
    await prisma.adminSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    const session = await prisma.adminSession.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
        revokedAt: null,
        lastUsedAt: new Date(),
      },
      select: {
        id: true,
        expiresAt: true,
      },
    })

    const res = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: roleName,
        orgId,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    })

    // Session cookie (httpOnly)
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd(),
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
    })

    // Active org cookie (httpOnly). Keep lax to avoid annoying flows.
    res.cookies.set(ORG_COOKIE, orgId, {
      httpOnly: true,
      secure: isProd(),
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
    })

    // Backward-compat: if you previously used admin_token JWT cookie, clear it to avoid ambiguity
    res.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: isProd(),
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })

    return res
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/login - logout: revoke session + clear cookies
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (token) {
      const tokenHash = sha256(token)
      await prisma.adminSession.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      })
    }

    const res = NextResponse.json({ success: true, message: 'Logout successful' })

    res.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProd(),
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })

    res.cookies.set(ORG_COOKIE, '', {
      httpOnly: true,
      secure: isProd(),
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    // Also clear legacy cookie if exists
    res.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: isProd(),
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })

    return res
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
