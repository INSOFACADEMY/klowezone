import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES, isAdminRole } from '@/lib/roles'

interface AdminProtectionProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Validates admin token and user permissions
 */
async function validateAdminToken(token: string): Promise<boolean> {
  try {
    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      return false
    }

    // Verify user exists and has admin role
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        isActive: true,
        role: { select: { name: true } }
      }
    })

    if (!user || !user.isActive) {
      return false
    }

    // Check admin roles using centralized function
    const roleName = user.role?.name?.toLowerCase?.() ?? ''
    return isAdminRole(roleName)
  } catch (error) {
    console.error('Admin token validation error:', error)
    return false
  }
}

export default async function AdminProtection({
  children,
  redirectTo = '/login'
}: AdminProtectionProps) {
  // Verificar autenticación en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    redirect(`${redirectTo}?next=${encodeURIComponent('/admin')}`)
  }

  const isValidAdmin = await validateAdminToken(token)
  if (!isValidAdmin) {
    redirect(`${redirectTo}?next=${encodeURIComponent('/admin')}`)
  }

  return <>{children}</>
}


