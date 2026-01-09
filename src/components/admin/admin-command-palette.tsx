'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Command, Users, Settings, FileText, TrendingUp, MessageSquare, BarChart3, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  category: string
}

const commands: CommandItem[] = [
  // Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Vista general del sistema',
    icon: BarChart3,
    href: '/admin/dashboard',
    category: 'Navegación'
  },

  // Configuración
  {
    id: 'settings-integrations',
    title: 'Integraciones',
    description: 'Configurar email, IA y storage',
    icon: Settings,
    href: '/admin/settings/integrations',
    category: 'Configuración'
  },
  {
    id: 'settings-roles',
    title: 'Roles y Permisos',
    description: 'Gestionar RBAC del sistema',
    icon: Settings,
    href: '/admin/settings/roles',
    category: 'Configuración'
  },

  // CMS
  {
    id: 'cms-blog',
    title: 'Blog Posts',
    description: 'Gestionar artículos del blog',
    icon: FileText,
    href: '/admin/cms/blog',
    category: 'CMS'
  },
  {
    id: 'cms-pages',
    title: 'Páginas',
    description: 'Editar páginas estáticas',
    icon: FileText,
    href: '/admin/cms/pages',
    category: 'CMS'
  },
  {
    id: 'cms-media',
    title: 'Media Library',
    description: 'Gestionar archivos multimedia',
    icon: FileText,
    href: '/admin/cms/media',
    category: 'CMS'
  },

  // Clientes y Métricas
  {
    id: 'clients',
    title: 'Clientes',
    description: 'Gestionar usuarios y clientes',
    icon: Users,
    href: '/admin/clients',
    category: 'Gestión'
  },
  {
    id: 'metrics',
    title: 'Métricas',
    description: 'Ver analytics y estadísticas',
    icon: TrendingUp,
    href: '/admin/metrics',
    category: 'Analytics'
  },
  {
    id: 'automations',
    title: 'Automatizaciones',
    description: 'Configurar workflows automáticos',
    icon: Zap,
    href: '/admin/automations',
    category: 'Automatización'
  },

  // Logs y Feedback
  {
    id: 'logs-errors',
    title: 'Error Logs',
    description: 'Ver logs de errores del sistema',
    icon: FileText,
    href: '/admin/logs/errors',
    category: 'Logs'
  },
  {
    id: 'logs-audit',
    title: 'Audit Logs',
    description: 'Historial de cambios del sistema',
    icon: FileText,
    href: '/admin/logs/audit',
    category: 'Logs'
  },
  {
    id: 'feedback',
    title: 'Feedback',
    description: 'Gestionar feedback de usuarios',
    icon: MessageSquare,
    href: '/admin/feedback',
    category: 'Soporte'
  }
]

export function AdminCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    command.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    command.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(true)
      }

      if (!isOpen) return

      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchTerm('')
        setSelectedIndex(0)
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          router.push(filteredCommands[selectedIndex].href)
          setIsOpen(false)
          setSearchTerm('')
          setSelectedIndex(0)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, router])

  const handleSelectCommand = (command: CommandItem) => {
    router.push(command.href)
    setIsOpen(false)
    setSearchTerm('')
    setSelectedIndex(0)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Command Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50"
            >
              {/* Search Input */}
              <div className="p-4 border-b border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar comandos..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setSelectedIndex(0)
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">ESC</kbd>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Command className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron resultados</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredCommands.map((command, index) => (
                      <button
                        key={command.id}
                        onClick={() => handleSelectCommand(command)}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors flex items-center space-x-4",
                          selectedIndex === index && "bg-slate-700/70"
                        )}
                      >
                        <command.icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{command.title}</p>
                          <p className="text-slate-400 text-sm truncate">{command.description}</p>
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                          {command.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">↑↓</kbd>
                      <span>Navegar</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">↵</kbd>
                      <span>Seleccionar</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Command className="w-3 h-3" />
                    <span>+ K para buscar</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
















