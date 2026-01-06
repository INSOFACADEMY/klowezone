import { Crown, BarChart3, Users, Settings, FileText, TrendingUp, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import AdminProtection from '@/components/admin/AdminProtection'

function QuickActionCard({ title, description, href, icon: Icon, color }: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<any>
  color: string
}) {
  return (
    <Link href={href}>
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 hover:border-slate-600/50 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/20 cursor-pointer group">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white group-hover:text-emerald-400 transition-colors font-semibold">
            {title}
          </h3>
        </div>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </Link>
  )
}

export default async function AdminPage() {
  const quickActions = [
    {
      title: 'Dashboard',
      description: 'Vista general del sistema',
      href: '/admin/dashboard',
      icon: BarChart3,
      color: 'from-blue-600 to-emerald-600'
    },
    {
      title: 'Configuración',
      description: 'Integraciones y ajustes del sistema',
      href: '/admin/settings',
      icon: Settings,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      title: 'CMS',
      description: 'Gestionar contenido y blog',
      href: '/admin/cms',
      icon: FileText,
      color: 'from-amber-600 to-orange-600'
    },
    {
      title: 'Clientes',
      description: 'Administrar usuarios y roles',
      href: '/admin/clients',
      icon: Users,
      color: 'from-purple-600 to-indigo-600'
    },
    {
      title: 'Métricas',
      description: 'Analytics y reportes',
      href: '/admin/metrics',
      icon: TrendingUp,
      color: 'from-rose-600 to-pink-600'
    },
    {
      title: 'Automatizaciones',
      description: 'Workflows y procesos automáticos',
      href: '/admin/automations',
      icon: Zap,
      color: 'from-red-600 to-pink-600'
    },
    {
      title: 'Logs',
      description: 'Monitoreo y auditoría',
      href: '/admin/logs',
      icon: Shield,
      color: 'from-indigo-600 to-purple-600'
    },
    {
      title: 'Feedback',
      description: 'Soporte y comentarios',
      href: '/admin/feedback',
      icon: Shield,
      color: 'from-teal-600 to-cyan-600'
    }
  ]

  return (
    <AdminProtection>
      <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Crown className="w-12 h-12 text-emerald-400 mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-white">Panel de Administración</h1>
            <p className="text-xl text-slate-400 mt-2">KloweZone Enterprise</p>
          </div>
        </div>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Bienvenido al centro de control completo de tu plataforma.
          Gestiona usuarios, contenido, configuraciones y monitorea el rendimiento del sistema.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <QuickActionCard key={action.title} {...action} />
        ))}
      </div>

      {/* System Status */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-white flex items-center mb-4 font-semibold">
          <Zap className="w-5 h-5 mr-2 text-emerald-400" />
          Estado del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-white font-medium">Base de Datos</p>
              <p className="text-slate-400 text-sm">Conectada</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-white font-medium">API Services</p>
              <p className="text-slate-400 text-sm">Operativo</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <div>
              <p className="text-white font-medium">Email Service</p>
              <p className="text-slate-400 text-sm">Configuración pendiente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminProtection>
  )
}
