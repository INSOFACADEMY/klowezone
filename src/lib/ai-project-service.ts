// Servicio de IA para gestión de proyectos
// Requiere configuración de OpenAI API Key

interface AutoScheduleRequest {
  projectName: string
  projectDescription: string
  startDate?: string
  complexity?: 'Baja' | 'Media' | 'Alta'
  teamSize?: number
}

interface AutoScheduleResponse {
  tasks: {
    title: string
    description: string
    estimatedHours: number
    priority: 'Baja' | 'Media' | 'Alta' | 'Urgente'
    dependencies?: string[]
    milestone?: boolean
  }[]
  milestones: {
    title: string
    description: string
    estimatedDate: string
    deliverables: string[]
  }[]
  totalEstimatedHours: number
  recommendedTimeline: {
    startDate: string
    endDate: string
    totalDays: number
  }
}

interface HealthReportRequest {
  projectId: string
  currentBudget?: number
  timeEntries: {
    hoursLogged: number
    billableHours: number
    totalCost: number
  }
  tasksCompleted: number
  totalTasks: number
  daysElapsed: number
  daysTotal: number
}

interface HealthReportResponse {
  status: 'Excelente' | 'Bueno' | 'Precaución' | 'Crítico'
  score: number // 0-100
  summary: string
  risks: string[]
  recommendations: string[]
  budgetProjection: {
    currentSpend: number
    projectedTotal: number
    variance: number
    daysUntilOverBudget?: number
  }
  timelineProjection: {
    currentProgress: number
    projectedCompletion: string
    onTrack: boolean
    delayDays?: number
  }
}

interface TemplateRequest {
  industry: string
  projectType: string
  taskCategory: 'Planning' | 'Development' | 'Testing' | 'Deployment' | 'Documentation'
  complexity?: 'Simple' | 'Medium' | 'Complex'
}

interface TemplateResponse {
  taskName: string
  description: string
  acceptanceCriteria: string[]
  estimatedHours: number
  requiredSkills: string[]
  deliverables: string[]
  checklist: string[]
}

class AIProjectService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('OpenAI API Key not configured. AI features will not work.')
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key not configured')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto Project Manager con años de experiencia en gestión de proyectos tecnológicos. Proporciona respuestas profesionales, prácticas y basadas en mejores prácticas de la industria.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('Error calling OpenAI:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  async generateAutoSchedule(request: AutoScheduleRequest): Promise<AutoScheduleResponse> {
    const prompt = `
Genera un cronograma automático para el siguiente proyecto. Devuelve un JSON válido con esta estructura exacta:

{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "estimatedHours": number,
      "priority": "Baja" | "Media" | "Alta" | "Urgente",
      "dependencies": ["string"] (opcional),
      "milestone": boolean (opcional)
    }
  ],
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "estimatedDate": "YYYY-MM-DD",
      "deliverables": ["string"]
    }
  ],
  "totalEstimatedHours": number,
  "recommendedTimeline": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "totalDays": number
  }
}

Proyecto: ${request.projectName}
Descripción: ${request.projectDescription}
Fecha de inicio: ${request.startDate || 'Hoy'}
Complejidad: ${request.complexity || 'Media'}
Tamaño del equipo: ${request.teamSize || 1}

Genera entre 5-10 tareas iniciales lógicas, hitos importantes y fechas realistas.
Considera dependencias entre tareas y asigna prioridades apropiadas.
`

    try {
      const response = await this.callOpenAI(prompt)
      const parsed = JSON.parse(response)

      // Validar estructura
      if (!parsed.tasks || !parsed.milestones || !parsed.recommendedTimeline) {
        throw new Error('Invalid response structure')
      }

      return parsed as AutoScheduleResponse
    } catch (error) {
      console.error('Error generating auto schedule:', error)
      throw new Error('Failed to generate project schedule')
    }
  }

  async generateHealthReport(request: HealthReportRequest): Promise<HealthReportResponse> {
    const prompt = `
Analiza el estado de salud de este proyecto y genera un reporte ejecutivo. Devuelve un JSON válido con esta estructura exacta:

{
  "status": "Excelente" | "Bueno" | "Precaución" | "Crítico",
  "score": number (0-100),
  "summary": "string con resumen ejecutivo",
  "risks": ["string"],
  "recommendations": ["string"],
  "budgetProjection": {
    "currentSpend": number,
    "projectedTotal": number,
    "variance": number,
    "daysUntilOverBudget": number (opcional)
  },
  "timelineProjection": {
    "currentProgress": number (0-100),
    "projectedCompletion": "YYYY-MM-DD",
    "onTrack": boolean,
    "delayDays": number (opcional)
  }
}

Datos del proyecto:
- ID: ${request.projectId}
- Presupuesto actual: ${request.currentBudget || 'No especificado'}
- Horas registradas: ${request.timeEntries.hoursLogged}
- Horas facturables: ${request.timeEntries.billableHours}
- Costo total: ${request.timeEntries.totalCost}
- Tareas completadas: ${request.tasksCompleted}/${request.totalTasks}
- Días transcurridos: ${request.daysElapsed}/${request.daysTotal}

Proporciona un análisis objetivo basado en métricas estándar de gestión de proyectos.
Identifica riesgos específicos y recomendaciones accionables.
`

    try {
      const response = await this.callOpenAI(prompt)
      const parsed = JSON.parse(response)

      // Validar estructura
      if (!parsed.status || typeof parsed.score !== 'number') {
        throw new Error('Invalid response structure')
      }

      return parsed as HealthReportResponse
    } catch (error) {
      console.error('Error generating health report:', error)
      throw new Error('Failed to generate health report')
    }
  }

  async generateTaskTemplate(request: TemplateRequest): Promise<TemplateResponse> {
    const prompt = `
Genera una plantilla profesional de tarea basada en estándares de la industria. Devuelve un JSON válido con esta estructura exacta:

{
  "taskName": "string",
  "description": "string detallado",
  "acceptanceCriteria": ["string"],
  "estimatedHours": number,
  "requiredSkills": ["string"],
  "deliverables": ["string"],
  "checklist": ["string"]
}

Industria: ${request.industry}
Tipo de proyecto: ${request.projectType}
Categoría de tarea: ${request.taskCategory}
Complejidad: ${request.complexity || 'Medium'}

Crea una descripción profesional, criterios de aceptación claros, y una lista de verificación completa.
Adapta el contenido a las mejores prácticas de la industria especificada.
`

    try {
      const response = await this.callOpenAI(prompt)
      const parsed = JSON.parse(response)

      // Validar estructura
      if (!parsed.taskName || !parsed.description) {
        throw new Error('Invalid response structure')
      }

      return parsed as TemplateResponse
    } catch (error) {
      console.error('Error generating task template:', error)
      throw new Error('Failed to generate task template')
    }
  }

  async suggestTeamInvitations(projectData: {
    projectName: string
    projectDescription: string
    currentTeam: string[]
    industry: string
  }): Promise<{
    suggestions: {
      role: string
      rationale: string
      requiredSkills: string[]
      priority: 'High' | 'Medium' | 'Low'
    }[]
    smartMatches: {
      email?: string
      name?: string
      rationale: string
      confidence: number
    }[]
  }> {
    const prompt = `
Analiza este proyecto y sugiere miembros del equipo adicionales. Devuelve un JSON válido con esta estructura exacta:

{
  "suggestions": [
    {
      "role": "string",
      "rationale": "string",
      "requiredSkills": ["string"],
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "smartMatches": [
    {
      "email": "string (opcional)",
      "name": "string (opcional)",
      "rationale": "string",
      "confidence": number (0-100)
    }
  ]
}

Proyecto: ${projectData.projectName}
Descripción: ${projectData.projectDescription}
Equipo actual: ${projectData.currentTeam.join(', ')}
Industria: ${projectData.industry}

Sugiere roles adicionales necesarios y posibles candidatos basados en experiencia previa.
`

    try {
      const response = await this.callOpenAI(prompt)
      const parsed = JSON.parse(response)

      return parsed
    } catch (error) {
      console.error('Error generating team suggestions:', error)
      throw new Error('Failed to generate team suggestions')
    }
  }
}

// Exportar instancia singleton
export const aiProjectService = new AIProjectService()
export type { AutoScheduleResponse, HealthReportResponse, TemplateResponse }















