import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiKeyAuth, isApiKeyAuthResult } from '@/middleware/api-key-auth'
import { requireAdminUser } from '@/middleware/admin-auth'
import { apiKeyRateLimit, adminRateLimit } from '@/middleware/rate-limit'
import { logger } from '@/lib/logging-service'
import { ADMIN_ROLES } from '@/lib/roles'
import { isLikelyBrowserRequest, extractIPAddress } from '@/lib/security'
import OpenAI from 'openai'

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
})

interface WeeklyReport {
  weekStart: string
  weekEnd: string
  totalSpend: number
  totalRevenue: number
  totalLeads: number
  overallROI: number
  starCampaign: {
    campaignId: string
    name: string
    roi: number
    revenue: number
  } | null
  blackHoleCampaign: {
    campaignId: string
    name: string
    spend: number
    revenue: number
  } | null
  campaignBreakdown: Array<{
    campaignId: string
    name: string
    spend: number
    leads: number
    revenue: number
    roi: number
  }>
  cgoAnalysis: string
  recommendations: string[]
  profitFirst: {
    grossRevenue: number
    profitFirstAllocation: number // 50% del revenue
    ownerComp: number // 30% del Profit First
    profitDistribution: number // 20% del Profit First
    ownerTax: number // 30% del Profit First
    profitReserve: number // 20% del Profit First
  }
}


/**
 * GET /api/cron/weekly-growth-report
 *
 * Reporte semanal automatizado que se ejecuta cada lunes.
 * Proporciona análisis Profit-First del rendimiento de campañas.
 *
 * AUTENTICACIÓN - 2 MODOS EXCLUYENTES:
 *
 * 1. MODO ADMIN UI (Browser):
 *    - Auth: Cookie httpOnly `admin_token` (server-side validation)
 *    - Rate limit: 50 req/5min por admin user
 *    - Requiere rol admin (superadmin/admin/editor/analyst/support)
 *    - Query param opcional: ?mode=system-wide (solo superadmin)
 *    - Default: Reporte de organización activa del usuario
 *
 * 2. MODO API INTEGRATION (Server-to-Server):
 *    - Auth: Header `x-api-key` con API key válida
 *    - Rate limit: 60 req/min por API key
 *    - Reporte limitado a organización de la API key (tenant isolation)
 *    - Heuristic detection: Rechaza requests con headers típicos de browser (origin, sec-fetch-*)
 *    - Propósito: Evitar uso accidental desde frontend, reducir riesgo de exposición (no prueba criptográfica)
 *    - Seguridad: Audit logging de uso sospechoso desde browsers (sin exposición de tokens)
 *
 * AUDITORÍA: Todos los accesos se loguean en audit_logs (sin tokens/PII/secrets)
 */
export async function GET(request: NextRequest) {
  try {
    let authenticatedUserId: string | null = null
    let authenticatedApiKeyId: string | null = null
    let orgId: string | null = null
    let authMode: 'admin_ui' | 'api_integration' = 'admin_ui'

    // Check for API key authentication (server-to-server mode)
    const apiKeyAuthResult = await apiKeyAuth(request)
    if (isApiKeyAuthResult(apiKeyAuthResult)) {
      // SECURITY: Reject API key usage from browsers (detect by browser-specific headers)
      if (isLikelyBrowserRequest(request.headers)) {
        // Get IP address (take first IP if forwarded)
        const ipAddress = extractIPAddress(request.headers)

        // Audit suspicious activity
        await logger.logAuditEvent(
          'WEEKLY_REPORT_SUSPICIOUS_API_KEY_USAGE',
          'WEEKLY_REPORT',
          undefined, // resourceId
          undefined, // oldValues
          {
            reason: 'API key used from browser (detected by browser headers)',
            apiKeyId: apiKeyAuthResult.apiKeyId,
            userAgent: request.headers.get('user-agent'),
            ipAddress,
            // Include actual header values (if present) for debugging
            origin: request.headers.get('origin'),
            secFetchSite: request.headers.get('sec-fetch-site'),
            secFetchMode: request.headers.get('sec-fetch-mode'),
            secFetchDest: request.headers.get('sec-fetch-dest'),
            // Boolean flags for quick identification
            hasOrigin: !!request.headers.get('origin'),
            hasSecFetchSite: !!request.headers.get('sec-fetch-site'),
            hasSecFetchMode: !!request.headers.get('sec-fetch-mode'),
            hasSecFetchDest: !!request.headers.get('sec-fetch-dest')
          },
          undefined, // userId
          request
        )

        return NextResponse.json(
          { error: 'API keys must be used server-to-server only' },
          { status: 403 }
        )
      }

      // Rate limiting for API key requests
      const rateLimitResult = await apiKeyRateLimit(request)
      if (rateLimitResult instanceof NextResponse) {
        return rateLimitResult
      }

      authenticatedApiKeyId = apiKeyAuthResult.apiKeyId
      orgId = apiKeyAuthResult.orgId
      authMode = 'api_integration'

      console.log(`📊 [API Integration] Generando reporte semanal para org: ${orgId} (API Key: ${authenticatedApiKeyId})`)
    } else {
      // Admin UI mode - check cookie authentication
      const adminAuth = await requireAdminUser(request)
      if (adminAuth instanceof NextResponse) {
        // Get IP address (take first IP if forwarded)
        const ipAddress = extractIPAddress(request.headers)

        // Audit failed authentication
        await logger.logAuditEvent(
          'WEEKLY_REPORT_ACCESS_DENIED',
          'WEEKLY_REPORT',
          undefined, // resourceId
          {}, // oldValues
          {
            reason: 'No valid authentication',
            authMode: 'admin_ui',
            ipAddress
          },
          undefined, // userId
          request
        )

        return NextResponse.json(
          { error: 'Admin authentication required' },
          { status: 401 }
        )
      }

      // Rate limiting for admin requests
      const rateLimitResult = await adminRateLimit(request)
      if (rateLimitResult instanceof NextResponse) {
        return rateLimitResult
      }

      authenticatedUserId = adminAuth.user.id
      authMode = 'admin_ui'

      // Parse query parameters for admin mode
      const { searchParams } = new URL(request.url)
      const mode = searchParams.get('mode')

      if (mode === 'system-wide') {
        // Check if user is superadmin for system-wide access
        const userRole = adminAuth.user.role?.name?.toLowerCase()
        if (userRole !== 'superadmin') {
          await logger.logAuditEvent(
            'WEEKLY_REPORT_ACCESS_DENIED',
            'WEEKLY_REPORT',
            undefined, // resourceId
            {}, // oldValues
            {
              reason: 'Insufficient permissions for system-wide mode',
              requestedMode: 'system-wide',
              userRole: userRole,
              authMode: 'admin_ui'
            },
            authenticatedUserId,
            request
          )

          return NextResponse.json(
            { error: 'Superadmin role required for system-wide reports' },
            { status: 403 }
          )
        }
        orgId = null // system-wide
      } else {
        // Default: get user's organizations and use first active one
        const userMemberships = await prisma.organizationMember.findMany({
          where: { userId: authenticatedUserId },
          include: { organization: { select: { id: true, isActive: true } } },
          orderBy: { joinedAt: 'asc' }
        })

        const activeOrg = userMemberships.find(m => m.organization.isActive)?.organization
        if (!activeOrg) {
          await logger.logAuditEvent(
            'WEEKLY_REPORT_ACCESS_DENIED',
            'WEEKLY_REPORT',
            undefined, // resourceId
            {}, // oldValues
            {
              reason: 'No active organization membership',
              authMode: 'admin_ui'
            },
            authenticatedUserId,
            request
          )

          return NextResponse.json(
            { error: 'No active organization membership found' },
            { status: 403 }
          )
        }
        orgId = activeOrg.id
      }

      console.log(`📊 [Admin UI] Generando reporte semanal para ${orgId ? `org: ${orgId}` : 'system-wide'} (User: ${authenticatedUserId})`)
    }

    // Calcular el rango de la semana anterior (lunes a domingo)
    const now = new Date()
    const currentDay = now.getDay() // 0 = Domingo, 1 = Lunes, etc.

    // Calcular el lunes de la semana anterior
    const lastMonday = new Date(now)
    lastMonday.setDate(now.getDate() - currentDay - 6) // Retroceder al lunes anterior
    lastMonday.setHours(0, 0, 0, 0)

    // Calcular el domingo de la semana anterior
    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6)
    lastSunday.setHours(23, 59, 59, 999)

    console.log(`📅 Semana analizada: ${lastMonday.toISOString()} - ${lastSunday.toISOString()}`)

    // 1. Recopilar datos de la semana
    const baseWhere = orgId ? {
      organizationId: orgId,
      createdAt: {
        gte: lastMonday,
        lte: lastSunday
      }
    } : {
      createdAt: {
        gte: lastMonday,
        lte: lastSunday
      }
    }

    const campaignLogs = await prisma.aiCampaignLog.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' }
    })

    // También incluir campañas existentes que tuvieron actividad (revenue generado) en la semana
    const revenueWhere = orgId ? {
      organizationId: orgId,
      updatedAt: {
        gte: lastMonday,
        lte: lastSunday
      },
      revenueGenerated: {
        gt: 0
      }
    } : {
      updatedAt: {
        gte: lastMonday,
        lte: lastSunday
      },
      revenueGenerated: {
        gt: 0
      }
    }

    const campaignsWithRevenue = await prisma.aiCampaignLog.findMany({
      where: revenueWhere
    })

    // Combinar y deduplicar campañas
    const allCampaignIds = new Set([
      ...campaignLogs.map(c => c.campaignId),
      ...campaignsWithRevenue.map(c => c.campaignId)
    ])

    const allCampaignsWhere = orgId ? {
      campaignId: {
        in: Array.from(allCampaignIds)
      },
      organizationId: orgId
    } : {
      campaignId: {
        in: Array.from(allCampaignIds)
      }
    }

    const allCampaigns = await prisma.aiCampaignLog.findMany({
      where: allCampaignsWhere
    })

    // Calcular métricas agregadas
    const totalSpend = allCampaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalRevenue = allCampaigns.reduce((sum, c) => sum + c.revenueGenerated, 0)
    const totalLeads = allCampaigns.reduce((sum, c) => sum + c.leadsCount, 0)
    const overallROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0

    // Encontrar campaña estrella (mejor ROI)
    const starCampaign = allCampaigns
      .map(c => ({
        campaignId: c.campaignId,
        name: c.name,
        roi: c.spend > 0 ? ((c.revenueGenerated - c.spend) / c.spend) * 100 : 0,
        revenue: c.revenueGenerated
      }))
      .filter(c => c.roi > 0)
      .sort((a, b) => b.roi - a.roi)[0] || null

    // Encontrar agujero negro (gasto sin ventas)
    const blackHoleCampaign = allCampaigns
      .map(c => ({
        campaignId: c.campaignId,
        name: c.name,
        spend: c.spend,
        revenue: c.revenueGenerated
      }))
      .filter(c => c.spend > 0 && c.revenue === 0)
      .sort((a, b) => b.spend - a.spend)[0] || null

    // Desglose detallado de campañas
    const campaignBreakdown = allCampaigns.map(c => ({
      campaignId: c.campaignId,
      name: c.name,
      spend: c.spend,
      leads: c.leadsCount,
      revenue: c.revenueGenerated,
      roi: c.spend > 0 ? ((c.revenueGenerated - c.spend) / c.spend) * 100 : 0
    }))

    // 2. Análisis con IA (CGO)
    const cgoAnalysis = await generateCGOAnalysis({
      totalSpend,
      totalRevenue,
      totalLeads,
      overallROI,
      starCampaign,
      blackHoleCampaign,
      campaignBreakdown,
      weekStart: lastMonday.toISOString(),
      weekEnd: lastSunday.toISOString()
    })

    // 3. Recomendaciones estratégicas
    const recommendations = generateStrategicRecommendations({
      totalSpend,
      totalRevenue,
      overallROI,
      starCampaign,
      blackHoleCampaign,
      campaignBreakdown
    })

    // 4. Cálculo Profit-First
    const profitFirst = calculateProfitFirstAllocation(totalRevenue)

    // 5. Construir reporte completo
    const weeklyReport: WeeklyReport = {
      weekStart: lastMonday.toISOString(),
      weekEnd: lastSunday.toISOString(),
      totalSpend,
      totalRevenue,
      totalLeads,
      overallROI,
      starCampaign,
      blackHoleCampaign,
      campaignBreakdown,
      cgoAnalysis,
      recommendations,
      profitFirst
    }

    console.log('✅ Reporte semanal generado exitosamente')
    console.log(`💰 Revenue: $${totalRevenue.toFixed(2)}, ROI: ${overallROI.toFixed(1)}%`)

    // Audit successful access
    await logger.logAuditEvent(
      'WEEKLY_REPORT_GENERATED',
      'WEEKLY_REPORT',
      undefined, // resourceId
      {}, // oldValues
      {
        authMode,
        apiKeyId: authenticatedApiKeyId,
        weekStart: lastMonday.toISOString(),
        weekEnd: lastSunday.toISOString(),
        totalCampaigns: allCampaigns.length,
        totalRevenue,
        overallROI,
        outcome: 'success'
      },
      authenticatedUserId,
      request
    )

    return NextResponse.json({
      success: true,
      report: weeklyReport,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error generando reporte semanal:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * Genera análisis ejecutivo usando el CGO (Chief Growth Officer)
 */
async function generateCGOAnalysis(data: {
  totalSpend: number
  totalRevenue: number
  totalLeads: number
  overallROI: number
  starCampaign: any
  blackHoleCampaign: any
  campaignBreakdown: any[]
  weekStart: string
  weekEnd: string
}): Promise<string> {
  try {
    const prompt = `Eres el Chief Growth Officer (CGO) de Klowezone, una plataforma de automatización empresarial.

    Analiza el rendimiento semanal de nuestras campañas publicitarias y proporciona un informe ejecutivo conciso:

    DATOS DE LA SEMANA:
    - Gasto Total: $${data.totalSpend.toFixed(2)}
    - Revenue Generado: $${data.totalRevenue.toFixed(2)}
    - Leads Totales: ${data.totalLeads}
    - ROI General: ${data.overallROI.toFixed(1)}%

    ${data.starCampaign ? `CAMPAÑA ESTRELLA: ${data.starCampaign.name} (ROI: ${data.starCampaign.roi.toFixed(1)}%)` : 'SIN CAMPAÑA ESTRELLA'}

    ${data.blackHoleCampaign ? `AGUJERO NEGRO: ${data.blackHoleCampaign.name} (Gasto: $${data.blackHoleCampaign.spend.toFixed(2)}, Revenue: $0)` : 'SIN AGUJEROS NEGROS'}

    Escribe un análisis ejecutivo de 3-4 párrafos que incluya:
    1. Evaluación general del rendimiento
    2. Análisis de fortalezas y debilidades
    3. Insights estratégicos para la próxima semana
    4. Recomendación específica sobre qué hacer con la campaña estrella y el agujero negro

    Mantén un tono profesional, motivador y orientado a resultados. Sé conciso pero específico.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Eres un CGO experimentado especializado en marketing digital y growth hacking. Tus análisis son precisos, accionables y motivadores.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || 'Análisis no disponible'

  } catch (error) {
    console.error('Error generando análisis CGO:', error)
    return 'Error generando análisis automático. Revisar datos manualmente.'
  }
}

/**
 * Genera recomendaciones estratégicas basadas en los datos
 */
function generateStrategicRecommendations(data: {
  totalSpend: number
  totalRevenue: number
  overallROI: number
  starCampaign: any
  blackHoleCampaign: any
  campaignBreakdown: any[]
}): string[] {
  const recommendations: string[] = []

  // Recomendación basada en ROI general
  if (data.overallROI > 50) {
    recommendations.push('🚀 ROI excelente. Considera aumentar presupuesto en un 25% para todas las campañas.')
  } else if (data.overallROI > 20) {
    recommendations.push('📈 ROI saludable. Mantén presupuesto actual y enfócate en optimizar creativos.')
  } else if (data.overallROI > 0) {
    recommendations.push('⚖️ ROI marginal. Revisa segmentación de audiencia y mensajes de campaña.')
  } else {
    recommendations.push('🔍 ROI negativo. Pausa campañas no rentables y reevalúa estrategia de adquisición.')
  }

  // Recomendación para campaña estrella
  if (data.starCampaign) {
    recommendations.push(`⭐ Duplica presupuesto de "${data.starCampaign.name}" - está generando ROI excepcional.`)
  }

  // Recomendación para agujero negro
  if (data.blackHoleCampaign) {
    recommendations.push(`🕳️ Pausa "${data.blackHoleCampaign.name}" inmediatamente. Reevalúa creativos y segmentación.`)
  }

  // Recomendación basada en leads vs revenue
  const avgRevenuePerLead = data.totalLeads > 0 ? data.totalRevenue / data.totalLeads : 0
  if (avgRevenuePerLead < 100) {
    recommendations.push('💰 Revenue por lead bajo. Enfócate en cualificar mejor los leads antes de la conversión.')
  }

  // Recomendación semanal
  recommendations.push('📅 Próxima semana: Prueba variante de campaña con enfoque en "retorno de inversión" en lugar de "ahorro de tiempo".')

  return recommendations
}

/**
 * Calcula la distribución Profit-First del revenue semanal
 */
function calculateProfitFirstAllocation(grossRevenue: number): WeeklyReport['profitFirst'] {
  // Profit First: 50% del revenue va al sistema Profit First
  const profitFirstAllocation = grossRevenue * 0.5

  // Distribución del Profit First:
  // - 30% para compensación del owner
  // - 20% para distribución de utilidades
  // - 30% para impuestos del owner
  // - 20% para reserva de utilidades

  return {
    grossRevenue,
    profitFirstAllocation,
    ownerComp: profitFirstAllocation * 0.3,
    profitDistribution: profitFirstAllocation * 0.2,
    ownerTax: profitFirstAllocation * 0.3,
    profitReserve: profitFirstAllocation * 0.2
  }
}







