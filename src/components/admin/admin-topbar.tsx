'use client'

import { useState } from 'react'
import { Bell, Search, Command, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export function AdminTopbar() {
  const [notifications] = useState([
    { id: 1, title: 'Nuevo usuario registrado', time: '2 min ago', unread: true },
    { id: 2, title: 'Error en integración SMTP', time: '5 min ago', unread: true },
    { id: 3, title: 'Backup completado', time: '1 hour ago', unread: false }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar en todo el sistema..."
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-400 hover:text-slate-200"
          >
            <Command className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Cmd+K</span>
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative text-slate-400 hover:text-white">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-slate-400">{notification.time}</p>
                  </div>
                  {notification.unread && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-700">
                Ver todas las notificaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 text-slate-400 hover:text-white">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  A
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-slate-500">Super Admin</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

