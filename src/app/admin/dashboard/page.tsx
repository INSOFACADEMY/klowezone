'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Zap,
  MessageSquare,
  Server,
  Database,
  Shield,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getDashboardStats } from '@/lib/dashboard-service'
import type { DashboardStats } from '@/lib/dashboard-service'
  systemHealth: 98,
  errorRate: 0.2
}

const mockAlerts = [
  {
    id: 1,
    type: 'warning',
    title: 'Alto uso de CPU',
    message: 'El servidor principal está al 85% de capacidad',
    time: '2 min ago',
    priority: 'high'
  },
  {
    id: 2,
    type: 'info',
    title: 'Nueva integración completada',
    message: 'SendGrid se configuró correctamente',
    time: '15 min ago',
    priority: 'medium'
  },
  {
    id: 3,
    type: 'success',
    title: 'Backup completado',
    message: 'Respaldo automático finalizado exitosamente',
    time: '1 hour ago',
    priority: 'low'
  }
]

const mockHealthChecks = [
  { service: 'Database', status: 'healthy', uptime: '99.9%', response: '12ms' },
  { service: 'API', status: 'healthy', uptime: '99.8%', response: '45ms' },
  { service: 'Email Service', status: 'warning', uptime: '98.5%', response: '120ms' },
  { service: 'Storage', status: 'healthy', uptime: '99.9%', response: '25ms' }
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])
        systemHealth: Math.max(95, Math.min(100, prev.systemHealth + (Math.random() - 0.5)))
      }))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-amber-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-blue-500'
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-500/10'
      case 'warning': return 'text-amber-500 bg-amber-500/10'
      case 'error': return 'text-red-500 bg-red-500/10'
      default: return 'text-slate-500 bg-slate-500/10'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Administrativo</h1>
          <p className="text-slate-400 mt-1">
            Bienvenido al panel de control de KloweZone
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
            <Server className="w-3 h-3 mr-1" />
            Sistema Online
          </Badge>
          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
            <Activity className="w-3 h-3 mr-1" />
            {stats.systemHealth}% Salud
          </Badge>
        </div>
      </motion.div>

      {/* KPIs Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Contenido CMS</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +3 posts esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Proyectos Activos</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeProjects}</div>
            <p className="text-xs text-amber-400 flex items-center mt-1">
              <Clock className="w-3 h-3 mr-1" />
              5 requieren atención
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-emerald-400" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthChecks.map((service, index) => (
                  <div key={service.service} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        service.status === 'healthy' ? 'bg-green-500' :
                        service.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-white font-medium">{service.service}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-slate-400">{service.uptime}</span>
                      <span className="text-slate-400">{service.response}</span>
                      <Badge className={getHealthStatusColor(service.status)}>
                        {service.status === 'healthy' ? 'Saludable' :
                         service.status === 'warning' ? 'Advertencia' : 'Error'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-400" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white">
                    <Users className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Nuevo Post
                  </Button>
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    <Database className="w-4 h-4 mr-2" />
                    Backup DB
                  </Button>
                  <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Reportes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alerts & Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Recent Alerts */}
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
                Alertas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 bg-slate-800/50 border ${getAlertColor(alert.priority)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{alert.title}</p>
                      <p className="text-slate-400 text-xs mt-1">{alert.message}</p>
                      <p className="text-slate-500 text-xs mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Metrics */}
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                Métricas del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Uso de CPU</span>
                  <span className="text-white">23%</span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Uso de Memoria</span>
                  <span className="text-white">67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Uso de Disco</span>
                  <span className="text-white">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Feedback Summary */}
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-green-400" />
                Feedback Pendiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-slate-400 text-sm">Mensajes sin leer</p>
                </div>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                  Ver Todos
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

