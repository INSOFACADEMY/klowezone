'use client'

import { useEffect, useState } from 'react'
import { X, Check, AlertTriangle, TrendingUp, Users, DollarSign, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// TODO: Implementar API route para notificaciones
interface PulseNotification {
  id: string
  type: 'lead' | 'sale' | 'campaign' | 'alert' | 'milestone'
  title: string
  message: string
  data: Record<string, any>
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface NotificationToastProps {
  className?: string
}

export function NotificationToast({ className = '' }: NotificationToastProps) {
  const [notifications, setNotifications] = useState<PulseNotification[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<PulseNotification | null>(null)

  // Cargar notificaciones activas al montar
  useEffect(() => {
    loadNotifications()
  }, [])

  // Mostrar siguiente notificación cuando cambie la lista
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      setCurrentNotification(notifications[0])
      setIsVisible(true)
    }
  }, [notifications, currentNotification])

  const loadNotifications = async () => {
    try {
      // TODO: Implementar llamada a API route
      // Por ahora, simulamos algunas notificaciones de ejemplo
      const mockNotifications: PulseNotification[] = [
        {
          id: '1',
          type: 'lead',
          title: 'Nuevo Lead Atribuido',
          message: '🚀 ¡Nuevo Lead! Atribuido a la campaña "Campaña Verano 2024". CAC actual: $45.50.',
          data: { campaignId: 'camp-1', userId: 'user-1', cac: 45.50 },
          timestamp: new Date(),
          read: false,
          priority: 'medium'
        },
        {
          id: '2',
          type: 'sale',
          title: 'Venta Cerrada con Éxito',
          message: '💰 ¡Venta Cerrada! ROI de la campaña "Campaña Verano 2024" subió a 156.7%. Ratio de conversión: 12.3%.',
          data: { projectId: 'proj-1', saleAmount: 2500, campaignId: 'camp-1' },
          timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
          read: false,
          priority: 'high'
        }
      ]
      setNotifications(mockNotifications.filter(n => !n.read))
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    }
  }

  const handleDismiss = async () => {
    if (currentNotification) {
      // TODO: Implementar llamada a API route
      // await markNotificationAsRead(currentNotification.id)
      setNotifications(prev => prev.filter(n => n.id !== currentNotification.id))
      setCurrentNotification(null)
      setIsVisible(false)

      // Mostrar siguiente notificación después de un breve delay
      setTimeout(() => {
        const nextNotification = notifications.find(n => n.id !== currentNotification.id && !n.read)
        if (nextNotification) {
          setCurrentNotification(nextNotification)
          setIsVisible(true)
        }
      }, 300)
    }
  }

  const handleMarkAsRead = async () => {
    if (currentNotification) {
      // TODO: Implementar llamada a API route
      // await markNotificationAsRead(currentNotification.id)
      setNotifications(prev => prev.map(n =>
        n.id === currentNotification.id ? { ...n, read: true } : n
      ))
    }
  }

  const getNotificationIcon = (type: PulseNotification['type']) => {
    switch (type) {
      case 'lead':
        return <Users className="w-5 h-5" />
      case 'sale':
        return <DollarSign className="w-5 h-5" />
      case 'campaign':
        return <Target className="w-5 h-5" />
      case 'milestone':
        return <TrendingUp className="w-5 h-5" />
      case 'alert':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <Check className="w-5 h-5" />
    }
  }

  const getPriorityColor = (priority: PulseNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (!isVisible || !currentNotification) {
    return null
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <Card className="w-96 shadow-lg border-l-4 border-l-blue-500 animate-in slide-in-from-right-2 duration-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icono de prioridad */}
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(currentNotification.priority)} mt-2 flex-shrink-0`} />

            {/* Icono del tipo de notificación */}
            <div className="flex-shrink-0 text-blue-500">
              {getNotificationIcon(currentNotification.type)}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {currentNotification.title}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {currentNotification.priority}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                {currentNotification.message}
              </p>

              <div className="text-xs text-gray-400">
                {currentNotification.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-6 w-6 p-0 hover:bg-green-100"
                title="Marcar como leída"
              >
                <Check className="w-3 h-3 text-green-600" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-red-100"
                title="Cerrar"
              >
                <X className="w-3 h-3 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Mostrar datos adicionales si existen */}
          {currentNotification.data && Object.keys(currentNotification.data).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                {Object.entries(currentNotification.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-medium">
                      {typeof value === 'number'
                        ? value.toLocaleString()
                        : String(value)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicador de notificaciones pendientes */}
      {notifications.length > 1 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {notifications.length - 1}
        </div>
      )}
    </div>
  )
}
