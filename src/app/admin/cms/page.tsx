export default function AdminCMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Sistema de Gestión de Contenido</h1>
        <p className="text-slate-400 mt-1">
          Gestiona blog posts, páginas, testimonials y archivos multimedia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-white flex items-center font-semibold mb-3">
            📝 Blog Posts
          </h3>
          <p className="text-slate-400 text-sm mb-4">Gestiona artículos y contenido del blog</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Publicados: 12</span>
            <span className="text-emerald-400">Borradores: 3</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-white flex items-center font-semibold mb-3">
            📄 Páginas
          </h3>
          <p className="text-slate-400 text-sm mb-4">Administra páginas estáticas del sitio</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Activas: 8</span>
            <span className="text-amber-400">En revisión: 2</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-white flex items-center font-semibold mb-3">
            ⭐ Testimonials
          </h3>
          <p className="text-slate-400 text-sm mb-4">Gestiona reseñas y testimonios</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Aprobados: 15</span>
            <span className="text-blue-400">Pendientes: 4</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-white flex items-center font-semibold mb-3">
            🖼️ Media Library
          </h3>
          <p className="text-slate-400 text-sm mb-4">Biblioteca de archivos multimedia</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Archivos: 234</span>
            <span className="text-purple-400">Espacio: 2.1GB</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">📊 Estadísticas de Contenido</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">12,847</div>
            <div className="text-slate-400 text-sm">Visitas totales</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">8.4min</div>
            <div className="text-slate-400 text-sm">Tiempo promedio de lectura</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">94%</div>
            <div className="text-slate-400 text-sm">Tasa de engagement</div>
          </div>
        </div>
      </div>
    </div>
  )
}

