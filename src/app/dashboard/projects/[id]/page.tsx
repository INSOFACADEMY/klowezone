'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getProjectById, updateProjectDetails, addProjectMilestone, getProjectDocuments, getProjectActivities, addProjectExpense, addProjectTeamMember, calculateFinancialMetrics } from './actions'
import { WhatsAppIconButton } from '@/components/ui/whatsapp-button'
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Plus,
  Upload,
  Download,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Award,
  MessageSquare,
  Paperclip,
  Target,
  User,
  Building,
  Activity,
  Users,
  Receipt,
  CreditCard
} from 'lucide-react'

interface Project {
  id: string
  nombre_proyecto: string
  descripcion?: string
  estado: string
  prioridad: string
  fecha_entrega?: string
  presupuesto_estimado?: number
  precio_venta?: number
  cliente: {
    firstName: string
    lastName: string
    email: string
    telefono?: string
  }
  owner: {
    firstName: string
    lastName: string
    email: string
    telefono?: string
  }
  documents: Array<{
    id: string
    nombre: string
    tipo: string
    url: string
    size: number
    created_at: string
  }>
  activities: Array<{
    id: string
    tipo: string
    titulo: string
    descripcion: string
    created_at: string
  }>
  expenses?: Array<{
    id: string
    descripcion: string
    monto: number
    tipo: string
    fecha_gasto: string
    comprobante?: string
    creador: {
      firstName: string
      lastName: string
    }
    aprobador?: {
      firstName: string
      lastName: string
    }
  }>
  teamMembers?: Array<{
    id: string
    rol: string
    asignado_en: string
    horas_estimadas?: number
    tarifa_hora?: number
    miembro: {
      firstName: string
      lastName: string
      email: string
    }
    asignador: {
      firstName: string
      lastName: string
    }
  }>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  console.log('🔍 ProjectDetailPage - Params received:', params)
  console.log('🔍 ProjectDetailPage - Project ID extracted:', projectId)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    nombre_proyecto: '',
    descripcion: '',
    presupuesto_estimado: '',
    precio_venta: '',
    fecha_entrega: ''
  })

  // Milestone states
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [milestoneData, setMilestoneData] = useState({
    titulo: '',
    descripcion: ''
  })

  // Expense states
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseData, setExpenseData] = useState({
    descripcion: '',
    monto: '',
    tipo: 'MATERIALES',
    fecha_gasto: new Date().toISOString().split('T')[0],
    comprobante: ''
  })

  // Team member states
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false)
  const [teamMemberData, setTeamMemberData] = useState({
    user_id: '',
    rol: 'DEVELOPER',
    horas_estimadas: '',
    tarifa_hora: ''
  })
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>>([])

  // Document states
  const [documents, setDocuments] = useState<Project['documents']>([])
  const [activities, setActivities] = useState<Project['activities']>([])
  const [expenses, setExpenses] = useState<Project['expenses']>([])
  const [teamMembers, setTeamMembers] = useState<Project['teamMembers']>([])

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      console.log('🚀 loadProjectData called with projectId:', projectId)
      setLoading(true)
      setError(null)

      const [projectResult, documentsResult, activitiesResult] = await Promise.all([
        getProjectById(projectId),
        getProjectDocuments(projectId),
        getProjectActivities(projectId)
      ])

      console.log('📡 API Results:')
      console.log('   Project result:', projectResult.success ? 'SUCCESS' : 'FAILED')
      console.log('   Documents result:', documentsResult.success ? 'SUCCESS' : 'FAILED')
      console.log('   Activities result:', activitiesResult.success ? 'SUCCESS' : 'FAILED')

      if (!projectResult.success) {
        setError(projectResult.error || 'Error loading project')
        return
      }

      if (!projectResult.success || !projectResult.data) {
        setError(projectResult.error || 'Error loading project')
        return
      }

      const projectData = projectResult.data
      setProject(projectData)
      setEditData({
        nombre_proyecto: projectData.nombre_proyecto,
        descripcion: projectData.descripcion || '',
        presupuesto_estimado: projectData.presupuesto_estimado?.toString() || '',
        precio_venta: projectData.precio_venta?.toString() || '',
        fecha_entrega: projectData.fecha_entrega ? new Date(projectData.fecha_entrega).toISOString().split('T')[0] : ''
      })

      if (documentsResult.success) {
        setDocuments(documentsResult.data || [])
      }

      if (activitiesResult.success) {
        setActivities(activitiesResult.data || [])
      }

      // Set expenses and team members from project data
      if (projectData.expenses) {
        setExpenses(projectData.expenses)
      }

      if (projectData.teamMembers) {
        setTeamMembers(projectData.teamMembers)
      }

    } catch (err) {
      console.error('Error loading project data:', err)
      setError('Error loading project data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProject = async () => {
    if (!project) return

    try {
      const updates = {
        nombre_proyecto: editData.nombre_proyecto,
        descripcion: editData.descripcion || undefined,
        presupuesto_estimado: editData.presupuesto_estimado ? parseFloat(editData.presupuesto_estimado) : undefined,
        precio_venta: editData.precio_venta ? parseFloat(editData.precio_venta) : undefined,
        fecha_entrega: editData.fecha_entrega || undefined
      }

      const result = await updateProjectDetails(project.id, updates)
      if (result.success && result.data) {
        setProject(result.data)
        setIsEditing(false)
        alert('Proyecto actualizado exitosamente')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      console.error('Error saving project:', err)
      alert('Error saving project')
    }
  }

  const handleAddMilestone = async () => {
    if (!project || !milestoneData.titulo.trim()) return

    try {
      const result = await addProjectMilestone(project.id, {
        titulo: milestoneData.titulo,
        descripcion: milestoneData.descripcion
      })

      if (result.success) {
        // Reload activities
        const activitiesResult = await getProjectActivities(project.id)
        if (activitiesResult.success) {
          setActivities(activitiesResult.data)
        }
        setShowMilestoneModal(false)
        setMilestoneData({ titulo: '', descripcion: '' })
        alert('Hito agregado exitosamente')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      console.error('Error adding milestone:', err)
      alert('Error adding milestone')
    }
  }

  const handleAddExpense = async () => {
    if (!project || !expenseData.descripcion.trim() || !expenseData.monto.trim()) return

    try {
      const result = await addProjectExpense(project.id, {
        descripcion: expenseData.descripcion,
        monto: parseFloat(expenseData.monto),
        tipo: expenseData.tipo,
        fecha_gasto: expenseData.fecha_gasto,
        comprobante: expenseData.comprobante || undefined
      })

      if (result.success) {
        // Reload project data to get updated expenses
        const projectResult = await getProjectById(projectId)
        if (projectResult.success && projectResult.data) {
          const updatedProject = projectResult.data
          if (updatedProject.expenses) {
            setExpenses(updatedProject.expenses)
          }
          // Reload activities too since we create an activity when adding expense
          const activitiesResult = await getProjectActivities(project.id)
          if (activitiesResult.success) {
            setActivities(activitiesResult.data || [])
          }
        }
        setShowExpenseModal(false)
        setExpenseData({
          descripcion: '',
          monto: '',
          tipo: 'MATERIALES',
          fecha_gasto: new Date().toISOString().split('T')[0],
          comprobante: ''
        })
        alert('Gasto agregado exitosamente')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      console.error('Error adding expense:', err)
      alert('Error adding expense')
    }
  }

  const handleAddTeamMember = async () => {
    if (!project || !teamMemberData.user_id.trim()) return

    try {
      const result = await addProjectTeamMember(project.id, {
        user_id: teamMemberData.user_id,
        rol: teamMemberData.rol,
        horas_estimadas: teamMemberData.horas_estimadas ? parseInt(teamMemberData.horas_estimadas) : undefined,
        tarifa_hora: teamMemberData.tarifa_hora ? parseFloat(teamMemberData.tarifa_hora) : undefined
      })

      if (result.success) {
        // Reload project data to get updated team members
        const projectResult = await getProjectById(projectId)
        if (projectResult.success && projectResult.data) {
          const updatedProject = projectResult.data
          if (updatedProject.teamMembers) {
            setTeamMembers(updatedProject.teamMembers)
          }
          // Reload activities too since we create an activity when adding member
          const activitiesResult = await getProjectActivities(project.id)
          if (activitiesResult.success) {
            setActivities(activitiesResult.data || [])
          }
        }
        setShowTeamMemberModal(false)
        setTeamMemberData({
          user_id: '',
          rol: 'DEVELOPER',
          horas_estimadas: '',
          tarifa_hora: ''
        })
        alert('Miembro agregado exitosamente')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      console.error('Error adding team member:', err)
      alert('Error adding team member')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANIFICACION': return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'EN_PROGRESO': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETADO': return 'bg-green-100 text-green-800 border-green-200'
      case 'PAUSADO': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENTE': return 'text-red-600'
      case 'ALTA': return 'text-orange-600'
      case 'MEDIA': return 'text-yellow-600'
      case 'BAJA': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getDocumentIcon = (tipo: string) => {
    switch (tipo) {
      case 'CONTRATO': return <FileText className="w-5 h-5 text-emerald-400" />
      case 'PROPUESTA': return <FileText className="w-5 h-5 text-blue-400" />
      case 'FACTURA': return <FileText className="w-5 h-5 text-purple-400" />
      default: return <FileText className="w-5 h-5 text-slate-400" />
    }
  }

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'EMAIL': return <MessageSquare className="w-4 h-4" />
      case 'PAYMENT': return <DollarSign className="w-4 h-4" />
      case 'TASK_UPDATE': return <CheckCircle className="w-4 h-4" />
      case 'MEETING': return <Calendar className="w-4 h-4" />
      case 'DOCUMENT': return <FileText className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

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
              onClick={() => router.push('/dashboard/projects')}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Proyectos
            </Button>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Klowezone
                  </span>
                  <span className="text-xs text-slate-100 bg-slate-700 border border-slate-600 px-2 py-1 rounded-full">
                    Central del Proyecto
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-100 mt-1">{project.nombre_proyecto}</h1>
                <p className="text-slate-400">Gestión completa del proyecto</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${getStatusColor(project.estado)}`}>
                {project.estado.replace('_', ' ')}
              </Badge>
              <span className={`text-sm font-medium ${getPriorityColor(project.prioridad)}`}>
                {project.prioridad}
              </span>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Financial Dashboard */}
        {project && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Dashboard Financiero
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Control y seguimiento financiero del proyecto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const metrics = calculateFinancialMetrics(project)
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Precio de Venta */}
                      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-emerald-400 font-medium">Precio de Venta</span>
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">
                          ${metrics.precioVenta.toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-300/70 mt-1">
                          Ingreso total del proyecto
                        </div>
                      </div>

                      {/* Gastos Totales */}
                      <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-red-400 font-medium">Gastos Totales</span>
                          <Receipt className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="text-2xl font-bold text-red-400">
                          ${metrics.gastosTotales.toLocaleString()}
                        </div>
                        <div className="text-xs text-red-300/70 mt-1">
                          {metrics.presupuestoEstimado > 0 && (
                            <span>
                              {metrics.presupuestoConsumido.toFixed(1)}% del presupuesto
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Utilidad Neta */}
                      <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                        metrics.utilidadPositiva
                          ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
                          : 'from-red-500/20 to-red-600/20 border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            metrics.utilidadPositiva ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            Utilidad Neta
                          </span>
                          <Award className={`w-5 h-5 ${
                            metrics.utilidadPositiva ? 'text-blue-400' : 'text-red-400'
                          }`} />
                        </div>
                        <div className={`text-2xl font-bold ${
                          metrics.utilidadPositiva ? 'text-blue-400' : 'text-red-400'
                        }`}>
                          ${metrics.utilidadReal.toLocaleString()}
                        </div>
                        <div className={`text-xs mt-1 ${
                          metrics.margenSaludable ? 'text-blue-300/70' : 'text-red-300/70'
                        }`}>
                          {metrics.margenGanancia.toFixed(1)}% margen de ganancia
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Barra de Salud Financiera */}
                {(() => {
                  const metrics = calculateFinancialMetrics(project)
                  if (metrics.presupuestoEstimado === 0) return null

                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">Salud Financiera</span>
                        <span className={`font-medium ${
                          metrics.estaEnPresupuesto ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {metrics.presupuestoConsumido.toFixed(1)}% consumido
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            metrics.presupuestoConsumido <= 80 ? 'bg-emerald-500' :
                            metrics.presupuestoConsumido <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(metrics.presupuestoConsumido, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Presupuesto: ${metrics.presupuestoEstimado.toLocaleString()}</span>
                        <span className={metrics.estaEnPresupuesto ? 'text-emerald-400' : 'text-red-400'}>
                          Restante: ${metrics.presupuestoRestante.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Project Details Editor */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Edit className="w-5 h-5 text-indigo-400" />
                  Editar Detalles del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre del Proyecto
                    </label>
                    <Input
                      value={editData.nombre_proyecto}
                      onChange={(e) => setEditData(prev => ({ ...prev, nombre_proyecto: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Precio de Venta
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.precio_venta}
                      onChange={(e) => setEditData(prev => ({ ...prev, precio_venta: e.target.value }))}
                      placeholder="0.00"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Presupuesto Estimado
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.presupuesto_estimado}
                      onChange={(e) => setEditData(prev => ({ ...prev, presupuesto_estimado: e.target.value }))}
                      placeholder="0.00"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fecha de Entrega
                    </label>
                    <Input
                      type="date"
                      value={editData.fecha_entrega}
                      onChange={(e) => setEditData(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción
                  </label>
                  <Textarea
                    value={editData.descripcion}
                    onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={3}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha de Entrega
                  </label>
                  <Input
                    type="date"
                    value={editData.fecha_entrega}
                    onChange={(e) => setEditData(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveProject} className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setEditData({
                        nombre_proyecto: project.nombre_proyecto,
                        descripcion: project.descripcion || '',
                        presupuesto_estimado: project.presupuesto_estimado?.toString() || '',
                        precio_venta: project.precio_venta?.toString() || '',
                        fecha_entrega: project.fecha_entrega ? new Date(project.fecha_entrega).toISOString().split('T')[0] : ''
                      })
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Building className="w-5 h-5 text-indigo-400" />
                    Información del Proyecto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Cliente</p>
                        <p className="text-slate-100">{project.cliente.firstName} {project.cliente.lastName}</p>
                        <p className="text-xs text-slate-500">{project.cliente.email}</p>
                        {project.cliente.telefono && (
                          <div className="mt-1">
                            <WhatsAppIconButton
                              telefono={project.cliente.telefono}
                              clientName={`${project.cliente.firstName} ${project.cliente.lastName}`}
                              templateKey="welcome"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Propietario</p>
                        <p className="text-slate-100">{project.owner.firstName} {project.owner.lastName}</p>
                        <p className="text-xs text-slate-500">{project.owner.email}</p>
                        {project.owner.telefono && (
                          <div className="mt-1">
                            <WhatsAppIconButton
                              telefono={project.owner.telefono}
                              clientName={`${project.owner.firstName} ${project.owner.lastName}`}
                              templateKey="projectUpdate"
                              templateParams={[project.nombre_proyecto, project.estado]}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {project.descripcion && (
                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-sm text-slate-400 mb-2">Descripción</p>
                      <p className="text-slate-100">{project.descripcion}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    {project.presupuesto && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-slate-400">Presupuesto:</span>
                        <span className="text-emerald-400 font-medium">${project.presupuesto.toLocaleString()}</span>
                      </div>
                    )}
                    {project.fecha_entrega && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-400">Entrega:</span>
                        <span className="text-blue-400">{new Date(project.fecha_entrega).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-400">Prioridad:</span>
                      <span className={`font-medium ${getPriorityColor(project.prioridad)}`}>{project.prioridad}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Milestones Manager */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <Star className="w-5 h-5 text-indigo-400" />
                      Gestor de Hitos
                    </CardTitle>
                    <Dialog open={showMilestoneModal} onOpenChange={setShowMilestoneModal}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Hito
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-slate-100">Agregar Nuevo Hito</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Título del Hito
                            </label>
                            <Input
                              value={milestoneData.titulo}
                              onChange={(e) => setMilestoneData(prev => ({ ...prev, titulo: e.target.value }))}
                              placeholder="Ej: Revisión final completada"
                              className="bg-slate-800 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Descripción
                            </label>
                            <Textarea
                              value={milestoneData.descripcion}
                              onChange={(e) => setMilestoneData(prev => ({ ...prev, descripcion: e.target.value }))}
                              placeholder="Detalles del hito completado..."
                              rows={3}
                              className="bg-slate-800 border-slate-600 text-white"
                            />
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button onClick={handleAddMilestone} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                              Agregar Hito
                            </Button>
                            <Button
                              onClick={() => {
                                setShowMilestoneModal(false)
                                setMilestoneData({ titulo: '', descripcion: '' })
                              }}
                              variant="outline"
                              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.length > 0 ? (
                      activities.slice(0, 5).map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                        >
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-100 mb-1">{activity.titulo}</h4>
                            <p className="text-sm text-slate-400 mb-2">{activity.descripcion}</p>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                ✓ Completado
                              </Badge>
                              {project.cliente.telefono && (
                                <WhatsAppIconButton
                                  telefono={project.cliente.telefono}
                                  clientName={`${project.cliente.firstName} ${project.cliente.lastName}`}
                                  templateKey="milestoneCompleted"
                                  templateParams={[activity.titulo]}
                                  size="sm"
                                />
                              )}
                              <span className="text-xs text-slate-500">
                                {new Date(activity.created_at).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Star className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No hay hitos completados aún</p>
                        <p className="text-slate-500 text-xs mt-1">
                          Usa el botón "Marcar Hito" para registrar tareas completadas
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Vault */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Paperclip className="w-5 h-5 text-indigo-400" />
                    Document Vault
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Archivos vinculados a este proyecto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.length > 0 ? (
                      documents.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getDocumentIcon(doc.tipo)}
                            <div>
                              <p className="text-sm font-medium text-slate-100">{doc.nombre}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(doc.created_at).toLocaleDateString('es-ES')}
                                {doc.size && ` • ${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-100 hover:bg-slate-800">
                            <Download className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No hay documentos</p>
                        <Button className="mt-3" variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Documento
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Project Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-slate-100">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        Control de Gastos
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Gastos asociados al proyecto
                      </CardDescription>
                    </div>
                    <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800">
                          <Plus className="w-4 h-4 mr-2" />
                          Registrar Gasto
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-slate-100 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-emerald-400" />
                            Registrar Nuevo Gasto
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Descripción del Gasto *
                              </label>
                              <Input
                                value={expenseData.descripcion}
                                onChange={(e) => setExpenseData(prev => ({ ...prev, descripcion: e.target.value }))}
                                placeholder="Ej: Compra de materiales para el proyecto"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Monto *
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={expenseData.monto}
                                onChange={(e) => setExpenseData(prev => ({ ...prev, monto: e.target.value }))}
                                placeholder="0.00"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Categoría *
                              </label>
                              <Select value={expenseData.tipo} onValueChange={(value) => setExpenseData(prev => ({ ...prev, tipo: value }))}>
                                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                  <SelectItem value="MATERIALES">🏗️ Materiales</SelectItem>
                                  <SelectItem value="PERSONAL">👥 Personal</SelectItem>
                                  <SelectItem value="TRANSPORTE">🚛 Transporte</SelectItem>
                                  <SelectItem value="HERRAMIENTAS">🔧 Herramientas</SelectItem>
                                  <SelectItem value="MARKETING">📢 Marketing</SelectItem>
                                  <SelectItem value="LEGAL">⚖️ Legal</SelectItem>
                                  <SelectItem value="OTROS">📝 Otros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Fecha del Gasto *
                              </label>
                              <Input
                                type="date"
                                value={expenseData.fecha_gasto}
                                onChange={(e) => setExpenseData(prev => ({ ...prev, fecha_gasto: e.target.value }))}
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                URL del Comprobante
                              </label>
                              <Input
                                value={expenseData.comprobante}
                                onChange={(e) => setExpenseData(prev => ({ ...prev, comprobante: e.target.value }))}
                                placeholder="https://..."
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                          </div>

                          {/* Preview del impacto financiero */}
                          {expenseData.monto && project && (
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                              <h4 className="text-sm font-medium text-slate-300 mb-3">Vista Previa del Impacto</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">Nuevo gasto:</span>
                                  <span className="text-red-400 font-medium ml-2">${parseFloat(expenseData.monto).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Total después:</span>
                                  <span className="text-slate-300 font-medium ml-2">
                                    ${(expenses.reduce((total, expense) => total + expense.monto, 0) + parseFloat(expenseData.monto || '0')).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleAddExpense}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              disabled={!expenseData.descripcion.trim() || !expenseData.monto.trim()}
                            >
                              <Receipt className="w-4 h-4 mr-2" />
                              Registrar Gasto
                            </Button>
                            <Button
                              onClick={() => {
                                setShowExpenseModal(false)
                                setExpenseData({
                                  descripcion: '',
                                  monto: '',
                                  tipo: 'MATERIALES',
                                  fecha_gasto: new Date().toISOString().split('T')[0],
                                  comprobante: ''
                                })
                              }}
                              variant="outline"
                              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>

              {/* Resumen financiero detallado */}
              {expenses.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Total Gastos</p>
                      <p className="text-lg font-bold text-red-400">
                        ${expenses.reduce((total, expense) => total + expense.monto, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Promedio por Gasto</p>
                      <p className="text-lg font-bold text-slate-300">
                        ${(expenses.reduce((total, expense) => total + expense.monto, 0) / expenses.length).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Gastos este Mes</p>
                      <p className="text-lg font-bold text-blue-400">
                        ${expenses
                          .filter(expense => {
                            const expenseDate = new Date(expense.fecha_gasto)
                            const now = new Date()
                            return expenseDate.getMonth() === now.getMonth() &&
                                   expenseDate.getFullYear() === now.getFullYear()
                          })
                          .reduce((total, expense) => total + expense.monto, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Document Vault */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Paperclip className="w-5 h-5 text-indigo-400" />
                Document Vault
              </CardTitle>
              <CardDescription className="text-slate-400">
                Archivos vinculados a este proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.length > 0 ? (
                  documents.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getDocumentIcon(doc.tipo)}
                        <div>
                          <p className="text-sm font-medium text-slate-100">{doc.nombre}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(doc.created_at).toLocaleDateString('es-ES')}
                            {doc.size && ` • ${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-100 hover:bg-slate-800">
                        <Download className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No hay documentos</p>
                    <Button className="mt-3" variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Documento
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Control de Gastos
              </CardTitle>
              <CardDescription className="text-slate-400">
                Gastos asociados al proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.length > 0 ? (
                  <>
                    {expenses.slice(0, 5).map((expense, index) => (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <Receipt className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-100">{expense.descripcion}</p>
                            <p className="text-xs text-slate-400">
                              {expense.tipo} • {new Date(expense.fecha_gasto).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-emerald-400">${expense.monto.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">
                            por {expense.creador.firstName}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {expenses.length > 5 && (
                      <div className="text-center pt-2">
                        <p className="text-xs text-slate-500">
                          +{expenses.length - 5} gastos más
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Total Gastos:</span>
                        <span className="text-lg font-bold text-emerald-400">
                          ${expenses.reduce((total, expense) => total + expense.monto, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No hay gastos registrados</p>
                    <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
                      <DialogTrigger asChild>
                        <Button className="mt-3" variant="outline" size="sm">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Agregar Gasto
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-slate-100 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-emerald-400" />
                            Registrar Nuevo Gasto
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Descripción del Gasto *
                              </label>
                              <Input
                                value={expenseData.descripcion}
                                onChange={(e) => setExpenseData(prev => ({ ...prev, descripcion: e.target.value }))}
                                placeholder="Ej: Compra de materiales para el proyecto"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Monto *
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={expenseData.monto}
                                onChange={(e) => setExpenseData(prev => ({ ...prev, monto: e.target.value }))}
                                placeholder="0.00"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Categoría *
                              </label>
                              <Select value={expenseData.tipo} onValueChange={(value) => setExpenseData(prev => ({ ...prev, tipo: value }))}>
                                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                  <SelectItem value="MATERIALES">🏗️ Materiales</SelectItem>
                                  <SelectItem value="PERSONAL">👥 Personal</SelectItem>
                                  <SelectItem value="TRANSPORTE">🚛 Transporte</SelectItem>
                                  <SelectItem value="HERRAMIENTAS">🔧 Herramientas</SelectItem>
                                  <SelectItem value="MARKETING">📢 Marketing</SelectItem>
                                  <SelectItem value="LEGAL">⚖️ Legal</SelectItem>
                                  <SelectItem value="OTROS">📝 Otros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Fecha del Gasto *
                              </label>
                              <Input
                                type="date"
                                value={expenseData.fecha_gasto}
                                onChange={(e) => setExpenseData(prev => ({ ...prev, fecha_gasto: e.target.value }))}
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                URL del Comprobante
                              </label>
                              <Input
                                value={expenseData.comprobante}
                                onChange={(e) => setExpenseData(prev => ({ ...prev, comprobante: e.target.value }))}
                                placeholder="https://..."
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                          </div>

                          {/* Preview del impacto financiero */}
                          {expenseData.monto && project && (
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                              <h4 className="text-sm font-medium text-slate-300 mb-3">Vista Previa del Impacto</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">Nuevo gasto:</span>
                                  <span className="text-red-400 font-medium ml-2">${parseFloat(expenseData.monto).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Total después:</span>
                                  <span className="text-slate-300 font-medium ml-2">
                                    ${(expenses.reduce((total, expense) => total + expense.monto, 0) + parseFloat(expenseData.monto || '0')).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleAddExpense}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              disabled={!expenseData.descripcion.trim() || !expenseData.monto.trim()}
                            >
                              <Receipt className="w-4 h-4 mr-2" />
                              Registrar Gasto
                            </Button>
                            <Button
                              onClick={() => {
                                setShowExpenseModal(false)
                                setExpenseData({
                                  descripcion: '',
                                  monto: '',
                                  tipo: 'MATERIALES',
                                  fecha_gasto: new Date().toISOString().split('T')[0],
                                  comprobante: ''
                                })
                              }}
                              variant="outline"
                              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Users className="w-5 h-5 text-indigo-400" />
                Equipo del Proyecto
              </CardTitle>
              <CardDescription className="text-slate-400">
                Miembros asignados al proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                    >
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100">
                          {member.miembro.firstName} {member.miembro.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{member.miembro.email}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {member.rol.replace('_', ' ').toLowerCase()}
                          {member.horas_estimadas && ` • ${member.horas_estimadas}h`}
                        </p>
                      </div>
                      {member.tarifa_hora && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">${member.tarifa_hora}/h</p>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No hay miembros en el equipo</p>
                    <Dialog open={showTeamMemberModal} onOpenChange={setShowTeamMemberModal}>
                      <DialogTrigger asChild>
                        <Button className="mt-3" variant="outline" size="sm">
                          <User className="w-4 h-4 mr-2" />
                          Agregar Miembro
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-slate-100">Agregar Miembro al Equipo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Seleccionar Usuario
                            </label>
                            <Select value={teamMemberData.user_id} onValueChange={(value) => setTeamMemberData(prev => ({ ...prev, user_id: value }))}>
                              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                <SelectValue placeholder="Seleccionar usuario..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {/* TODO: Load available users from database */}
                                <SelectItem value="user1">Juan Pérez (juan@example.com)</SelectItem>
                                <SelectItem value="user2">María García (maria@example.com)</SelectItem>
                                <SelectItem value="user3">Carlos Rodríguez (carlos@example.com)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Rol en el Proyecto
                            </label>
                            <Select value={teamMemberData.rol} onValueChange={(value) => setTeamMemberData(prev => ({ ...prev, rol: value }))}>
                              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                                <SelectItem value="DEVELOPER">Developer</SelectItem>
                                <SelectItem value="DESIGNER">Designer</SelectItem>
                                <SelectItem value="QA_TESTER">QA Tester</SelectItem>
                                <SelectItem value="BUSINESS_ANALYST">Business Analyst</SelectItem>
                                <SelectItem value="DEVOPS">DevOps</SelectItem>
                                <SelectItem value="CONSULTANT">Consultant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Horas Estimadas (opcional)
                              </label>
                              <Input
                                type="number"
                                value={teamMemberData.horas_estimadas}
                                onChange={(e) => setTeamMemberData(prev => ({ ...prev, horas_estimadas: e.target.value }))}
                                placeholder="80"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Tarifa por Hora (opcional)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={teamMemberData.tarifa_hora}
                                onChange={(e) => setTeamMemberData(prev => ({ ...prev, tarifa_hora: e.target.value }))}
                                placeholder="50.00"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button onClick={handleAddTeamMember} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                              Agregar Miembro
                            </Button>
                            <Button
                              onClick={() => {
                                setShowTeamMemberModal(false)
                                setTeamMemberData({
                                  user_id: '',
                                  rol: 'DEVELOPER',
                                  horas_estimadas: '',
                                  tarifa_hora: ''
                                })
                              }}
                              variant="outline"
                              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Clock className="w-5 h-5 text-indigo-400" />
                Timeline de Actividad
              </CardTitle>
              <CardDescription className="text-slate-400">
                Últimas actividades del proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100">{activity.titulo}</p>
                      <p className="text-sm text-slate-400">{activity.descripcion}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(activity.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  </div>
</div>
)
}
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Descripción del Gasto *
                                  </label>
                                  <Input
                                    value={expenseData.descripcion}
                                    onChange={(e) => setExpenseData(prev => ({ ...prev, descripcion: e.target.value }))}
                                    placeholder="Ej: Compra de materiales para el proyecto"
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Monto *
                                  </label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={expenseData.monto}
                                    onChange={(e) => setExpenseData(prev => ({ ...prev, monto: e.target.value }))}
                                    placeholder="0.00"
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Categoría *
                                  </label>
                                  <Select value={expenseData.tipo} onValueChange={(value) => setExpenseData(prev => ({ ...prev, tipo: value }))}>
                                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-600">
                                      <SelectItem value="MATERIALES">🏗️ Materiales</SelectItem>
                                      <SelectItem value="PERSONAL">👥 Personal</SelectItem>
                                      <SelectItem value="TRANSPORTE">🚛 Transporte</SelectItem>
                                      <SelectItem value="HERRAMIENTAS">🔧 Herramientas</SelectItem>
                                      <SelectItem value="MARKETING">📢 Marketing</SelectItem>
                                      <SelectItem value="LEGAL">⚖️ Legal</SelectItem>
                                      <SelectItem value="OTROS">📝 Otros</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Fecha del Gasto *
                                  </label>
                                  <Input
                                    type="date"
                                    value={expenseData.fecha_gasto}
                                    onChange={(e) => setExpenseData(prev => ({ ...prev, fecha_gasto: e.target.value }))}
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    URL del Comprobante
                                  </label>
                                  <Input
                                    value={expenseData.comprobante}
                                    onChange={(e) => setExpenseData(prev => ({ ...prev, comprobante: e.target.value }))}
                                    placeholder="https://..."
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                              </div>

                              {/* Preview del impacto financiero */}
                              {expenseData.monto && project && (
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                  <h4 className="text-sm font-medium text-slate-300 mb-3">Vista Previa del Impacto</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-slate-400">Nuevo gasto:</span>
                                      <span className="text-red-400 font-medium ml-2">${parseFloat(expenseData.monto).toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Total después:</span>
                                      <span className="text-slate-300 font-medium ml-2">
                                        ${(expenses.reduce((total, expense) => total + expense.monto, 0) + parseFloat(expenseData.monto || '0')).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-3 pt-4">
                                <Button
                                  onClick={handleAddExpense}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                  disabled={!expenseData.descripcion.trim() || !expenseData.monto.trim()}
                                >
                                  <Receipt className="w-4 h-4 mr-2" />
                                  Registrar Gasto
                                </Button>
                                <Button
                                  onClick={() => {
                                    setShowExpenseModal(false)
                                    setExpenseData({
                                      descripcion: '',
                                      monto: '',
                                      tipo: 'MATERIALES',
                                      fecha_gasto: new Date().toISOString().split('T')[0],
                                      comprobante: ''
                                    })
                                  }}
                                  variant="outline"
                                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Project Team */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Equipo del Proyecto
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Miembros asignados al proyecto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member, index) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                        >
                          <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-100">
                              {member.miembro.firstName} {member.miembro.lastName}
                            </p>
                            <p className="text-xs text-slate-400">{member.miembro.email}</p>
                            <p className="text-xs text-slate-500 capitalize">
                              {member.rol.replace('_', ' ').toLowerCase()}
                              {member.horas_estimadas && ` • ${member.horas_estimadas}h`}
                            </p>
                          </div>
                          {member.tarifa_hora && (
                            <div className="text-right">
                              <p className="text-xs text-slate-400">${member.tarifa_hora}/h</p>
                            </div>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No hay miembros en el equipo</p>
                        <Dialog open={showTeamMemberModal} onOpenChange={setShowTeamMemberModal}>
                          <DialogTrigger asChild>
                            <Button className="mt-3" variant="outline" size="sm">
                              <User className="w-4 h-4 mr-2" />
                              Agregar Miembro
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-slate-700">
                            <DialogHeader>
                              <DialogTitle className="text-slate-100">Agregar Miembro al Equipo</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                  Seleccionar Usuario
                                </label>
                                <Select value={teamMemberData.user_id} onValueChange={(value) => setTeamMemberData(prev => ({ ...prev, user_id: value }))}>
                                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                    <SelectValue placeholder="Seleccionar usuario..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-600">
                                    {/* TODO: Load available users from database */}
                                    <SelectItem value="user1">Juan Pérez (juan@example.com)</SelectItem>
                                    <SelectItem value="user2">María García (maria@example.com)</SelectItem>
                                    <SelectItem value="user3">Carlos Rodríguez (carlos@example.com)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                  Rol en el Proyecto
                                </label>
                                <Select value={teamMemberData.rol} onValueChange={(value) => setTeamMemberData(prev => ({ ...prev, rol: value }))}>
                                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-600">
                                    <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                                    <SelectItem value="DEVELOPER">Developer</SelectItem>
                                    <SelectItem value="DESIGNER">Designer</SelectItem>
                                    <SelectItem value="QA_TESTER">QA Tester</SelectItem>
                                    <SelectItem value="BUSINESS_ANALYST">Business Analyst</SelectItem>
                                    <SelectItem value="DEVOPS">DevOps</SelectItem>
                                    <SelectItem value="CONSULTANT">Consultant</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Horas Estimadas (opcional)
                                  </label>
                                  <Input
                                    type="number"
                                    value={teamMemberData.horas_estimadas}
                                    onChange={(e) => setTeamMemberData(prev => ({ ...prev, horas_estimadas: e.target.value }))}
                                    placeholder="80"
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tarifa por Hora (opcional)
                                  </label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={teamMemberData.tarifa_hora}
                                    onChange={(e) => setTeamMemberData(prev => ({ ...prev, tarifa_hora: e.target.value }))}
                                    placeholder="50.00"
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3 pt-4">
                                <Button onClick={handleAddTeamMember} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                                  Agregar Miembro
                                </Button>
                                <Button
                                  onClick={() => {
                                    setShowTeamMemberModal(false)
                                    setTeamMemberData({
                                      user_id: '',
                                      rol: 'DEVELOPER',
                                      horas_estimadas: '',
                                      tarifa_hora: ''
                                    })
                                  }}
                                  variant="outline"
                                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    Timeline de Actividad
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Últimas actividades del proyecto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.slice(0, 10).map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100">{activity.titulo}</p>
                          <p className="text-sm text-slate-400">{activity.descripcion}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(activity.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}