'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Zap, Bot, Mail, MessageSquare, Database, Webhook, Clock } from 'lucide-react'

interface WorkflowAction {
  id: string
  type: string
  config: Record<string, any>
  delay: number
}

interface WorkflowBuilderProps {
  onSave: (workflow: {
    name: string
    description: string
    trigger: string
    actions: WorkflowAction[]
  }) => void
  trigger?: string
}

const TRIGGER_OPTIONS = [
  { value: 'NEW_LEAD', label: 'Nuevo Lead', description: 'Cuando se registra un nuevo lead' },
  { value: 'PROJECT_STATUS_CHANGE', label: 'Cambio de Estado', description: 'Cuando cambia el estado de un proyecto' },
  { value: 'FEEDBACK_RECEIVED', label: 'Feedback Recibido', description: 'Cuando se recibe feedback' },
  { value: 'CRITICAL_ERROR', label: 'Error Crítico', description: 'Cuando ocurre un error crítico' },
  { value: 'USER_REGISTERED', label: 'Usuario Registrado', description: 'Cuando un usuario se registra' },
  { value: 'PAYMENT_RECEIVED', label: 'Pago Recibido', description: 'Cuando se recibe un pago' },
  { value: 'DEADLINE_APPROACHING', label: 'Fecha Límite', description: 'Cuando se acerca una fecha límite' }
]

const ACTION_OPTIONS = [
  { value: 'SEND_EMAIL', label: 'Enviar Email', icon: Mail, description: 'SMTP, SendGrid, Resend' },
  { value: 'CREATE_NOTIFICATION', label: 'Notificación In-App', icon: MessageSquare, description: 'Crear notificación interna' },
  { value: 'LOG_TO_SLACK', label: 'Log a Slack', icon: MessageSquare, description: 'Enviar mensaje a webhook' },
  { value: 'UPDATE_RECORD', label: 'Actualizar Registro', icon: Database, description: 'Modificar datos en BD' },
  { value: 'CREATE_TASK', label: 'Crear Tarea', icon: Clock, description: 'Agregar nueva tarea' },
  { value: 'RUN_AI_ANALYSIS', label: 'Análisis IA', icon: Bot, description: 'Generar resumen con GPT' },
  { value: 'SEND_WEBHOOK', label: 'Enviar Webhook', icon: Webhook, description: 'Llamar API externa' }
]

export function WorkflowBuilder({ onSave, trigger }: WorkflowBuilderProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTrigger, setSelectedTrigger] = useState(trigger || '')
  const [actions, setActions] = useState<WorkflowAction[]>([])

  const addAction = (actionType: string) => {
    const newAction: WorkflowAction = {
      id: `action-${Date.now()}`,
      type: actionType,
      config: {},
      delay: 0
    }
    setActions([...actions, newAction])
  }

  const removeAction = (actionId: string) => {
    setActions(actions.filter(a => a.id !== actionId))
  }

  const updateActionConfig = (actionId: string, config: Record<string, any>) => {
    setActions(actions.map(a =>
      a.id === actionId ? { ...a, config: { ...a.config, ...config } } : a
    ))
  }

  const updateActionDelay = (actionId: string, delay: number) => {
    setActions(actions.map(a =>
      a.id === actionId ? { ...a, delay } : a
    ))
  }

  const handleSave = () => {
    if (!name || !selectedTrigger || actions.length === 0) return

    onSave({
      name,
      description,
      trigger: selectedTrigger,
      actions
    })

    // Reset form
    setName('')
    setDescription('')
    setSelectedTrigger('')
    setActions([])
    setOpen(false)
  }

  const getActionIcon = (type: string) => {
    const action = ACTION_OPTIONS.find(a => a.value === type)
    return action?.icon || Zap
  }

  const renderActionConfig = (action: WorkflowAction) => {
    switch (action.type) {
      case 'SEND_EMAIL':
        return (
          <div className="space-y-2">
            <Label>Plantilla de Email</Label>
            <Select
              value={action.config.template || ''}
              onValueChange={(value) => updateActionConfig(action.id, { template: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Bienvenida</SelectItem>
                <SelectItem value="notification">Notificación</SelectItem>
                <SelectItem value="alert">Alerta</SelectItem>
              </SelectContent>
            </Select>
            <Label>Asunto</Label>
            <Input
              value={action.config.subject || ''}
              onChange={(e) => updateActionConfig(action.id, { subject: e.target.value })}
              placeholder="Asunto del email"
            />
          </div>
        )
      case 'CREATE_NOTIFICATION':
        return (
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              value={action.config.message || ''}
              onChange={(e) => updateActionConfig(action.id, { message: e.target.value })}
              placeholder="Mensaje de la notificación"
            />
            <Label>Tipo</Label>
            <Select
              value={action.config.type || 'info'}
              onValueChange={(value) => updateActionConfig(action.id, { type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Información</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Éxito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      case 'SEND_WEBHOOK':
        return (
          <div className="space-y-2">
            <Label>URL del Webhook</Label>
            <Input
              value={action.config.url || ''}
              onChange={(e) => updateActionConfig(action.id, { url: e.target.value })}
              placeholder="https://api.example.com/webhook"
            />
            <Label>Método HTTP</Label>
            <Select
              value={action.config.method || 'POST'}
              onValueChange={(value) => updateActionConfig(action.id, { method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      default:
        return (
          <div className="text-sm text-slate-400">
            Configuración adicional disponible próximamente
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Workflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Workflow *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Bienvenida a nuevos clientes"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe qué hace este workflow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Trigger Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trigger (Disparador)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TRIGGER_OPTIONS.map((trigger) => (
                  <div
                    key={trigger.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTrigger === trigger.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => setSelectedTrigger(trigger.value)}
                  >
                    <div className="font-medium">{trigger.label}</div>
                    <div className="text-sm text-slate-400">{trigger.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Acciones ({actions.length})</CardTitle>
              <Select onValueChange={addAction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Agregar acción" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      <div className="flex items-center">
                        <action.icon className="w-4 h-4 mr-2" />
                        {action.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Agrega acciones para que el workflow haga algo útil</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {actions.map((action, index) => {
                    const ActionIcon = getActionIcon(action.type)
                    const actionOption = ACTION_OPTIONS.find(a => a.value === action.type)

                    return (
                      <Card key={action.id} className="border-slate-700">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-slate-700 rounded-lg">
                                <ActionIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-medium">{actionOption?.label}</div>
                                <div className="text-sm text-slate-400">{actionOption?.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm">Delay:</Label>
                                <Input
                                  type="number"
                                  value={action.delay}
                                  onChange={(e) => updateActionDelay(action.id, parseInt(e.target.value) || 0)}
                                  className="w-20"
                                  placeholder="0"
                                />
                                <span className="text-sm text-slate-400">seg</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAction(action.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {renderActionConfig(action)}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name || !selectedTrigger || actions.length === 0}
            >
              Crear Workflow
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}








