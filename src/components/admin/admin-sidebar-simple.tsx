'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Settings, FileText, Users, Zap, TrendingUp, MessageSquare } from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: BarChart3
  },
  {
    name: 'Configuración',
    href: '/admin/settings',
    icon: Settings
  },
  {
    name: 'CMS',
    href: '/admin/cms',
    icon: FileText
  },
  {
    name: 'Clientes',
    href: '/admin/clients',
    icon: Users
  },
  {
    name: 'Automatizaciones',
    href: '/admin/automations',
    icon: Zap
  },
  {
    name: 'Métricas',
    href: '/admin/metrics',
    icon: TrendingUp
  },
  {
    name: 'Logs',
    href: '/admin/logs',
    icon: MessageSquare
  },
  {
    name: 'Feedback',
    href: '/admin/feedback',
    icon: MessageSquare
  }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-slate-900/60 backdrop-blur-lg border-r border-slate-700/50">
      <div className="flex h-16 shrink-0 items-center px-6">
        <span className="text-xl font-bold text-white">KloweZone Admin</span>
      </div>

      <nav className="flex flex-1 flex-col px-4 pb-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-x-3 rounded-md p-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}





