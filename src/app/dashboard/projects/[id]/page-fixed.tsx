'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, AlertCircle, Calendar, DollarSign, FileText, Users } from 'lucide-react'

interface Project {
  id: string
  nombre_proyecto: string
  descripcion: string
  estado: string
  presupuesto_estimado: number
  precio_venta: number
  fecha_entrega: string
  cliente_id: string
  cliente: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simular carga de proyecto
    const loadProject = async () => {
      try {
        setLoading(true)
        // Aquí iría la lógica real para cargar el proyecto
        // Por ahora, simulamos un proyecto
        setTimeout(() => {
          setProject({
            id: projectId,
            nombre_proyecto: 'Proyecto de Ejemplo',
            descripcion: 'Este es un proyecto de ejemplo',
            estado: 'EN_PROGRESO',
            presupuesto_estimado: 5000,
            precio_venta: 7500,
            fecha_entrega: '2024-12-31',
            cliente_id: 'client-1',
            cliente: {
              firstName: 'Juan',
              lastName: 'Pérez',
              email: 'juan@example.com'
            }
          })
          setLoading(false)
        }, 1000)
      } catch (err) {
        setError('Error al cargar el proyecto')
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-900/60 backdrop-blur-lg rounded-xl border border-slate-700/50">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error || 'Proyecto no encontrado'}</p>
          <Button onClick={() => router.back()} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETADO': return 'bg-green-500'
      case 'EN_PROGRESO': return 'bg-blue-500'
      case 'PENDIENTE': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{project.nombre_proyecto}</h1>
              <p className="text-slate-400 mt-1">{project.descripcion}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(project.estado)} text-white`}>
              {project.estado}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Información del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Cliente</label>
                    <p className="font-medium">{project.cliente.firstName} {project.cliente.lastName}</p>
                    <p className="text-sm text-slate-400">{project.cliente.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Fecha de Entrega</label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.fecha_entrega).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Presupuesto Estimado</label>
                    <p className="text-2xl font-bold text-blue-400">
                      ${project.presupuesto_estimado.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Precio de Venta</label>
                    <p className="text-2xl font-bold text-green-400">
                      ${project.precio_venta.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Margen de Utilidad</span>
                    <span className="font-bold text-green-400">
                      ${((project.precio_venta - project.presupuesto_estimado)).toLocaleString()}
                      ({(((project.precio_venta - project.presupuesto_estimado) / project.presupuesto_estimado) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  Editar Proyecto
                </Button>
                <Button className="w-full" variant="outline">
                  Agregar Milestone
                </Button>
                <Button className="w-full" variant="outline">
                  Ver Documentos
                </Button>
                <Button className="w-full" variant="outline">
                  Gestionar Equipo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}




