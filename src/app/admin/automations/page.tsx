'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Workflow, Bot } from 'lucide-react'

export default function AdminAutomationsPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Automatizaciones</h1>
          <p className="text-slate-400 mt-1">
            Configura workflows automáticos y procesos inteligentes
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Workflow className="w-5 h-5 mr-2 text-blue-400" />
                Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Crea y gestiona flujos de trabajo automáticos</p>
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
                <Zap className="w-5 h-5 mr-2 text-emerald-400" />
                Triggers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Configura eventos que disparan automatizaciones</p>
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
                <Bot className="w-5 h-5 mr-2 text-purple-400" />
                Acciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Define las acciones que se ejecutan automáticamente</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

