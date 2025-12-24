export default function AdminMetricsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Métricas y Analytics</h1>
          <p className="text-slate-400 mt-1">
            Monitorea el rendimiento y analiza datos del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white">
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Usuarios Activos</div>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 text-sm">👥</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">1,247</div>
          <div className="flex items-center text-sm">
            <span className="text-emerald-400">+12.5%</span>
            <span className="text-slate-400 ml-2">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Sesiones</div>
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span className="text-emerald-400 text-sm">📊</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">8,942</div>
          <div className="flex items-center text-sm">
            <span className="text-emerald-400">+8.2%</span>
            <span className="text-slate-400 ml-2">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Tiempo Promedio</div>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400 text-sm">⏱️</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">4m 32s</div>
          <div className="flex items-center text-sm">
            <span className="text-red-400">-2.1%</span>
            <span className="text-slate-400 ml-2">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Tasa de Conversión</div>
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <span className="text-amber-400 text-sm">🎯</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">3.24%</div>
          <div className="flex items-center text-sm">
            <span className="text-emerald-400">+0.8%</span>
            <span className="text-slate-400 ml-2">vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">📈 Tráfico por Día</h3>
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>Gráfico de tráfico disponible próximamente</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">🌍 Tráfico por País</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">México</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-slate-700 rounded">
                  <div className="w-16 h-2 bg-emerald-500 rounded"></div>
                </div>
                <span className="text-slate-400 text-sm">45%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Estados Unidos</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-slate-700 rounded">
                  <div className="w-12 h-2 bg-blue-500 rounded"></div>
                </div>
                <span className="text-slate-400 text-sm">28%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">España</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-slate-700 rounded">
                  <div className="w-8 h-2 bg-purple-500 rounded"></div>
                </div>
                <span className="text-slate-400 text-sm">15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Otros</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-slate-700 rounded">
                  <div className="w-4 h-2 bg-slate-500 rounded"></div>
                </div>
                <span className="text-slate-400 text-sm">12%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">⚡ Métricas de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Response Time</span>
              <span className="text-emerald-400 text-sm">120ms</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded">
              <div className="w-4/5 h-2 bg-emerald-500 rounded"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Uptime</span>
              <span className="text-emerald-400 text-sm">99.9%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded">
              <div className="w-full h-2 bg-emerald-500 rounded"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Error Rate</span>
              <span className="text-red-400 text-sm">0.1%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded">
              <div className="w-2 h-2 bg-red-500 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

