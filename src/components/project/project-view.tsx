'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KanbanBoard } from './kanban-board'
import { GanttView } from './gantt-view'
import { AnalyticsDashboard } from './analytics-dashboard'
import { TeamManagementModal } from './team-management-modal'
import { getTasksByProject, createTask, updateTask, Task } from '@/lib/tasks'
import { getProjectById, Project } from '@/lib/projects'
import { aiProjectService, AutoScheduleResponse } from '@/lib/ai-project-service'
import {
  KanbanSquare,
  Table,
  GanttChart,
  Plus,
  Search,
  Sparkles,
  Loader2,
  Calendar,
  Users,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react'

interface ProjectViewProps {
  projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
  const [activeTab, setActiveTab] = useState('kanban')
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Estados para nueva tarea
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [newTask, setNewTask] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'Media' as Task['prioridad'],
    fecha_entrega: '',
    asignado_a: ''
  })

  // Estados para IA
  const [generatingWithAI, setGeneratingWithAI] = useState(false)
  const [aiSchedule, setAiSchedule] = useState<AutoScheduleResponse | null>(null)

  // Estados para modales
  const [showTeamModal, setShowTeamModal] = useState(false)

  // Cargar datos del proyecto y tareas
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true)
        const [projectData, tasksData] = await Promise.all([
          getProjectById(projectId),
          getTasksByProject(projectId)
        ])

        setProject(projectData)
        setTasks(tasksData)
        setFilteredTasks(tasksData)
      } catch (error) {
        console.error('Error loading project data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [projectId])

  // Filtrar tareas
  useEffect(() => {
    let filtered = tasks

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.estado === statusFilter)
    }

    // Filtro de prioridad
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.prioridad === priorityFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchTerm, statusFilter, priorityFilter])

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
  }

  const handleTaskClick = (task: Task) => {
    // Aquí podrías abrir un modal de detalles de tarea
    console.log('Task clicked:', task)
  }

  const handleCreateTask = async () => {
    if (!newTask.titulo.trim()) return

    try {
      const taskData = {
        proyecto_id: projectId,
        titulo: newTask.titulo,
        descripcion: newTask.descripcion,
        prioridad: newTask.prioridad,
        estado: 'To Do' as Task['estado'],
        fecha_entrega: newTask.fecha_entrega || undefined,
        asignado_a: newTask.asignado_a || undefined
      }

      const createdTask = await createTask(taskData)
      setTasks(prev => [...prev, createdTask])

      // Reset form
      setNewTask({
        titulo: '',
        descripcion: '',
        prioridad: 'Media',
        fecha_entrega: '',
        asignado_a: ''
      })
      setShowNewTaskForm(false)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleGenerateWithAI = async () => {
    if (!project) return

    setGeneratingWithAI(true)
    try {
      const schedule = await aiProjectService.generateAutoSchedule({
        projectName: project.nombre_proyecto,
        projectDescription: project.descripcion || '',
        complexity: 'Media',
        teamSize: 1
      })

      setAiSchedule(schedule)

      // Crear las tareas automáticamente
      for (const task of schedule.tasks) {
        await createTask({
          proyecto_id: projectId,
          titulo: task.title,
          descripcion: task.description,
          prioridad: task.priority as Task['prioridad'],
          estado: 'To Do',
          fecha_entrega: task.estimatedHours > 40 ?
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      }

      // Recargar tareas
      const tasksData = await getTasksByProject(projectId)
      setTasks(tasksData)

    } catch (error) {
      console.error('Error generating with AI:', error)
    } finally {
      setGeneratingWithAI(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-2">Proyecto no encontrado</h2>
        <p className="text-slate-400">El proyecto que buscas no existe o no tienes acceso.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header del Proyecto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.nombre_proyecto}</h1>
            {project.descripcion && (
              <p className="text-slate-400">{project.descripcion}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{project.fecha_entrega ? new Date(project.fecha_entrega).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{tasks.length} tareas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{tasks.filter(t => t.estado === 'Done').length} completadas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de herramientas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-slate-800 border-slate-600"
              />
            </div>

            {/* Filtros */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="To Do">Por Hacer</SelectItem>
                <SelectItem value="In Progress">En Progreso</SelectItem>
                <SelectItem value="Review">Revisión</SelectItem>
                <SelectItem value="Done">Completado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowTeamModal(true)}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Users className="w-4 h-4 mr-2" />
            Gestionar Equipo
          </Button>

          <Button
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </Button>

          <Button
            onClick={handleGenerateWithAI}
            disabled={generatingWithAI}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            {generatingWithAI ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generar con IA
          </Button>
          </div>
        </div>
      </motion.div>

      {/* Formulario de nueva tarea */}
      <AnimatePresence>
        {showNewTaskForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Nueva Tarea</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
                    <Input
                      value={newTask.titulo}
                      onChange={(e) => setNewTask(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Título de la tarea"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Prioridad</label>
                    <Select value={newTask.prioridad} onValueChange={(value) => setNewTask(prev => ({ ...prev, prioridad: value as Task['prioridad'] }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baja">Baja</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
                  <Input
                    value={newTask.descripcion}
                    onChange={(e) => setNewTask(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción de la tarea"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Fecha de entrega</label>
                    <Input
                      type="date"
                      value={newTask.fecha_entrega}
                      onChange={(e) => setNewTask(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Asignar a</label>
                    <Input
                      value={newTask.asignado_a}
                      onChange={(e) => setNewTask(prev => ({ ...prev, asignado_a: e.target.value }))}
                      placeholder="ID del usuario"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setShowNewTaskForm(false)}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                  >
                    Crear Tarea
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vista por pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <KanbanSquare className="w-4 h-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <GanttChart className="w-4 h-4" />
            Gantt
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Tabla
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          <KanbanBoard
            projectId={projectId}
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="gantt" className="mt-6">
          <GanttView projectId={projectId} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard projectId={projectId} />
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Table className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Vista de Tabla</h3>
                <p className="text-slate-400">Vista de tabla próximamente disponible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de gestión de equipo */}
      <TeamManagementModal
        projectId={projectId}
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
      />
    </div>
  )
}
