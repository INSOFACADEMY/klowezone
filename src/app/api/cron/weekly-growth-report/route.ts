import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generando reporte semanal Profit-First...')

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
    const campaignLogs = await prisma.aiCampaignLog.findMany({
      where: {
        createdAt: {
          gte: lastMonday,
          lte: lastSunday
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // También incluir campañas existentes que tuvieron actividad (revenue generado) en la semana
    const campaignsWithRevenue = await prisma.aiCampaignLog.findMany({
      where: {
        updatedAt: {
          gte: lastMonday,
          lte: lastSunday
        },
        revenueGenerated: {
          gt: 0
        }
      }
    })

    // Combinar y deduplicar campañas
    const allCampaignIds = new Set([
      ...campaignLogs.map(c => c.campaignId),
      ...campaignsWithRevenue.map(c => c.campaignId)
    ])

    const allCampaigns = await prisma.aiCampaignLog.findMany({
      where: {
        campaignId: {
          in: Array.from(allCampaignIds)
        }
      }
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





