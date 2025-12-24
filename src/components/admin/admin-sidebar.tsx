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
    icon: FileBarChart,
    current: false,
    children: [
      { name: 'Error Logs', href: '/admin/logs/errors' },
      { name: 'Audit Logs', href: '/admin/logs/audit' },
      { name: 'Incidentes', href: '/admin/logs/incidents' }
    ]
  },
  {
    name: 'Feedback',
    href: '/admin/feedback',
    icon: MessageSquare,
    current: false
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-lg border-r border-slate-700/50 z-40">
      <div className="flex flex-col h-full p-6">
        {/* Logo */}
        <div className="flex items-center mb-8">
          <Crown className="w-8 h-8 text-emerald-400 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-white">KloweZone</h2>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems.includes(item.name)

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      "w-full text-left bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 transition-colors group",
                      isActive && "bg-slate-800/60 border-slate-600/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <item.icon className={cn(
                          "w-5 h-5 mr-3",
                          isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"
                        )} />
                        <span className={cn(
                          "font-medium",
                          isActive ? "text-emerald-400" : "text-slate-100 group-hover:text-white"
                        )}>
                          {item.name}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 transition-colors group",
                      isActive && "bg-slate-800/60 border-slate-600/50"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 mr-3",
                      isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"
                    )} />
                    <span className={cn(
                      "font-medium",
                      isActive ? "text-emerald-400" : "text-slate-100 group-hover:text-white"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-8 mt-2 space-y-1"
                  >
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href

                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "block text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 rounded px-3 py-2 transition-colors",
                            isChildActive && "text-emerald-400 bg-slate-800/50"
                          )}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </motion.div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-slate-700/50 pt-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
