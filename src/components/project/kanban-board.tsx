'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { updateTask } from '@/lib/tasks'
import { Task } from '@/lib/tasks'
import { User, Clock, AlertCircle, CheckCircle2, Play, Pause } from 'lucide-react'

interface KanbanBoardProps {
  projectId: string
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskClick: (task: Task) => void
}

interface KanbanColumn {
  id: Task['estado']
  title: string
  color: string
  icon: React.ComponentType<any>
  tasks: Task[]
}

const columns: KanbanColumn[] = [
  {
    id: 'To Do',
    title: 'Por Hacer',
    color: 'border-slate-300 bg-slate-50',
    icon: Play,
    tasks: []
  },
  {
    id: 'In Progress',
    title: 'En Progreso',
    color: 'border-blue-300 bg-blue-50',
    icon: Play,
    tasks: []
  },
  {
    id: 'Review',
    title: 'Revisión',
    color: 'border-yellow-300 bg-yellow-50',
    icon: AlertCircle,
    tasks: []
  },
  {
    id: 'Done',
    title: 'Completado',
    color: 'border-green-300 bg-green-50',
    icon: CheckCircle2,
    tasks: []
  }
]

export function KanbanBoard({ projectId, tasks, onTaskUpdate, onTaskClick }: KanbanBoardProps) {
  const [kanbanTasks, setKanbanTasks] = useState<Task[]>(tasks)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Actualizar tareas cuando cambien las props
  useEffect(() => {
    setKanbanTasks(tasks)
  }, [tasks])

  // Organizar tareas por columnas
  const getColumnsWithTasks = (): KanbanColumn[] => {
    return columns.map(column => ({
      ...column,
      tasks: kanbanTasks.filter(task => task.estado === column.id)
    }))
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: Task['estado']) => {
    e.preventDefault()

    if (!draggedTask || draggedTask.estado === targetColumnId) {
      setDraggedTask(null)
      setDragOverColumn(null)
      return
    }

    try {
      // Actualizar en la base de datos
      await updateTask(draggedTask.id!, { estado: targetColumnId })

      // Actualizar estado local
      const updatedTasks = kanbanTasks.map(task =>
        task.id === draggedTask.id
          ? { ...task, estado: targetColumnId }
          : task
      )

      setKanbanTasks(updatedTasks)
      onTaskUpdate(draggedTask.id!, { estado: targetColumnId })

      console.log(`Tarea "${draggedTask.titulo}" movida a "${targetColumnId}"`)
    } catch (error) {
      console.error('Error updating task status:', error)
    } finally {
      setDraggedTask(null)
      setDragOverColumn(null)
    }
  }

  const getPriorityColor = (priority: Task['prioridad']) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-100 text-red-800 border-red-200'
      case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Baja': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTaskProgress = (task: Task) => {
    // Lógica simple de progreso basado en estado
    switch (task.estado) {
      case 'To Do': return 0
      case 'In Progress': return 50
      case 'Review': return 75
      case 'Done': return 100
      default: return 0
    }
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {getColumnsWithTasks().map((column) => {
        const IconComponent = column.icon

        return (
          <motion.div
            key={column.id}
            className={`flex-shrink-0 w-80 border-2 rounded-xl p-4 transition-colors ${
              dragOverColumn === column.id
                ? 'border-blue-400 bg-blue-50 shadow-lg'
                : column.color
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columns.findIndex(c => c.id === column.id) * 0.1 }}
          >
            {/* Header de columna */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IconComponent className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {column.tasks.length}
                </Badge>
              </div>
            </div>

            {/* Lista de tareas */}
            <div className="space-y-3 min-h-[200px]">
              <AnimatePresence>
                {column.tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                        draggedTask?.id === task.id ? 'opacity-50 rotate-2' : ''
                      } ${
                        task.prioridad === 'Urgente' ? 'border-l-red-500' :
                        task.prioridad === 'Alta' ? 'border-l-orange-500' :
                        task.prioridad === 'Media' ? 'border-l-yellow-500' :
                        'border-l-green-500'
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskClick(task)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Título y prioridad */}
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {task.titulo}
                            </h4>
                            {task.prioridad && (
                              <Badge
                                className={`text-xs ${getPriorityColor(task.prioridad)}`}
                                variant="outline"
                              >
                                {task.prioridad}
                              </Badge>
                            )}
                          </div>

                          {/* Descripción */}
                          {task.descripcion && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {task.descripcion}
                            </p>
                          )}

                          {/* Asignado y tiempo */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {task.asignado_a ? (
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {task.asignado_a.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              ) : (
                                <span className="text-gray-400">Sin asignar</span>
                              )}
                            </div>

                            {task.fecha_entrega && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs">
                                  {new Date(task.fecha_entrega).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Barra de progreso */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              className="bg-blue-600 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${getTaskProgress(task)}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Espacio vacío cuando no hay tareas */}
              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <IconComponent className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay tareas</p>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}


