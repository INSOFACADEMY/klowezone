'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { aiProjectService, AutoScheduleResponse, HealthReportResponse, TemplateResponse } from '@/lib/ai-project-service'
import { getProjects, Project } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import {
  Sparkles,
  Brain,
  FileText,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Zap,
  Lightbulb,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'health' | 'templates'>('schedule')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  // Estados para Auto-Schedule
  const [scheduleRequest, setScheduleRequest] = useState({
    projectName: '',
    projectDescription: '',
    startDate: '',
    complexity: 'Media' as 'Baja' | 'Media' | 'Alta',
    teamSize: 1
  })
  const [scheduleResult, setScheduleResult] = useState<AutoScheduleResponse | null>(null)

  // Estados para Health Report
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [healthReport, setHealthReport] = useState<HealthReportResponse | null>(null)

  // Estados para Templates
  const [templateRequest, setTemplateRequest] = useState({
    industry: '',
    projectType: '',
    taskCategory: 'Planning' as 'Planning' | 'Development' | 'Testing' | 'Deployment' | 'Documentation',
    complexity: 'Medium' as 'Simple' | 'Medium' | 'Complex'
  })
  const [templateResult, setTemplateResult] = useState<TemplateResponse | null>(null)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects()
        setProjects(projectsData)
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    }

    loadProjects()
  }, [])

  const handleGenerateSchedule = async () => {
    if (!scheduleRequest.projectName || !scheduleRequest.projectDescription) {
      alert('Completa el nombre y descripción del proyecto')
      return
    }

    setLoading(true)
    try {
      const result = await aiProjectService.generateAutoSchedule(scheduleRequest)
      setScheduleResult(result)
    } catch (error) {
      console.error('Error generating schedule:', error)
      alert('Error al generar el cronograma')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateHealthReport = async () => {
    if (!selectedProjectId) {
      alert('Selecciona un proyecto')
      return
    }

    setLoading(true)
    try {
      const result = await aiProjectService.generateHealthReport({
        projectId: selectedProjectId,
        currentBudget: 10000, // TODO: Obtener de la base de datos
        timeEntries: {
          hoursLogged: 120, // TODO: Calcular real
          billableHours: 100, // TODO: Calcular real
          totalCost: 5000 // TODO: Calcular real
        },
        tasksCompleted: 8, // TODO: Calcular real
        totalTasks: 12, // TODO: Calcular real
        daysElapsed: 15, // TODO: Calcular real
        daysTotal: 30 // TODO: Calcular real
      })
      setHealthReport(result)
    } catch (error) {
      console.error('Error generating health report:', error)
      alert('Error al generar el reporte de salud')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTemplate = async () => {
    if (!templateRequest.industry || !templateRequest.projectType) {
      alert('Completa la industria y tipo de proyecto')
      return
    }

    setLoading(true)
    try {
      const result = await aiProjectService.generateTaskTemplate(templateRequest)
      setTemplateResult(result)
    } catch (error) {
      console.error('Error generating template:', error)
      alert('Error al generar la plantilla')
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">IA Assistant</h1>
          </div>
          <p className="text-slate-400">
            Herramientas inteligentes para gestión de proyectos y optimización de procesos
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/30">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'schedule'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Auto-Cronograma
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'health'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Reporte de Salud
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Plantillas IA
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Auto-Cronograma */}
        {activeTab === 'schedule' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Generador de Cronogramas Inteligente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectName" className="text-slate-200">Nombre del Proyecto</Label>
                    <Input
                      id="projectName"
                      value={scheduleRequest.projectName}
                      onChange={(e) => setScheduleRequest(prev => ({ ...prev, projectName: e.target.value }))}
                      placeholder="Ej: Desarrollo de E-commerce"
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complexity" className="text-slate-200">Complejidad</Label>
                    <Select
                      value={scheduleRequest.complexity}
                      onValueChange={(value: any) => setScheduleRequest(prev => ({ ...prev, complexity: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baja">Baja</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-200">Descripción del Proyecto</Label>
                  <Textarea
                    id="description"
                    value={scheduleRequest.projectDescription}
                    onChange={(e) => setScheduleRequest(prev => ({ ...prev, projectDescription: e.target.value }))}
                    placeholder="Describe detalladamente el alcance del proyecto..."
                    rows={4}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-slate-200">Fecha de Inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={scheduleRequest.startDate}
                      onChange={(e) => setScheduleRequest(prev => ({ ...prev, startDate: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teamSize" className="text-slate-200">Tamaño del Equipo</Label>
                    <Input
                      id="teamSize"
                      type="number"
                      min="1"
                      max="20"
                      value={scheduleRequest.teamSize}
                      onChange={(e) => setScheduleRequest(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 1 }))}
                      placeholder="1-20"
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateSchedule}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generar Cronograma con IA
                </Button>
              </CardContent>
            </Card>

            {/* Resultado del cronograma */}
            {scheduleResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-green-400">Cronograma Generado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{scheduleResult.totalEstimatedHours}h</div>
                        <div className="text-sm text-slate-400">Horas Totales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{scheduleResult.tasks.length}</div>
                        <div className="text-sm text-slate-400">Tareas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{scheduleResult.milestones.length}</div>
                        <div className="text-sm text-slate-400">Hitos</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-white">Tareas Sugeridas:</h4>
                      {scheduleResult.tasks.slice(0, 5).map((task, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <Badge className="text-xs">{task.priority}</Badge>
                          <span className="flex-1 text-white">{task.title}</span>
                          <span className="text-sm text-slate-400">{task.estimatedHours}h</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Reporte de Salud */}
        {activeTab === 'health' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Reporte de Salud del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project" className="text-slate-200">Seleccionar Proyecto</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Elige un proyecto" />
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

                <Button
                  onClick={handleGenerateHealthReport}
                  disabled={loading || !selectedProjectId}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  Generar Reporte de Salud
                </Button>
              </CardContent>
            </Card>

            {/* Resultado del reporte */}
            {healthReport && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={`${getHealthStatusColor(healthReport.status)} px-3 py-1`}>
                        {healthReport.status}
                      </Badge>
                      <span className="text-white">Estado del Proyecto: {healthReport.score}/100</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertDescription className="text-white">
                        {healthReport.summary}
                      </AlertDescription>
                    </Alert>

                    {healthReport.recommendations && healthReport.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Recomendaciones
                        </h4>
                        <ul className="space-y-1">
                          {healthReport.recommendations.map((rec, index) => (
                            <li key={index} className="text-green-300 text-sm flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {healthReport.risks && healthReport.risks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Riesgos Identificados
                        </h4>
                        <ul className="space-y-1">
                          {healthReport.risks.map((risk, index) => (
                            <li key={index} className="text-red-300 text-sm flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Plantillas IA */}
        {activeTab === 'templates' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Generador de Plantillas Profesionales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry" className="text-slate-200">Industria</Label>
                    <Select
                      value={templateRequest.industry}
                      onValueChange={(value) => setTemplateRequest(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Ej: Tecnología" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tecnología">Tecnología</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Finanzas">Finanzas</SelectItem>
                        <SelectItem value="Salud">Salud</SelectItem>
                        <SelectItem value="Educación">Educación</SelectItem>
                        <SelectItem value="E-commerce">E-commerce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="projectType" className="text-slate-200">Tipo de Proyecto</Label>
                    <Input
                      id="projectType"
                      value={templateRequest.projectType}
                      onChange={(e) => setTemplateRequest(prev => ({ ...prev, projectType: e.target.value }))}
                      placeholder="Ej: Desarrollo Web"
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-slate-200">Categoría de Tarea</Label>
                    <Select
                      value={templateRequest.taskCategory}
                      onValueChange={(value: any) => setTemplateRequest(prev => ({ ...prev, taskCategory: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Development">Development</SelectItem>
                        <SelectItem value="Testing">Testing</SelectItem>
                        <SelectItem value="Deployment">Deployment</SelectItem>
                        <SelectItem value="Documentation">Documentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="complexity" className="text-slate-200">Complejidad</Label>
                    <Select
                      value={templateRequest.complexity}
                      onValueChange={(value: any) => setTemplateRequest(prev => ({ ...prev, complexity: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Simple">Simple</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Complex">Complex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateTemplate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Generar Plantilla con IA
                </Button>
              </CardContent>
            </Card>

            {/* Resultado de la plantilla */}
            {templateResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-emerald-400">{templateResult.taskName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Descripción</h4>
                      <p className="text-slate-300">{templateResult.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2">Criterios de Aceptación</h4>
                      <ul className="space-y-1">
                        {templateResult.acceptanceCriteria.map((criteria, index) => (
                          <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-white mb-2">Habilidades Requeridas</h4>
                        <div className="flex flex-wrap gap-1">
                          {templateResult.requiredSkills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-2">Entregables</h4>
                        <ul className="space-y-1">
                          {templateResult.deliverables.map((deliverable, index) => (
                            <li key={index} className="text-slate-300 text-sm">• {deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Checklist ({templateResult.estimatedHours}h estimadas)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {templateResult.checklist.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                            <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
