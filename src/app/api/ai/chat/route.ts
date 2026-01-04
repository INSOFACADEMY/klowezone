import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getUserProjects,
  createTaskForUser,
  sendWhatsAppMessage,
  createFacebookAdCampaign,
  getUserProjectStats,
  searchUserProjects,
  generateAdImage,
  type ProjectSummary,
  type TaskInput,
  type FacebookAdCampaignInput
} from '@/lib/agents/agent-tools'
import { getCampaignROIMetrics } from '@/lib/actions/sales'

// ========================================
// CHIEF GROWTH OFFICER - AI AGENT CONFIGURATION
// ========================================

// Available functions for the AI assistant
const availableFunctions = {
  getUserProjects: {
    name: 'getUserProjects',
    description: 'Obtiene todos los proyectos del usuario actual con información detallada incluyendo cliente, estado y fechas.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (se obtiene automáticamente del contexto de autenticación)'
        }
      },
      required: ['userId']
    }
  },
  createTaskForUser: {
    name: 'createTaskForUser',
    description: 'Crea una nueva tarea para un proyecto específico del usuario.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (se obtiene automáticamente del contexto de autenticación)'
        },
        taskData: {
          type: 'object',
          properties: {
            proyecto_id: {
              type: 'string',
              description: 'ID del proyecto donde crear la tarea'
            },
            titulo: {
              type: 'string',
              description: 'Título de la tarea'
            },
            descripcion: {
              type: 'string',
              description: 'Descripción detallada de la tarea'
            },
            estado: {
              type: 'string',
              enum: ['To Do', 'In Progress', 'Review', 'Done'],
              description: 'Estado inicial de la tarea',
              default: 'To Do'
            },
            prioridad: {
              type: 'string',
              enum: ['Baja', 'Media', 'Alta', 'Urgente'],
              description: 'Prioridad de la tarea'
            },
            asignado_a: {
              type: 'string',
              description: 'ID del usuario al que asignar la tarea (opcional)'
            },
            fecha_inicio: {
              type: 'string',
              description: 'Fecha de inicio en formato YYYY-MM-DD (opcional)'
            },
            fecha_entrega: {
              type: 'string',
              description: 'Fecha de entrega en formato YYYY-MM-DD (opcional)'
            },
            tiempo_estimado: {
              type: 'string',
              description: 'Tiempo estimado para completar la tarea (ej: "4 hours")'
            },
            progreso: {
              type: 'number',
              description: 'Progreso actual en porcentaje (0-100)',
              minimum: 0,
              maximum: 100
            },
            etiquetas: {
              type: 'array',
              items: { type: 'string' },
              description: 'Etiquetas para categorizar la tarea'
            }
          },
          required: ['proyecto_id', 'titulo']
        }
      },
      required: ['userId', 'taskData']
    }
  },
  sendWhatsAppMessage: {
    name: 'sendWhatsAppMessage',
    description: 'Envía un mensaje de WhatsApp usando templates predefinidos.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (se obtiene automáticamente del contexto de autenticación)'
        },
        phoneNumber: {
          type: 'string',
          description: 'Número de teléfono del destinatario (con código de país, ej: +521234567890)'
        },
        templateKey: {
          type: 'string',
          enum: ['welcome', 'milestoneCompleted', 'paymentReminder', 'projectUpdate', 'meetingReschedule', 'documentShared'],
          description: 'Tipo de template de mensaje a usar'
        },
        clientName: {
          type: 'string',
          description: 'Nombre del cliente para personalizar el mensaje'
        },
        params: {
          type: 'array',
          items: { type: 'string' },
          description: 'Parámetros adicionales para el template (depende del template seleccionado)'
        }
      },
      required: ['userId', 'phoneNumber', 'templateKey', 'clientName']
    }
  },
  createFacebookAdCampaign: {
    name: 'createFacebookAdCampaign',
    description: 'Crea una campaña publicitaria en Facebook Ads con el nombre, presupuesto diario y texto del anuncio especificados.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (se obtiene automáticamente del contexto de autenticación)'
        },
        campaignData: {
          type: 'object',
          properties: {
            campaignName: {
              type: 'string',
              description: 'Nombre de la campaña publicitaria'
            },
            dailyBudget: {
              type: 'number',
              description: 'Presupuesto diario en dólares para la campaña',
              minimum: 1
            },
            adText: {
              type: 'string',
              description: 'Texto principal del anuncio publicitario'
            },
            targetAudience: {
              type: 'string',
              description: 'Audiencia objetivo para la campaña (opcional)'
            },
            objective: {
              type: 'string',
              enum: ['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'SALES'],
              description: 'Objetivo de la campaña publicitaria',
              default: 'TRAFFIC'
            }
          },
          required: ['campaignName', 'dailyBudget', 'adText']
        }
      },
      required: ['userId', 'campaignData']
    }
  },
  generateAdImage: {
    name: 'generateAdImage',
    description: 'Genera una imagen para anuncio usando DALL-E 3 basada en el texto del anuncio y el tipo de campaña psicológica.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (se obtiene automáticamente del contexto de autenticación)'
        },
        adText: {
          type: 'string',
          description: 'Texto del anuncio para generar la imagen'
        },
        campaignType: {
          type: 'string',
          enum: ['pain', 'aspiration', 'curiosity'],
          description: 'Tipo de campaña psicológica: pain (dolor), aspiration (deseo/status), curiosity (curiosidad)'
        },
        targetAudience: {
          type: 'string',
          description: 'Público objetivo para adaptar la imagen (opcional)'
        }
      },
      required: ['userId', 'adText', 'campaignType']
    }
  },
  getCampaignROIMetrics: {
    name: 'getCampaignROIMetrics',
    description: 'Obtiene métricas consolidadas de ROI para analizar el rendimiento de todas las campañas publicitarias.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (se obtiene automáticamente del contexto de autenticación)'
        }
      },
      required: ['userId']
    }
  },
  getUserProjectStats: {
    name: 'getUserProjectStats',
    description: 'Obtiene estadísticas rápidas de los proyectos del usuario.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (se obtiene automáticamente del contexto de autenticación)'
        }
      },
      required: ['userId']
    }
  },
  searchUserProjects: {
    name: 'searchUserProjects',
    description: 'Busca proyectos del usuario por nombre o descripción.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID del usuario (se obtiene automáticamente del contexto de autenticación)'
        },
        query: {
          type: 'string',
          description: 'Texto a buscar en nombres y descripciones de proyectos'
        }
      },
      required: ['userId', 'query']
    }
  }
}

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

async function authenticateUser(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    return { userId: payload.userId }

  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// ========================================
// OPENAI INTEGRATION
// ========================================

async function callOpenAI(messages: any[], userId: string): Promise<any> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API Key not configured')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        functions: Object.values(availableFunctions),
        function_call: 'auto', // Let the model decide when to call functions
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]

  } catch (error) {
    console.error('Error calling OpenAI:', error)
    throw new Error('Failed to get AI response')
  }
}

// ========================================
// FUNCTION EXECUTION
// ========================================

async function executeFunction(functionName: string, args: any, userId: string): Promise<any> {
  try {
    switch (functionName) {
      case 'getUserProjects':
        return await getUserProjects(userId)

      case 'createTaskForUser':
        const taskData: TaskInput = args.taskData
        return await createTaskForUser(userId, taskData)

      case 'sendWhatsAppMessage':
        return await sendWhatsAppMessage(
          userId,
          args.phoneNumber,
          args.templateKey,
          args.clientName,
          args.params || []
        )

      case 'createFacebookAdCampaign':
        return await createFacebookAdCampaign(userId, args.campaignData)

      case 'generateAdImage':
        return await generateAdImage(userId, args.adText, args.campaignType, args.targetAudience)

      case 'getCampaignROIMetrics':
        return await getCampaignROIMetrics()

      case 'getUserProjectStats':
        return await getUserProjectStats(userId)

      case 'searchUserProjects':
        return await searchUserProjects(userId, args.query)

      default:
        throw new Error(`Unknown function: ${functionName}`)
    }
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error)
    throw error
  }
}

// ========================================
// MAIN API ENDPOINT
// ========================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const { userId } = authResult

    // Parse request body
    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `Eres el Chief Growth Officer (CFO) de Klowezone, el ejecutivo principal de crecimiento responsable de maximizar el ROI de todas las campañas publicitarias y acelerar el crecimiento del negocio.

        IDENTIDAD Y PERSONALIDAD:
        - Eres un ejecutivo de nivel C-suite con experiencia en marketing digital, growth hacking y optimización de conversiones
        - Hablas con autoridad y confianza, pero eres accesible y orientado a resultados
        - Tu objetivo principal es generar más leads cualificados y aumentar el lifetime value de los clientes
        - Siempre piensas en términos de ROI, CAC (Customer Acquisition Cost) y LTV (Lifetime Value)

        PROTOCOLO DE ANÁLISIS PREVIO:
        Antes de cualquier recomendación, SIEMPRE debes usar getCampaignROIMetrics() para analizar el rendimiento actual de las campañas. Esto te permite:
        - Identificar qué estrategias están funcionando
        - Evitar repetir campañas con bajo ROI
        - Optimizar presupuestos hacia canales probados
        - Recomendar mejoras basadas en datos reales

        ESTRATEGIA DE CAMPANAS PUBLICITARIAS:
        Cuando el usuario pida "Generar Campaña" o similar, debes:

        1. PRIMERO: Analizar métricas existentes con getCampaignROIMetrics()
        2. LUEGO: Proponer exactamente 3 variantes usando ganchos psicológicos:

        VARIANTE A (DOLOR - Problem/Solution):
        - Enfocada en el tiempo que pierden los dueños de negocio sin automatización
        - Texto que resuene con frustración por tareas repetitivas
        - Imagen: Empresario estresado con papeles volando, reloj acelerado
        - CTA: "Recupera tu tiempo, automatiza tu negocio"

        VARIANTE B (DESEO/STATUS - Aspiration):
        - Enfocada en cómo Klowezone hace ver como empresa de nivel mundial
        - Texto que apunte a prestigio, innovación y crecimiento exponencial
        - Imagen: CEO confiado en oficina premium, gráficos de crecimiento
        - CTA: "Únete a las empresas que lideran la transformación digital"

        VARIANTE C (CURIOSIDAD - Curiosity/Gap):
        - Ángulo disruptivo para bajar CPC (Costo por Clic)
        - Texto que revele "secretos" sobre reducción de costos
        - Imagen: Gráficos descendentes dramáticos, flechas rompiendo cadenas
        - CTA: "¿Cuánto podrías ahorrar en publicidad?"

        GENERACIÓN DE IMÁGENES:
        Para cada variante, debes invocar generateAdImage() creando un prompt detallado para DALL-E 3 que:
        - Coincida perfectamente con el texto de la variante
        - Use el estilo visual apropiado para el gancho psicológico
        - Incluya elementos que refuercen el mensaje principal
        - Considere al público objetivo para mayor relevancia

        TOMA DE DECISIONES:
        - Si el usuario no especifica variante, pregunta cuál prefiere
        - Si ya tienes datos de ROI, recomienda la variante con mejor performance histórica
        - Siempre explica por qué recomiendas una variante sobre otra
        - Incluye métricas esperadas basadas en campañas anteriores

        FUNCIONES DISPONIBLES:
        - getUserProjects: Consulta proyectos del usuario
        - createTaskForUser: Crea tareas en proyectos
        - sendWhatsAppMessage: Envía mensajes WhatsApp con templates
        - createFacebookAdCampaign: Crea campañas publicitarias en Meta
        - generateAdImage: Genera imágenes para anuncios con DALL-E 3
        - getCampaignROIMetrics: Obtiene métricas de ROI consolidadas
        - getUserProjectStats: Estadísticas de proyectos
        - searchUserProjects: Busca proyectos por nombre/descripción

        COMUNICACIÓN:
        - Siempre responde en español profesional
        - Usa terminología de growth marketing (CAC, LTV, ROI, CPC, etc.)
        - Sé data-driven en tus recomendaciones
        - Mantén un tono ejecutivo pero approachable
        - Incluye números y métricas siempre que sea posible`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ]

    // Call OpenAI with function calling
    const aiResponse = await callOpenAI(messages, userId)

    let finalResponse = aiResponse.message.content
    let functionResult = null

    // Check if AI wants to call a function
    if (aiResponse.message.function_call) {
      const { name: functionName, arguments: argsString } = aiResponse.message.function_call

      try {
        const args = JSON.parse(argsString)

        // Execute the function
        functionResult = await executeFunction(functionName, args, userId)

        // Add function result to conversation and get final response
        const functionMessages = [
          ...messages,
          aiResponse.message, // AI's function call
          {
            role: 'function',
            name: functionName,
            content: JSON.stringify(functionResult)
          }
        ]

        const finalAIResponse = await callOpenAI(functionMessages, userId)
        finalResponse = finalAIResponse.message.content

      } catch (error) {
        console.error('Function execution error:', error)
        finalResponse = `Lo siento, hubo un error al ejecutar la función ${functionName}. Por favor, intenta de nuevo.`
      }
    }

    return NextResponse.json({
      response: finalResponse,
      functionCalled: aiResponse.message.function_call ? {
        name: aiResponse.message.function_call.name,
        result: functionResult
      } : null,
      userId
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ========================================
// GET ENDPOINT FOR TESTING
// ========================================

export async function GET() {
  return NextResponse.json({
    message: 'Chief Growth Officer API - Tu ejecutivo de crecimiento personal',
    agent: 'Chief Growth Officer (CFO) de Klowezone',
    capabilities: [
      'Análisis de ROI de campañas',
      'Generación de campañas con ganchos psicológicos',
      'Creación de imágenes publicitarias con IA',
      'Optimización de presupuesto publicitario',
      'Estrategias de growth hacking'
    ],
    availableFunctions: Object.keys(availableFunctions),
    campaignVariants: [
      'A (Dolor): Enfocado en pérdida de tiempo sin automatización',
      'B (Deseo): Enfocado en prestigio y estatus empresarial',
      'C (Curiosidad): Enfocado en reducción de costos CPC'
    ],
    exampleRequests: [
      'Generar campaña publicitaria para mi negocio',
      '¿Cuál es el ROI de mis campañas actuales?',
      'Crear imagen para anuncio sobre automatización'
    ]
  })
}
