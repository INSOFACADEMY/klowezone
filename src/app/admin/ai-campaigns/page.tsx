'use client'

import { useState, useEffect } from 'react'
import { Brain, DollarSign, Users, TrendingUp, Target, Eye, Play, Pause, BarChart3, Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BackButton } from '@/components/admin/back-button'

interface AiCampaign {
  id: string
  campaignId: string
  name: string
  spend: number
  leadsCount: number
  revenueGenerated: number
  createdAt: string
  updatedAt: string
}

export default function AdminAiCampaignsPage() {
  const [campaigns, setCampaigns] = useState<AiCampaign[]>([])
  const [loading, setLoading] = useState(true)

  // Datos de ejemplo para desarrollo
  const mockCampaigns: AiCampaign[] = [
    {
      id: '1',
      campaignId: '6970537367061',
      name: 'Campaña Verano 2024',
      spend: 150.50,
      leadsCount: 12,
      revenueGenerated: 2400.00,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:22:00.000Z'
    },
    {
      id: '2',
      campaignId: '6970537367062',
      name: 'Promoción Enero',
      spend: 89.75,
      leadsCount: 8,
      revenueGenerated: 1200.00,
      createdAt: '2024-01-10T09:15:00.000Z',
      updatedAt: '2024-01-18T16:45:00.000Z'
    }
  ]

  // Cálculos de métricas
  const totalInvestment = mockCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0)
  const totalLeads = mockCampaigns.reduce((sum, campaign) => sum + campaign.leadsCount, 0)
  const totalRevenue = mockCampaigns.reduce((sum, campaign) => sum + campaign.revenueGenerated, 0)
  const totalROI = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0

  useEffect(() => {
    // Simular carga de datos
    const loadCampaigns = async () => {
      setLoading(true)
      // Aquí iría la llamada real a la API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCampaigns(mockCampaigns)
      setLoading(false)
    }

    loadCampaigns()
  }, [])

  const getROIColor = (roi: number) => {
    if (roi > 50) return 'text-green-400'
    if (roi > 0) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getROIStatus = (roi: number) => {
    if (roi > 50) return 'Excelente'
    if (roi > 0) return 'Positivo'
    return 'Negativo'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando campañas de IA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-white">Generador de Campañas IA</h1>
            <p className="text-slate-400 mt-1">
              Crea y gestiona campañas publicitarias optimizadas con inteligencia artificial
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Eye className="w-4 h-4 mr-2" />
            Ver en Meta
          </Button>
          <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
            <Brain className="w-4 h-4 mr-2" />
            Nueva Campaña con IA
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Inversión Total</CardTitle>
            <DollarSign className="h-8 w-8 text-green-500/20" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalInvestment.toFixed(2)}</div>
            <p className="text-xs text-slate-400">
              Presupuesto gastado en campañas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Leads IA</CardTitle>
            <Users className="h-8 w-8 text-blue-500/20" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalLeads}</div>
            <p className="text-xs text-slate-400">
              Clientes generados por campañas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Ventas Cerradas</CardTitle>
            <TrendingUp className="h-8 w-8 text-purple-500/20" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-slate-400">
              Ingresos generados por campañas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">ROI Real</CardTitle>
            <BarChart3 className="h-8 w-8 text-emerald-500/20" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getROIColor(totalROI)}`}>
              {totalROI.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-400">
              {getROIStatus(totalROI)} - Ganancia/Inversión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Campañas Publicitarias</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Crear Campaña
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h4 className="text-white font-medium mb-2">No hay campañas creadas</h4>
              <p className="text-slate-400 mb-6">
                Crea tu primera campaña publicitaria con IA para empezar a generar leads
              </p>
              <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
                <Brain className="w-4 h-4 mr-2" />
                Crear Primera Campaña
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Campaña</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Estado</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Gasto</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Leads</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Revenue</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">ROI</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const campaignROI = campaign.spend > 0 ? ((campaign.revenueGenerated - campaign.spend) / campaign.spend) * 100 : 0

                    return (
                      <tr key={campaign.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-white font-medium">{campaign.name}</div>
                            <div className="text-slate-400 text-sm">ID: {campaign.campaignId}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">
                            Activa
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right text-white">
                          ${campaign.spend.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right text-white">
                          {campaign.leadsCount}
                        </td>
                        <td className="py-4 px-4 text-right text-white">
                          ${campaign.revenueGenerated.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`font-medium ${getROIColor(campaignROI)}`}>
                            {campaignROI.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

