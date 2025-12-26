'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getProjects, Project } from '@/lib/projects'
import { getUserProfile, UserProfile } from '@/lib/user-profiles'
import { supabase } from '@/lib/supabase'
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Users,
  Settings
} from 'lucide-react'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [projectsData, userData, profileData] = await Promise.all([
          getProjects(),
          supabase.auth.getUser(),
          getUserProfile()
        ])

        setProjects(projectsData)
        setFilteredProjects(projectsData)
        setUser(userData.data.user)
        setUserProfile(profileData)
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtrar proyectos
  useEffect(() => {
    let filtered = projects

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.estado === statusFilter)
    }

    setFilteredProjects(filtered)
  }, [projects, searchTerm, statusFilter])

  const getStatusColor = (status: Project['estado']) => {
    switch (status) {
      case 'Planificación': return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'En Progreso': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Completado': return 'bg-green-100 text-green-800 border-green-200'
      case 'Pausado': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: Project['prioridad']) => {
    switch (priority) {
      case 'Urgente': return 'text-red-600'
      case 'Alta': return 'text-orange-600'
      case 'Media': return 'text-yellow-600'
      case 'Baja': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold mb-2">
            Proyectos
            {userProfile && (
              <span className="text-slate-400 font-normal ml-2">
                para {userProfile.business_name}
              </span>
            )}
          </h1>
          <p className="text-slate-400">
            Gestiona tus proyectos con Kanban, equipos y visualizaciones avanzadas
          </p>
        </motion.div>

        {/* Barra de herramientas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            {/* Filtros */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Planificación">Planificación</SelectItem>
                <SelectItem value="En Progreso">En Progreso</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Controles de vista */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              className={viewMode === 'grid' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              className={viewMode === 'list' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {projects.length === 0 ? 'No tienes proyectos' : 'No se encontraron proyectos'}
            </h2>
            <p className="text-slate-400 mb-6">
              {projects.length === 0
                ? 'Crea tu primer proyecto para comenzar'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Crear Proyecto
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                className="cursor-pointer"
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white text-lg line-clamp-1 mb-1">
                          {project.nombre_proyecto}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(project.estado)}`}>
                            {project.estado}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(project.prioridad)}`}>
                            {project.prioridad}
                          </span>
                        </div>
                      </div>
                      <Settings className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                    </div>
                  </CardHeader>

                  <CardContent>
                    {project.descripcion && (
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                        {project.descripcion}
                      </p>
                    )}

                    <div className="space-y-3">
                      {/* Cliente */}
                      {project.cliente_nombre && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Users className="w-4 h-4" />
                          <span>{project.cliente_nombre}</span>
                        </div>
                      )}

                      {/* Presupuesto */}
                      {project.presupuesto && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span className="font-medium text-emerald-400">
                            ${project.presupuesto.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Fecha de entrega */}
                      {project.fecha_entrega && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>Entrega: {new Date(project.fecha_entrega).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
