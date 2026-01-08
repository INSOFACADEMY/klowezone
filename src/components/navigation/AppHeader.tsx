'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  LogOut,
  User,
  Crown,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  isAdmin?: boolean;
  userEmail?: string;
}

export default function AppHeader(props: AppHeaderProps) {
  const {
    title = '',
    showBackButton = true,
    showHomeButton = true,
    isAdmin = false,
    userEmail = ''
  } = props;
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Logout from Supabase first
      await supabase.auth.signOut()

      // Logout from admin session via API
      try {
        await fetch('/api/admin/login', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (adminLogoutError) {
        console.warn('Admin logout API call failed:', adminLogoutError)
        // Continue with logout even if admin logout fails
      }

      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      // Forzar redirección incluso si hay error
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      // Si no hay historial, ir a la página principal
      router.push(isAdmin ? '/admin' : '/dashboard')
    }
  }

  const handleGoHome = () => {
    router.push(isAdmin ? '/admin' : '/dashboard')
  }

  return (
    <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Lado izquierdo: Navegación */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>
            )}

            {showHomeButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoHome}
                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                <Home className="w-4 h-4 mr-2" />
                {isAdmin ? 'Admin' : 'Inicio'}
              </Button>
            )}

            {title && (
              <div className="flex items-center space-x-2">
                {isAdmin && <Crown className="w-5 h-5 text-emerald-400" />}
                <h1 className="text-white font-semibold">{title}</h1>
              </div>
            )}
          </div>

          {/* Lado derecho: Usuario y Logout */}
          <div className="flex items-center space-x-4">
            {userEmail && (
              <div className="text-sm text-slate-400 hidden sm:block">
                {userEmail}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-slate-400 hover:text-red-400 hover:bg-red-950/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Cerrando...' : 'Salir'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
