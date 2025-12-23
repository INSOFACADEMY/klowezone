'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTimer } from '@/hooks/use-timer'
import { getActiveTimeEntries } from '@/lib/time-tracking'
import { getTasksByProject } from '@/lib/tasks'
import { getProjects, Project } from '@/lib/projects'
import { Task } from '@/lib/tasks'
import {
  Play,
  Pause,
  Square,
  Clock,
  ChevronUp,
  ChevronDown,
  Settings,
  X,
  Timer as TimerIcon
} from 'lucide-react'

export function FloatingTimer() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Configuración del timer
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [description, setDescription] = useState('')

  // Datos
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeEntries, setActiveEntries] = useState<any[]>([])

  // Timer hook
  const timer = useTimer({
    projectId: selectedProject,
    taskId: selectedTask || undefined,
    description: description || undefined
  })

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, activeEntriesData] = await Promise.all([
          getProjects(),
          getActiveTimeEntries()
        ])

        setProjects(projectsData)
        setActiveEntries(activeEntriesData)

        // Si hay entradas activas, mostrar el timer
        if (activeEntriesData.length > 0) {
          setIsVisible(true)
        }
      } catch (error) {
        console.error('Error loading timer data:', error)
      }
    }

    loadData()
  }, [])

  // Cargar tareas cuando se selecciona un proyecto
  useEffect(() => {
    const loadTasks = async () => {
      if (selectedProject) {
        try {
          const tasksData = await getTasksByProject(selectedProject)
          setTasks(tasksData)
        } catch (error) {
          console.error('Error loading tasks:', error)
        }
      } else {
        setTasks([])
      }
    }

    loadTasks()
  }, [selectedProject])

  // Auto-mostrar si hay timers activos
  useEffect(() => {
    if (activeEntries.length > 0 && !isVisible) {
      setIsVisible(true)
    }
  }, [activeEntries, isVisible])

  const handleStartTimer = async () => {
    if (!selectedProject) {
      alert('Selecciona un proyecto primero')
      return
    }

    try {
      await timer.startTimer()
      setShowSettings(false)
    } catch (error) {
      console.error('Error starting timer:', error)
      alert('Error al iniciar el timer')
    }
  }

  const handleStopTimer = async () => {
    try {
      await timer.stopTimer()
      // Limpiar configuración
      setSelectedProject('')
      setSelectedTask('')
      setDescription('')
    } catch (error) {
      console.error('Error stopping timer:', error)
      alert('Error al detener el timer')
    }
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized)
  }

  // Si no hay timers activos y está oculto, mostrar solo el botón flotante
  if (!isVisible && activeEntries.length === 0) {
    return (
      <motion.button
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-50"
        onClick={toggleVisibility}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <TimerIcon className="w-6 h-6" />
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <Card className="w-80 bg-white shadow-2xl border-2 border-gray-200">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Time Tracker</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMinimized}
                    className="h-8 w-8 p-0"
                  >
                    {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVisible(false)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Timer Display */}
                    <div className="text-center">
                      <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
                        {timer.formattedTime}
                      </div>
                      <div className="text-sm text-gray-600">
                        {timer.isRunning ? '⏱️ Registrando tiempo' : '⏸️ Detenido'}
                      </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex justify-center gap-2">
                      {!timer.isRunning ? (
                        <Button
                          onClick={handleStartTimer}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={!selectedProject}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={timer.pauseTimer}
                            variant="outline"
                            size="sm"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Pausar
                          </Button>
                          <Button
                            onClick={handleStopTimer}
                            variant="destructive"
                            size="sm"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Detener
                          </Button>
                        </>
                      )}

                      <Button
                        onClick={() => setShowSettings(!showSettings)}
                        variant="outline"
                        size="sm"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Settings Panel */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 pt-3 border-t border-gray-200"
                        >
                          {/* Proyecto */}
                          <div>
                            <Label className="text-sm font-medium">Proyecto</Label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona proyecto" />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id!}>
                                    {project.nombre_proyecto}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Tarea (opcional) */}
                          {selectedProject && (
                            <div>
                              <Label className="text-sm font-medium">Tarea (opcional)</Label>
                              <Select value={selectedTask} onValueChange={setSelectedTask}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecciona tarea" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Sin tarea específica</SelectItem>
                                  {tasks.map((task) => (
                                    <SelectItem key={task.id} value={task.id!}>
                                      {task.titulo}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Descripción */}
                          <div>
                            <Label className="text-sm font-medium">Descripción (opcional)</Label>
                            <Input
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="¿Qué estás trabajando?"
                              className="w-full"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Active Entries */}
                    {activeEntries.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Timers Activos
                        </div>
                        <div className="space-y-2">
                          {activeEntries.slice(0, 2).map((entry: any) => (
                            <div key={entry.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {entry.tareas?.titulo || entry.descripcion || 'Trabajo general'}
                            </div>
                          ))}
                          {activeEntries.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{activeEntries.length - 2} más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
