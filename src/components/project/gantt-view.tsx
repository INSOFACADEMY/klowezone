'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTasksByProject, Task } from '@/lib/tasks'
import { getProjectById, Project } from '@/lib/projects'
import { Calendar, BarChart3, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface GanttViewProps {
  projectId: string
}

interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  dependencies?: string[]
  status: Task['estado']
  priority: Task['prioridad']
}

export function GanttView({ projectId }: GanttViewProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

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
      } catch (error) {
        console.error('Error loading Gantt data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId])

  // Convertir tareas a formato Gantt
  const ganttTasks: GanttTask[] = tasks.map(task => ({
    id: task.id!,
    name: task.titulo,
    start: task.fecha_inicio ? new Date(task.fecha_inicio) : new Date(),
    end: task.fecha_entrega ? new Date(task.fecha_entrega) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    progress: task.progreso || 0,
    status: task.estado,
    priority: task.prioridad
  }))

  const getTaskProgress = (status: Task['estado']): number => {
    switch (status) {
      case 'To Do': return 0
      case 'In Progress': return 50
      case 'Review': return 75
      case 'Done': return 100
      default: return 0
    }
  }

  const getStatusColor = (status: Task['estado']): string => {
    switch (status) {
      case 'To Do': return 'bg-gray-200'
      case 'In Progress': return 'bg-blue-500'
      case 'Review': return 'bg-yellow-500'
      case 'Done': return 'bg-green-500'
      default: return 'bg-gray-200'
    }
  }

  const getPriorityColor = (priority: Task['prioridad']): string => {
    switch (priority) {
      case 'Urgente': return 'border-red-500 bg-red-50'
      case 'Alta': return 'border-orange-500 bg-orange-50'
      case 'Media': return 'border-yellow-500 bg-yellow-50'
      case 'Baja': return 'border-green-500 bg-green-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  // Calcular fechas del proyecto
  const projectStart = project?.created_at ? new Date(project.created_at) : new Date()
  const projectEnd = tasks.length > 0
    ? new Date(Math.max(...tasks.map(t => t.fecha_entrega ? new Date(t.fecha_entrega).getTime() : Date.now())))
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // Calcular timeline
  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
  const currentDay = Math.ceil((currentDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 animate-pulse text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando diagrama de Gantt...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Proyecto no encontrado</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Diagrama de Gantt</h2>
          <p className="text-slate-400">
            Visualización temporal de tareas y hitos del proyecto
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Día</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-slate-400">
            {projectStart.toLocaleDateString('es-ES')} - {projectEnd.toLocaleDateString('es-ES')}
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Línea de Tiempo</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>Día {currentDay} de {totalDays}</span>
              <span>{Math.round((currentDay / totalDays) * 100)}% completado</span>
            </div>
          </div>

          {/* Barra de progreso del proyecto */}
          <div className="w-full bg-slate-700 rounded-full h-3 mb-6">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentDay / totalDays) * 100, 100)}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          {/* Escala de tiempo */}
          <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 mb-4">
            {Array.from({ length: 12 }, (_, i) => {
              const month = new Date(projectStart.getFullYear(), projectStart.getMonth() + i, 1)
              return (
                <div key={i} className="text-center">
                  {month.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de tareas en formato Gantt */}
      <div className="space-y-3">
        {ganttTasks.length === 0 ? (
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No hay tareas para mostrar</h3>
              <p className="text-slate-400 mb-6">Crea tareas con fechas de inicio y fin para ver el diagrama de Gantt.</p>
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                Crear Primera Tarea
              </Button>
            </CardContent>
          </Card>
        ) : (
          ganttTasks.map((task, index) => {
            const startOffset = Math.max(0, Math.ceil((task.start.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)))
            const duration = Math.max(1, Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)))
            const leftPercent = (startOffset / totalDays) * 100
            const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent)

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <Card className={`bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 ${getPriorityColor(task.priority)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                        <h4 className="font-medium text-white">{task.name}</h4>
                        <Badge className={`${getPriorityColor(task.priority)} border`}>
                          {task.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {task.start.toLocaleDateString('es-ES')} - {task.end.toLocaleDateString('es-ES')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {duration} días
                        </span>
                      </div>
                    </div>

                    {/* Barra de Gantt */}
                    <div className="relative h-8 bg-slate-700 rounded-lg overflow-hidden">
                      {/* Barra de fondo */}
                      <div
                        className={`absolute top-0 h-full ${getStatusColor(task.status)} opacity-30 rounded-lg`}
                        style={{
                          left: `${Math.max(0, leftPercent)}%`,
                          width: `${Math.max(5, widthPercent)}%`
                        }}
                      />

                      {/* Barra de progreso */}
                      <motion.div
                        className={`absolute top-0 h-full ${getStatusColor(task.status)} rounded-lg`}
                        style={{
                          left: `${Math.max(0, leftPercent)}%`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(5, widthPercent * (task.progress / 100))}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />

                      {/* Etiqueta de progreso */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow">
                          {task.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <span>Inicio: {task.start.toLocaleDateString('es-ES')}</span>
                        <span>Fin: {task.end.toLocaleDateString('es-ES')}</span>
                      </div>

                      {task.dependencies && task.dependencies.length > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Depende de: {task.dependencies.length} tarea(s)</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Leyenda */}
      <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="text-sm text-slate-300">Por Hacer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-300">En Progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-slate-300">Revisión</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-slate-300">Completado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
