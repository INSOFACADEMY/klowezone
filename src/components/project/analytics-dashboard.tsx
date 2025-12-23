'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { getTasksByProject, Task, getTaskStats } from '@/lib/tasks'
import { getProjectById, Project } from '@/lib/projects'
import { getTimeStatsByProject } from '@/lib/time-tracking'
import { aiProjectService } from '@/lib/ai-project-service'
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  Zap,
  PieChart,
  LineChart,
  Sparkles,
  Loader2
} from 'lucide-react'

interface AnalyticsDashboardProps {
  projectId: string
}

interface ProjectMetrics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  completionRate: number
  averageTaskDuration: number
  totalTimeLogged: number
  billableTime: number
  costEfficiency: number
  teamProductivity: number
}

export function AnalyticsDashboard({ projectId }: AnalyticsDashboardProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [generatingInsights, setGeneratingInsights] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [projectData, tasksData] = await Promise.all([
          getProjectById(projectId),
          getTasksByProject(projectId)
        ])

        setProject(projectData)
        setTasks(tasksData)

        // Calcular métricas
        if (projectData) {
          await calculateMetrics(tasksData, projectData)
        }
      } catch (error) {
        console.error('Error loading analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId, timeRange])

  const calculateMetrics = async (tasksData: Task[], projectData: Project) => {
    try {
      // Estadísticas básicas de tareas
      const totalTasks = tasksData.length
      const completedTasks = tasksData.filter(t => t.estado === 'Done').length
      const inProgressTasks = tasksData.filter(t => t.estado === 'In Progress').length
      const overdueTasks = tasksData.filter(t => {
        if (!t.fecha_entrega || t.estado === 'Done') return false
        return new Date(t.fecha_entrega) < new Date()
      }).length

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Estadísticas de tiempo
      const timeStats = await getTimeStatsByProject(projectId)
      const totalTimeLogged = timeStats.total_horas || 0
      const billableTime = timeStats.horas_facturables || 0

      // Calcular duración promedio de tareas
      const completedTasksWithTime = tasksData.filter(t => t.estado === 'Done' && t.tiempo_real)
      const averageTaskDuration = completedTasksWithTime.length > 0
        ? completedTasksWithTime.reduce((sum, t) => sum + parseFloat(t.tiempo_real || '0'), 0) / completedTasksWithTime.length
        : 0

      // Eficiencia de costos (estimado basado en tiempo facturable vs total)
      const costEfficiency = totalTimeLogged > 0 ? (billableTime / totalTimeLogged) * 100 : 0

      // Productividad del equipo (tareas completadas por tiempo)
      const teamProductivity = totalTimeLogged > 0 ? completedTasks / totalTimeLogged : 0

      setMetrics({
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
        averageTaskDuration,
        totalTimeLogged,
        billableTime,
        costEfficiency,
        teamProductivity
      })
    } catch (error) {
      console.error('Error calculating metrics:', error)
    }
  }

  const generateAIInsights = async () => {
    if (!project || !metrics) return

    setGeneratingInsights(true)
    try {
      // Preparar datos para el reporte de salud
      const healthData = {
        projectId,
        currentBudget: project.presupuesto || 0,
        timeEntries: {
          hoursLogged: metrics.totalTimeLogged,
          billableHours: metrics.billableTime,
          totalCost: (metrics.billableTime * 50) // Estimado de $50/hora
        },
        tasksCompleted: metrics.completedTasks,
        totalTasks: metrics.totalTasks,
        daysElapsed: Math.ceil((Date.now() - new Date(project.created_at!).getTime()) / (1000 * 60 * 60 * 24)),
        daysTotal: project.fecha_entrega
          ? Math.ceil((new Date(project.fecha_entrega).getTime() - new Date(project.created_at!).getTime()) / (1000 * 60 * 60 * 24))
          : 30
      }

      const insights = await aiProjectService.generateHealthReport(healthData)
      setAiInsights(insights)
    } catch (error) {
      console.error('Error generating AI insights:', error)
    } finally {
      setGeneratingInsights(false)
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Excelente': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'Bueno': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'Precaución': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'Crítico': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`
    return `${hours.toFixed(1)}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 animate-pulse text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando analytics...</p>
        </div>
      </div>
    )
  }

  if (!project || !metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No se pudieron cargar los datos</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard de Analytics</h2>
          <p className="text-slate-400">
            Métricas avanzadas y insights inteligentes para {project.nombre_proyecto}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={generateAIInsights}
            disabled={generatingInsights}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {generatingInsights ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Insights IA
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Tareas Completadas</p>
                  <p className="text-2xl font-bold text-white">{metrics.completedTasks}/{metrics.totalTasks}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {metrics.completionRate.toFixed(1)}% completado
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <Progress value={metrics.completionRate} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Tiempo Registrado</p>
                  <p className="text-2xl font-bold text-white">{formatTime(metrics.totalTimeLogged)}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTime(metrics.billableTime)} facturable
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Eficiencia de Costos</p>
                  <p className="text-2xl font-bold text-white">{metrics.costEfficiency.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatCurrency(metrics.billableTime * 50)} facturado
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Productividad</p>
                  <p className="text-2xl font-bold text-white">{metrics.teamProductivity.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    tareas por hora
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights de IA */}
      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Insights de IA - Estado del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={`${getHealthStatusColor(aiInsights.status)} px-3 py-1`}>
                  {aiInsights.status}
                </Badge>
                <span className="text-sm text-slate-400">
                  Puntuación: {aiInsights.score}/100
                </span>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Resumen Ejecutivo</h4>
                <p className="text-slate-300">{aiInsights.summary}</p>
              </div>

              {aiInsights.risks && aiInsights.risks.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                  <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Riesgos Identificados
                  </h4>
                  <ul className="text-red-300 text-sm space-y-1">
                    {aiInsights.risks.map((risk: string, index: number) => (
                      <li key={index}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Recomendaciones
                  </h4>
                  <ul className="text-blue-300 text-sm space-y-1">
                    {aiInsights.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.timelineProjection && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Proyección de Timeline</h4>
                    <p className="text-slate-300 text-sm">
                      Progreso actual: {aiInsights.timelineProjection.currentProgress.toFixed(1)}%
                    </p>
                    <p className="text-slate-300 text-sm">
                      Completación estimada: {new Date(aiInsights.timelineProjection.projectedCompletion).toLocaleDateString('es-ES')}
                    </p>
                    {!aiInsights.timelineProjection.onTrack && aiInsights.timelineProjection.delayDays && (
                      <p className="text-red-400 text-sm">
                        Retraso: {aiInsights.timelineProjection.delayDays} días
                      </p>
                    )}
                  </div>

                  {aiInsights.budgetProjection && (
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Proyección de Presupuesto</h4>
                      <p className="text-slate-300 text-sm">
                        Gasto actual: {formatCurrency(aiInsights.budgetProjection.currentSpend)}
                      </p>
                      <p className="text-slate-300 text-sm">
                        Proyección total: {formatCurrency(aiInsights.budgetProjection.projectedTotal)}
                      </p>
                      {aiInsights.budgetProjection.daysUntilOverBudget && (
                        <p className="text-red-400 text-sm">
                          Días hasta sobrepasar presupuesto: {aiInsights.budgetProjection.daysUntilOverBudget}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gráficos y métricas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de tareas por estado */}
        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribución de Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Por Hacer</span>
                <span className="text-slate-400">{tasks.filter(t => t.estado === 'To Do').length}</span>
              </div>
              <Progress value={(tasks.filter(t => t.estado === 'To Do').length / metrics.totalTasks) * 100} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-slate-300">En Progreso</span>
                <span className="text-slate-400">{metrics.inProgressTasks}</span>
              </div>
              <Progress value={(metrics.inProgressTasks / metrics.totalTasks) * 100} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Revisión</span>
                <span className="text-slate-400">{tasks.filter(t => t.estado === 'Review').length}</span>
              </div>
              <Progress value={(tasks.filter(t => t.estado === 'Review').length / metrics.totalTasks) * 100} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Completadas</span>
                <span className="text-slate-400">{metrics.completedTasks}</span>
              </div>
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Métricas de rendimiento */}
        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Rendimiento del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{formatTime(metrics.averageTaskDuration)}</p>
                <p className="text-xs text-slate-400">Duración promedio por tarea</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{metrics.overdueTasks}</p>
                <p className="text-xs text-slate-400">Tareas atrasadas</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Velocidad de entrega</span>
                <span className="text-slate-400">{(metrics.completedTasks / Math.max(1, metrics.totalTasks)).toFixed(2)} tareas/día</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Eficiencia temporal</span>
                <span className="text-slate-400">{metrics.costEfficiency.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Productividad semanal</span>
                <span className="text-slate-400">{(metrics.teamProductivity * 7).toFixed(1)} tareas/semana</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y recomendaciones */}
      {metrics.overdueTasks > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-red-500/10 border border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-400">Atención requerida</h4>
                  <p className="text-red-300 text-sm">
                    Tienes {metrics.overdueTasks} tarea{metrics.overdueTasks > 1 ? 's' : ''} atrasada{metrics.overdueTasks > 1 ? 's' : ''}.
                    Revisa las prioridades y reasigna recursos si es necesario.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
