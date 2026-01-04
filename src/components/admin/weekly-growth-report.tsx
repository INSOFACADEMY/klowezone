'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Target, DollarSign, Users, RefreshCw } from 'lucide-react'

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
    profitFirstAllocation: number
    ownerComp: number
    profitDistribution: number
    ownerTax: number
    profitReserve: number
  }
}

interface ReportResponse {
  success: boolean
  report?: WeeklyReport
  timestamp?: string
  error?: string
}

export function WeeklyGrowthReport() {
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/cron/weekly-growth-report')
      const data: ReportResponse = await response.json()

      if (data.success && data.report) {
        setReport(data.report)
      } else {
        setError(data.error || 'Error cargando reporte')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error loading weekly report:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Generando reporte semanal...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !report) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error || 'No se pudo cargar el reporte'}</p>
            <Button onClick={loadReport} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`
  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">📊 Reporte Semanal Profit-First</CardTitle>
              <p className="text-muted-foreground">
                Semana del {new Date(report.weekStart).toLocaleDateString()} al {new Date(report.weekEnd).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={loadReport} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Total</p>
                <p className="text-2xl font-bold">{formatCurrency(report.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gasto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(report.totalSpend)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ROI General</p>
                <p className="text-2xl font-bold">{formatPercent(report.overallROI)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads Generados</p>
                <p className="text-2xl font-bold">{report.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaña Estrella y Agujero Negro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.starCampaign && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                ⭐ Campaña Estrella
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">{report.starCampaign.name}</p>
                <div className="flex justify-between">
                  <span>ROI:</span>
                  <Badge variant="default" className="bg-green-500">
                    {formatPercent(report.starCampaign.roi)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span className="font-medium">{formatCurrency(report.starCampaign.revenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {report.blackHoleCampaign && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🕳️ Agujero Negro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">{report.blackHoleCampaign.name}</p>
                <div className="flex justify-between">
                  <span>Gasto:</span>
                  <span className="font-medium text-red-600">{formatCurrency(report.blackHoleCampaign.spend)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span className="font-medium">$0.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análisis CGO */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Análisis Ejecutivo - CGO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {report.cgoAnalysis.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Recomendaciones Estratégicas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Profit First Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Distribución Profit-First</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema de distribución de utilidades (50% del revenue total)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Revenue Bruto:</span>
              <span className="font-semibold">{formatCurrency(report.profitFirst.grossRevenue)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 border-l-4 border-blue-500">
                <span>Profit First (50%):</span>
                <span className="font-medium">{formatCurrency(report.profitFirst.profitFirstAllocation)}</span>
              </div>

              <div className="ml-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>• Compensación Owner (30%):</span>
                  <span>{formatCurrency(report.profitFirst.ownerComp)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>• Distribución Utilidades (20%):</span>
                  <span>{formatCurrency(report.profitFirst.profitDistribution)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>• Impuestos Owner (30%):</span>
                  <span>{formatCurrency(report.profitFirst.ownerTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>• Reserva Utilidades (20%):</span>
                  <span>{formatCurrency(report.profitFirst.profitReserve)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




