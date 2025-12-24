export default function AdminLogsPage() {
  const logs = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      level: 'ERROR',
      message: 'Failed to connect to SMTP server',
      user: 'System',
      category: 'Email'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      level: 'INFO',
      message: 'User "admin@klowezone.com" logged in',
      user: 'admin@klowezone.com',
      category: 'Authentication'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      level: 'WARNING',
      message: 'High memory usage detected (85%)',
      user: 'System',
      category: 'Performance'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      level: 'INFO',
      message: 'Project "Landing Page Redesign" updated',
      user: 'juan@klowezone.com',
      category: 'Project'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      level: 'INFO',
      message: 'New user registered: maria@klowezone.com',
      user: 'maria@klowezone.com',
      category: 'User'
    }
  ]

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
      default: return '📋'
    }
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
          <select className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white">
            <option value="all">Todos los niveles</option>
            <option value="error">Errores</option>
            <option value="warning">Advertencias</option>
            <option value="info">Información</option>
          </select>
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
          <div className="text-2xl font-bold text-white">12,847</div>
          <div className="text-slate-400 text-sm">Últimas 24 horas</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Errores</div>
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-red-400 text-sm">❌</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">23</div>
          <div className="text-slate-400 text-sm">Requieren atención</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Advertencias</div>
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <span className="text-amber-400 text-sm">⚠️</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">156</div>
          <div className="text-slate-400 text-sm">Monitorear</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Incidentes</div>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400 text-sm">🚨</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">3</div>
          <div className="text-slate-400 text-sm">Activos</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-white font-semibold">📋 Registro de Eventos</h3>
        </div>
        <div className="p-6">
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
                  </div>
                  <p className="text-white text-sm mb-1">{log.message}</p>
                  <p className="text-slate-400 text-xs">Usuario: {log.user}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Mostrando 5 de 12,847 logs
            </p>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors">
                Anterior
              </button>
              <span className="text-slate-400 text-sm px-3">Página 1</span>
              <button className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

