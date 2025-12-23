'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { validateInvitationToken, acceptInvitation } from '@/lib/project-invitations'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2, Users, Briefcase, Calendar } from 'lucide-react'

function JoinPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkTokenAndUser = async () => {
      if (!token) {
        setError('Token de invitación no válido')
        setLoading(false)
        return
      }

      try {
        // Verificar usuario autenticado
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

        if (userError || !currentUser) {
          // Usuario no autenticado - redirigir a login con token
          console.log('Usuario no autenticado, guardando token para después del login')
          localStorage.setItem('pendingInvitationToken', token)
          router.push('/login?redirect=join')
          return
        }

        setUser(currentUser)

        // Validar token de invitación
        console.log('Validando token de invitación:', token)
        const invitationData = await validateInvitationToken(token)

        if (!invitationData) {
          setError('La invitación ha expirado o no es válida')
          setLoading(false)
          return
        }

        // Verificar que el email coincida
        if (invitationData.email !== currentUser.email) {
          setError('Esta invitación no corresponde a tu cuenta de email')
          setLoading(false)
          return
        }

        setInvitation(invitationData)
        setLoading(false)
      } catch (err) {
        console.error('Error validating invitation:', err)
        setError('Error al validar la invitación')
        setLoading(false)
      }
    }

    checkTokenAndUser()
  }, [token, router])

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return

    setAccepting(true)
    try {
      console.log('Aceptando invitación para proyecto:', invitation.proyecto_id)
      const result = await acceptInvitation(invitation.token)

      if (result.success) {
        setSuccess(true)
        console.log('Invitación aceptada exitosamente')

        // Redirigir al proyecto después de 2 segundos
        setTimeout(() => {
          router.push(`/dashboard/projects/${invitation.proyecto_id}`)
        }, 2000)
      } else {
        setError('Error al aceptar la invitación')
      }
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setError('Error al aceptar la invitación. Inténtalo de nuevo.')
    } finally {
      setAccepting(false)
    }
  }

  const handleDeclineInvitation = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Validando invitación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-red-500/20">
            <CardHeader className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-white">Invitación No Válida</CardTitle>
              <CardDescription className="text-slate-400">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
              >
                Ir al Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-green-500/20">
            <CardHeader className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-white">¡Bienvenido al Equipo!</CardTitle>
              <CardDescription className="text-slate-400">
                Te has unido exitosamente al proyecto <strong>{invitation?.proyectos?.nombre_proyecto}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-400 mb-4">
                Redirigiendo al proyecto...
              </p>
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!invitation) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-white">Invitación al Proyecto</CardTitle>
            <CardDescription className="text-slate-400">
              Has sido invitado a colaborar en un proyecto
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Información del Proyecto */}
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm text-slate-400">Proyecto</p>
                  <p className="text-white font-medium">{invitation.proyectos?.nombre_proyecto}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-400">Tu Rol</p>
                  <p className="text-white font-medium">{invitation.rol}</p>
                </div>
              </div>

              {invitation.fecha_expiracion && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-slate-400">Expira</p>
                    <p className="text-white font-medium">
                      {new Date(invitation.fecha_expiracion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Descripción del proyecto */}
            {invitation.proyectos?.descripcion && (
              <div>
                <h4 className="text-white font-medium mb-2">Acerca del Proyecto</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {invitation.proyectos.descripcion}
                </p>
              </div>
            )}

            {/* Información del invitador */}
            {invitation.profiles && (
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-sm text-slate-400">
                  Invitado por <span className="text-white font-medium">{invitation.profiles.nombre_completo || invitation.profiles.email}</span>
                </p>
              </div>
            )}

            {/* Notas del admin */}
            {invitation.notas_admin && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Nota del administrador:</strong> {invitation.notas_admin}
                </AlertDescription>
              </Alert>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleDeclineInvitation}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                disabled={accepting}
              >
                Rechazar
              </Button>
              <Button
                onClick={handleAcceptInvitation}
                disabled={accepting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uniendo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar Invitación
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  )
}
