'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getProjects, Project } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Receipt,
  CreditCard,
  Wallet,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react'

interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  projectsRevenue: number
  outstandingInvoices: number
  paidInvoices: number
  overdueInvoices: number
  monthlyGrowth: number
  budgetUtilization: number
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  project_id?: string
  project_name?: string
}

export default function FinancesPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    projectsRevenue: 0,
    outstandingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    monthlyGrowth: 0,
    budgetUtilization: 0
  })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month')
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'invoices'>('overview')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [projectsData] = await Promise.all([
          getProjects()
        ])

        setProjects(projectsData)

        // Calcular métricas financieras simuladas
        await calculateFinancialMetrics(projectsData)

        // Cargar gastos simulados
        await loadExpenses()
      } catch (error) {
        console.error('Error loading financial data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [timeRange])

  const calculateFinancialMetrics = async (projectsData: Project[]) => {
    // Simulación de datos financieros
    const totalRevenue = projectsData.reduce((sum, project) => sum + (project.presupuesto || 0), 0)
    const totalExpenses = totalRevenue * 0.6 // 60% de gastos típicos
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Simular facturas
    const outstandingInvoices = Math.floor(totalRevenue * 0.3)
    const paidInvoices = Math.floor(totalRevenue * 0.6)
    const overdueInvoices = Math.floor(totalRevenue * 0.1)

    setMetrics({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      projectsRevenue: totalRevenue,
      outstandingInvoices,
      paidInvoices,
      overdueInvoices,
      monthlyGrowth: 12.5, // Simulado
      budgetUtilization: 78.3 // Simulado
    })
  }

  const loadExpenses = async () => {
    // Simulación de gastos
    const mockExpenses: Expense[] = [
      {
        id: '1',
        description: 'Desarrollo Frontend - E-commerce',
        amount: 2500,
        category: 'Desarrollo',
        date: '2024-12-20',
        project_name: 'Tienda Online XYZ'
      },
      {
        id: '2',
        description: 'Servidor Cloud AWS',
        amount: 1800,
        category: 'Infraestructura',
        date: '2024-12-18',
        project_name: 'API REST Empresarial'
      },
      {
        id: '3',
        description: 'Licencias Software',
        amount: 450,
        category: 'Herramientas',
        date: '2024-12-15',
        project_name: 'Sistema de Gestión'
      },
      {
        id: '4',
        description: 'Marketing Digital',
        amount: 1200,
        category: 'Marketing',
        date: '2024-12-12',
        project_name: 'Campaña Branding'
      },
      {
        id: '5',
        description: 'Consultoría UX/UI',
        amount: 800,
        category: 'Diseño',
        date: '2024-12-10',
        project_name: 'Rediseño App Móvil'
      }
    ]

    setExpenses(mockExpenses)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getExpenseCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Desarrollo': 'bg-blue-100 text-blue-800',
      'Infraestructura': 'bg-green-100 text-green-800',
      'Herramientas': 'bg-purple-100 text-purple-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Diseño': 'bg-orange-100 text-orange-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando datos financieros...</p>
        </div>
      </div>
    )
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
            <DollarSign className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold">Finanzas</h1>
          </div>
          <p className="text-slate-400">
            Control de ingresos, gastos y métricas financieras de tus proyectos
          </p>
        </motion.div>

        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setActiveTab('overview')}
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              size="sm"
              className={activeTab === 'overview' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Resumen
            </Button>
            <Button
              onClick={() => setActiveTab('expenses')}
              variant={activeTab === 'expenses' ? 'default' : 'outline'}
              size="sm"
              className={activeTab === 'expenses' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Gastos
            </Button>
            <Button
              onClick={() => setActiveTab('invoices')}
              variant={activeTab === 'invoices' ? 'default' : 'outline'}
              size="sm"
              className={activeTab === 'invoices' ? 'bg-blue-600' : 'border-slate-600'}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Facturas
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Vista General */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-emerald-400">{formatCurrency(metrics.totalRevenue)}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                          +{metrics.monthlyGrowth}% vs mes anterior
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Gastos Totales</p>
                        <p className="text-2xl font-bold text-red-400">{formatCurrency(metrics.totalExpenses)}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                          60% del presupuesto
                        </p>
                      </div>
                      <Wallet className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Beneficio Neto</p>
                        <p className="text-2xl font-bold text-blue-400">{formatCurrency(metrics.netProfit)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Margen: {metrics.profitMargin.toFixed(1)}%
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Facturas Pendientes</p>
                        <p className="text-2xl font-bold text-yellow-400">{formatCurrency(metrics.outstandingInvoices)}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {metrics.overdueInvoices} vencidas
                        </p>
                      </div>
                      <CreditCard className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Gráficos y métricas detalladas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribución de ingresos por proyecto */}
              <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Ingresos por Proyecto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project, index) => {
                      const percentage = project.presupuesto ?
                        ((project.presupuesto / metrics.totalRevenue) * 100) : 0
                      return (
                        <div key={project.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500`} />
                            <span className="text-white text-sm">{project.nombre_proyecto}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-medium">{formatCurrency(project.presupuesto || 0)}</span>
                            <span className="text-slate-400 text-xs ml-2">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Estado del presupuesto */}
              <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Utilización del Presupuesto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Presupuesto Utilizado</span>
                        <span className="text-white">{metrics.budgetUtilization.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.budgetUtilization} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">
                          {formatCurrency(metrics.paidInvoices)}
                        </div>
                        <div className="text-xs text-slate-400">Pagado</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-400">
                          {formatCurrency(metrics.outstandingInvoices)}
                        </div>
                        <div className="text-xs text-slate-400">Pendiente</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas financieras */}
            {metrics.overdueInvoices > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="bg-red-500/10 border border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <div>
                        <h4 className="font-medium text-red-400">Facturas Vencidas</h4>
                        <p className="text-red-300 text-sm">
                          Tienes {metrics.overdueInvoices} factura{metrics.overdueInvoices > 1 ? 's' : ''} vencida{metrics.overdueInvoices > 1 ? 's' : ''}.
                          Revisa los pagos pendientes para mantener el flujo de caja saludable.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Vista de Gastos */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Control de Gastos</h2>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Receipt className="w-4 h-4 mr-2" />
                Nuevo Gasto
              </Button>
            </div>

            <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Gastos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-300">Descripción</TableHead>
                      <TableHead className="text-slate-300">Categoría</TableHead>
                      <TableHead className="text-slate-300">Proyecto</TableHead>
                      <TableHead className="text-slate-300">Fecha</TableHead>
                      <TableHead className="text-slate-300 text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-white">{expense.description}</TableCell>
                        <TableCell>
                          <Badge className={getExpenseCategoryColor(expense.category)}>
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {expense.project_name || 'General'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(expense.date).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-400">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vista de Facturas */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gestión de Facturas</h2>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Pagadas</p>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(metrics.paidInvoices)}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-400">{formatCurrency(metrics.outstandingInvoices)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Vencidas</p>
                      <p className="text-2xl font-bold text-red-400">{formatCurrency(metrics.overdueInvoices)}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Facturas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Sistema de Facturas</h3>
                  <p className="text-slate-400">Próximamente disponible - Integración con sistemas de facturación</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}















