import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'

interface AdminProtectionProps {
  children: React.ReactNode
  redirectTo?: string
}

export default async function AdminProtection({
  children,
  redirectTo = '/login'
}: AdminProtectionProps) {
  // Verificar autenticación en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin'
    redirect(`${redirectTo}?next=${encodeURIComponent(currentPath)}`)
  }

  const payload = verifyToken(token)
  if (!payload) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin'
    redirect(`${redirectTo}?next=${encodeURIComponent(currentPath)}`)
  }

  return <>{children}</>
}
