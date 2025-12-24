export default function AdminFeedbackPage() {
  const feedback = [
    {
      id: '1',
      user: 'Juan Pérez',
      email: 'juan@klowezone.com',
      subject: 'Problema con el timer de proyectos',
      message: 'El timer se congela después de 2 horas de uso continuo. Necesito poder trabajar sin interrupciones.',
      priority: 'high',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      type: 'bug'
    },
    {
      id: '2',
      user: 'María García',
      email: 'maria@cliente.com',
      subject: 'Sugerencia para nuevas funcionalidades',
      message: 'Me gustaría poder exportar reportes en formato PDF además del CSV actual.',
      priority: 'medium',
      status: 'in_progress',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      type: 'feature'
    },
    {
      id: '3',
      user: 'Carlos López',
      email: 'carlos@empresa.com',
      subject: 'Excelente experiencia de usuario',
      message: '¡Me encanta la nueva interfaz! Es mucho más intuitiva y rápida que la versión anterior.',
      priority: 'low',
      status: 'resolved',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      type: 'praise'
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20'
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-slate-400 bg-slate-500/10'
      case 'in_progress': return 'text-blue-400 bg-blue-500/10'
      case 'resolved': return 'text-green-400 bg-green-500/10'
      default: return 'text-slate-400 bg-slate-500/10'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛'
      case 'feature': return '💡'
      case 'praise': return '👍'
      default: return '💬'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sistema de Feedback</h1>
          <p className="text-slate-400 mt-1">
            Gestiona feedback de usuarios y soporte al cliente
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          Nuevo Ticket
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Pendientes</div>
            <div className="w-8 h-8 bg-slate-500/20 rounded-lg flex items-center justify-center">
              <span className="text-slate-400 text-sm">⏳</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">12</div>
          <div className="text-slate-400 text-sm">Requieren respuesta</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">En Progreso</div>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 text-sm">🔄</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">8</div>
          <div className="text-slate-400 text-sm">Siendo atendidos</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Resueltos</div>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400 text-sm">✅</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">145</div>
          <div className="text-slate-400 text-sm">Este mes</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-sm font-medium">Tiempo Promedio</div>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400 text-sm">⏱️</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">2.4h</div>
          <div className="text-slate-400 text-sm">Para resolver</div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-white font-semibold">💬 Bandeja de Mensajes</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getTypeIcon(item.type)}</span>
                    <div>
                      <h4 className="text-white font-medium">{item.subject}</h4>
                      <p className="text-slate-400 text-sm">
                        {item.user} • {item.email} • {item.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded border ${getPriorityColor(item.priority)}`}>
                      {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}>
                      {item.status === 'pending' ? 'Pendiente' :
                       item.status === 'in_progress' ? 'En Progreso' : 'Resuelto'}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm mb-3">{item.message}</p>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    Responder
                  </button>
                  <button className="px-3 py-1 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600 hover:text-white transition-colors">
                    Marcar Resuelto
                  </button>
                  <button className="px-3 py-1 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600 hover:text-white transition-colors">
                    Archivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

