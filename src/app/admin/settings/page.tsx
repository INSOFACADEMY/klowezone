'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Mail, Cpu, HardDrive, Shield } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
          <p className="text-slate-400 mt-1">
            Gestiona integraciones, proveedores y configuraciones del sistema
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-400" />
                Integraciones Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Configura proveedores de email para notificaciones y envío masivo.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">SMTP</span>
                  <span className="text-amber-400 text-sm">Pendiente</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">SendGrid</span>
                  <span className="text-amber-400 text-sm">Pendiente</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">Resend</span>
                  <span className="text-amber-400 text-sm">Pendiente</span>
                </div>
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
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-emerald-400" />
                Integraciones IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Configura proveedores de IA para funcionalidades avanzadas.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">OpenAI</span>
                  <span className="text-amber-400 text-sm">Pendiente</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">Anthropic</span>
                  <span className="text-amber-400 text-sm">Pendiente</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">Google AI</span>
                  <span className="text-amber-400 text-sm">Pendiente</span>
                </div>
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
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <HardDrive className="w-5 h-5 mr-2 text-purple-400" />
                Storage & Archivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Configura proveedores de almacenamiento para archivos.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">AWS S3</span>
                  <span className="text-amber-400 text-sm">Pendiente</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">Cloudflare R2</span>
                  <span className="text-amber-400 text-sm">Pendiente</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">Local Storage</span>
                  <span className="text-green-400 text-sm">Activo</span>
                </div>
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
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-400" />
                Roles y Permisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Gestiona roles de usuario y permisos del sistema.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">Super Admin</span>
                  <span className="text-green-400 text-sm">1 usuario</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">Admin</span>
                  <span className="text-slate-400 text-sm">0 usuarios</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-300">Editor</span>
                  <span className="text-slate-400 text-sm">0 usuarios</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

