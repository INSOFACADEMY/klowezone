'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function AdminFeedbackPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Sistema de Feedback</h1>
          <p className="text-slate-400 mt-1">
            Gestiona feedback de usuarios y soporte al cliente
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                Bandeja de Entrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Mensajes pendientes de revisión</p>
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
                <Clock className="w-5 h-5 mr-2 text-amber-400" />
                En Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Feedback siendo atendido</p>
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
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                Resueltos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Casos cerrados exitosamente</p>
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
                <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                Prioridad Alta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Casos críticos que requieren atención inmediata</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

