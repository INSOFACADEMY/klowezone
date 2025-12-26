'use client'

import { useState, useEffect } from 'react'
import { Zap, Workflow, Bot, Plus, Play, Pause, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getWorkflows, toggleWorkflow, deleteWorkflow, createWorkflow } from './actions'
import { getTriggerDescription, getActionDescription } from '@/lib/automation-services'
import { WorkflowBuilder } from '@/components/automations/workflow-builder'

interface AutomationWorkflow {
  id: string
  name: string
  description?: string
  isActive: boolean
  trigger: string
  triggerConfig: any
  actions: Array<{
    id: string
    type: string
    config: any
    delay: number
  }>
  createdBy: string
  createdAt: Date
  updatedAt: Date
  creator: {
    firstName: string
    lastName: string
  }
  runs: Array<{
    id: string
    status: string
    createdAt: Date
  }>
  _count?: {
    runs: number
  }
}

export default function AdminAutomationsPage() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setLoading(true)
    try {
      const result = await getWorkflows()
      if (result.success) {
        setWorkflows(result.data)
      } else {
        console.error('Error loading workflows:', result.error)
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      const result = await toggleWorkflow(id, isActive)
      if (result.success) {
        await loadWorkflows()
      } else {
        console.error('Error toggling workflow:', result.error)
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleDeleteWorkflow = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este workflow?')) {
      try {
        const result = await deleteWorkflow(id)
        if (result.success) {
          await loadWorkflows()
        } else {
          console.error('Error deleting workflow:', result.error)
        }
      } catch (error) {
        console.error('Error deleting workflow:', error)
      }
    }
  }

  const handleCreateWorkflow = async (workflowData: {
    name: string
    description: string
    trigger: string
    actions: any[]
  }) => {
    try {
      const result = await createWorkflow(workflowData)
      if (result.success) {
        await loadWorkflows()
      } else {
        console.error('Error creating workflow:', result.error)
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400'
      case 'FAILED': return 'text-red-400'
      case 'PROCESSING': return 'text-blue-400'
      default: return 'text-slate-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'FAILED': return <XCircle className="w-4 h-4" />
      case 'PROCESSING': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando automatizaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Automatizaciones</h1>
          <p className="text-slate-400 mt-1">
            Configura workflows automáticos y procesos inteligentes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <WorkflowBuilder onSave={handleCreateWorkflow} />
          {editingWorkflow && (
            <WorkflowBuilder
              onSave={(data) => {
                // TODO: Implement update workflow
                console.log('Update workflow:', editingWorkflow.id, data)
                setEditingWorkflow(null)
              }}
              trigger={editingWorkflow.trigger}
            />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Workflows Activos</div>
            <Workflow className="w-8 h-8 text-blue-500/20" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {workflows.filter(w => w.isActive).length}
          </div>
          <div className="text-slate-400 text-sm">De {workflows.length} total</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Ejecuciones Hoy</div>
            <Zap className="w-8 h-8 text-emerald-500/20" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {workflows.reduce((acc, w) => acc + w.runs.filter(r => {
              const today = new Date()
              const runDate = new Date(r.createdAt)
              return runDate.toDateString() === today.toDateString()
            }).length, 0)}
          </div>
          <div className="text-slate-400 text-sm">Ejecuciones exitosas</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Tasa de Éxito</div>
            <CheckCircle className="w-8 h-8 text-green-500/20" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {workflows.length > 0 ?
              Math.round(workflows.reduce((acc, w) =>
                acc + w.runs.filter(r => r.status === 'COMPLETED').length, 0
              ) / Math.max(workflows.reduce((acc, w) => acc + w.runs.length, 0), 1) * 100) : 0}%
          </div>
          <div className="text-slate-400 text-sm">Ejecuciones completadas</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Triggers Disponibles</div>
            <Bot className="w-8 h-8 text-purple-500/20" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">7</div>
          <div className="text-slate-400 text-sm">Tipos de eventos</div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-white font-semibold">Workflows Configurados</h3>
        </div>
        <div className="p-6">
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <Workflow className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h4 className="text-white font-medium mb-2">No hay workflows configurados</h4>
              <p className="text-slate-400 mb-6">
                Crea tu primer workflow automático para empezar a automatizar procesos
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Crear Primer Workflow
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-white font-medium">{workflow.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                          workflow.isActive
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {workflow.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {workflow.description && (
                        <p className="text-slate-400 text-sm mb-3">{workflow.description}</p>
                      )}
                      <div className="flex items-center space-x-6 text-sm text-slate-400">
                        <span>📍 {getTriggerDescription(workflow.trigger)}</span>
                        <span>⚙️ {workflow.actions.length} acciones</span>
                        <span>👤 {workflow.creator.firstName} {workflow.creator.lastName}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleWorkflow(workflow.id, !workflow.isActive)}
                        className={`p-2 rounded transition-colors ${
                          workflow.isActive
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        title={workflow.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {workflow.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingWorkflow(workflow)}
                        className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions Preview */}
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-2">Acciones:</div>
                    <div className="flex flex-wrap gap-2">
                      {workflow.actions.slice(0, 3).map((action, index) => (
                        <span key={action.id} className="inline-flex items-center px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                          {index + 1}. {getActionDescription(action.type)}
                        </span>
                      ))}
                      {workflow.actions.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">
                          +{workflow.actions.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recent Runs */}
                  {workflow.runs.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Últimas ejecuciones:</div>
                      <div className="flex space-x-2">
                        {workflow.runs.slice(0, 5).map((run) => (
                          <div key={run.id} className={`flex items-center space-x-1 ${getStatusColor(run.status)}`}>
                            {getStatusIcon(run.status)}
                            <span className="text-xs">
                              {new Date(run.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Triggers */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Triggers Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Nuevo Lead', description: 'Cuando se registra un nuevo lead', icon: '👥' },
            { name: 'Cambio de Estado', description: 'Cuando cambia el estado de un proyecto', icon: '📊' },
            { name: 'Feedback Recibido', description: 'Cuando se recibe feedback', icon: '💬' },
            { name: 'Error Crítico', description: 'Cuando ocurre un error crítico', icon: '🚨' },
            { name: 'Usuario Registrado', description: 'Cuando un usuario se registra', icon: '👤' },
            { name: 'Pago Recibido', description: 'Cuando se recibe un pago', icon: '💰' },
            { name: 'Fecha Límite', description: 'Cuando se acerca una fecha límite', icon: '⏰' }
          ].map((trigger) => (
            <div key={trigger.name} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{trigger.icon}</span>
                <span className="text-white font-medium text-sm">{trigger.name}</span>
              </div>
              <p className="text-slate-400 text-xs">{trigger.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Available Actions */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Acciones Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Enviar Email', description: 'SMTP, SendGrid, Resend', icon: '📧' },
            { name: 'Notificación In-App', description: 'Crear notificación interna', icon: '🔔' },
            { name: 'Log a Slack', description: 'Enviar mensaje a webhook', icon: '💬' },
            { name: 'Análisis IA', description: 'Generar resumen con GPT', icon: '🤖' },
            { name: 'Actualizar Registro', description: 'Modificar datos en BD', icon: '📝' },
            { name: 'Crear Tarea', description: 'Agregar nueva tarea', icon: '✅' },
            { name: 'Enviar Webhook', description: 'Llamar API externa', icon: '🌐' }
          ].map((action) => (
            <div key={action.name} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{action.icon}</span>
                <span className="text-white font-medium text-sm">{action.name}</span>
              </div>
              <p className="text-slate-400 text-xs">{action.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

