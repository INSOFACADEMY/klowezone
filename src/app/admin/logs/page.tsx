'use client'

import { useState, useEffect } from 'react'
import { LoggingService, LogEntry } from '@/lib/logging-service'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    level: 'all',
    category: 'all',
    limit: 50,
    offset: 0
  })

  useEffect(() => {
    loadLogs()
    loadStats()
  }, [filters])

  const loadLogs = async () => {
    try {
      const loggingService = LoggingService.getInstance()
      const { logs: fetchedLogs } = await loggingService.getLogs({
        level: filters.level !== 'all' ? filters.level : undefined,
        limit: filters.limit,
        offset: filters.offset
      })
      setLogs(fetchedLogs)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const loggingService = LoggingService.getInstance()
      const statsData = await loggingService.getLogStats()
      setStats({
        total: statsData.total,
        errors: statsData.errors,
        warnings: statsData.warnings,
        info: statsData.info
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'WARNING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'INFO': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Email': return '📧'
      case 'Authentication': return '🔐'
      case 'Performance': return '⚡'
      case 'Project': return '📁'
      case 'User': return '👤'
      case 'Security': return '🔒'
      case 'Application': return '💻'
      case 'System': return '⚙️'
      default: return '📋'
    }
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }))
  }

  const handleRefresh = () => {
    setLoading(true)
    loadLogs()
    loadStats()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sistema de Logs</h1>
          <p className="text-slate-400 mt-1">
            Monitorea errores, auditoría y gestiona incidentes del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
            value={filters.level}
            onChange={(e) => handleFilterChange({ level: e.target.value })}
          >
            <option value="all">Todos los niveles</option>
            <option value="ERROR">Errores</option>
            <option value="WARNING">Advertencias</option>
            <option value="INFO">Información</option>
          </select>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refrescar
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Exportar Logs
          </button>
        </div>
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Total Logs</div>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 text-sm">📋</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</div>
          <div className="text-slate-400 text-sm">Total de logs</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Errores</div>
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-red-400 text-sm">❌</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.errors.toLocaleString()}</div>
          <div className="text-slate-400 text-sm">Errores críticos</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Advertencias</div>
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <span className="text-amber-400 text-sm">⚠️</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.warnings.toLocaleString()}</div>
          <div className="text-slate-400 text-sm">Advertencias</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Incidentes</div>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400 text-sm">🚨</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.info.toLocaleString()}</div>
          <div className="text-slate-400 text-sm">Información</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-white font-semibold">📋 Registro de Eventos</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">Cargando logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">No hay logs disponibles</div>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{getCategoryIcon(log.category)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded border ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                      <span className="text-slate-400 text-sm">{log.category}</span>
                      <span className="text-slate-500 text-sm">
                        {log.timestamp.toLocaleString()}
                      </span>
                      {log.ipAddress && (
                        <span className="text-slate-500 text-xs">IP: {log.ipAddress}</span>
                      )}
                    </div>
                    <p className="text-white text-sm mb-1">{log.message}</p>
                    <div className="flex items-center space-x-4 text-slate-400 text-xs">
                      <span>Usuario: {log.userEmail || log.userId || 'Sistema'}</span>
                      {log.stackTrace && (
                        <details className="cursor-pointer">
                          <summary className="text-red-400 hover:text-red-300">Stack Trace</summary>
                          <pre className="mt-2 p-2 bg-slate-900 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                            {log.stackTrace}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Mostrando {logs.length} de {stats.total} logs
            </p>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50"
                disabled={filters.offset === 0}
                onClick={() => handleFilterChange({ offset: Math.max(0, filters.offset - filters.limit) })}
              >
                Anterior
              </button>
              <span className="text-slate-400 text-sm px-3">
                Página {Math.floor(filters.offset / filters.limit) + 1}
              </span>
              <button
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50"
                disabled={filters.offset + filters.limit >= stats.total}
                onClick={() => handleFilterChange({ offset: filters.offset + filters.limit })}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

