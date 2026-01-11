import { createHash, randomBytes } from 'crypto'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export interface AdminSessionData {
  userId: string
  orgId: string
  roleName: string
}

/**
 * Hash a session token using SHA-256
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Get admin session from request cookies
 */
export async function getAdminSessionFromRequest(
  request?: NextRequest
): Promise<AdminSessionData | null> {
  try {
    let sessionToken: string | undefined

    if (request) {
      // From API routes
      sessionToken = request.cookies.get('admin_session')?.value
    } else {
      // From server components/actions
      const cookieStore = cookies()
      sessionToken = cookieStore.get('admin_session')?.value
    }

    if (!sessionToken) {
      return null
    }

    const tokenHash = hashToken(sessionToken)

    // Find active session
    const session = await prisma.adminSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            role: true
          }
        }
      }
    })

    if (!session) {
      return null
    }

    // Update lastUsedAt (throttled: only if more than 5 minutes have passed)
    const now = new Date()
    const lastUsed = session.lastUsedAt
    const shouldUpdate = !lastUsed || (now.getTime() - lastUsed.getTime()) > 5 * 60 * 1000

    if (shouldUpdate) {
      await prisma.adminSession.update({
        where: { id: session.id },
        data: { lastUsedAt: now }
      })
    }

    return {
      userId: session.userId,
      orgId: session.organizationId,
      roleName: session.user.role.name
    }
  } catch (error) {
    console.error('Error getting admin session:', error)
    return null
  }
}

/**
 * Create a new admin session
 */
export async function createAdminSession(
  userId: string,
  orgId: string,
  options: {
    ipAddress?: string
    userAgent?: string
    revokeExisting?: boolean
  } = {}
): Promise<{ sessionId: string; token: string }> {
  const token = generateSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Optionally revoke existing sessions for this user
  if (options.revokeExisting) {
    await prisma.adminSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })
  }

  const session = await prisma.adminSession.create({
    data: {
      userId,
      organizationId: orgId,
      tokenHash,
      expiresAt,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    }
  })

  return {
    sessionId: session.id,
    token
  }
}

/**
 * Revoke an admin session by token
 */
export async function revokeAdminSession(token: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(token)

    const result = await prisma.adminSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })

    return result.count > 0
  } catch (error) {
    console.error('Error revoking admin session:', error)
    return false
  }
}

/**
 * Clean up expired sessions (can be called periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.adminSession.updateMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })

    return result.count
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error)
    return 0
  }
}


