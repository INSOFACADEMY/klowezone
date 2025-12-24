'use client'

import { useState, useEffect } from 'react'
import { Users, Search, UserPlus, Edit, Ban, CheckCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  isVerified: boolean
  role: {
    id: string
    name: string
  }
  lastLogin: Date | null
  createdAt: Date
}

function getRoleColor(roleName: string): string {
  switch (roleName) {
    case 'SUPER_ADMIN': return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'ADMIN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'CLIENT': return 'bg-green-500/10 text-green-400 border-green-500/20'
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}

export default function AdminClientsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  // Mock users for now
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@klowezone.com',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isVerified: true,
        role: { id: '1', name: 'SUPER_ADMIN' },
        lastLogin: new Date(),
        createdAt: new Date('2024-01-01')
      },
      {
        id: '2',
        email: 'cliente@klowezone.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        isActive: true,
        isVerified: true,
        role: { id: '2', name: 'CLIENT' },
        lastLogin: new Date(Date.now() - 86400000), // 1 day ago
        createdAt: new Date('2024-01-15')
      }
    ]
    setUsers(mockUsers)
    setTotal(mockUsers.length)
  }, [])

  const loadUsers = async () => {
    // For now, just reload mock data
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateUserStatus(userId, isActive)
      await loadUsers() // Reload users
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)

    const matchesRole = roleFilter === 'all' || user.role.name === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'ADMIN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'CLIENT': return 'bg-green-500/10 text-green-400 border-green-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400 mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-colors">
          <UserPlus className="w-4 h-4 inline mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
          >
            <option value="all">Todos los roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="CLIENT">Cliente</option>
          </select>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors"
          >
            <Search className="w-4 h-4 inline mr-2" />
            Buscar
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-white flex items-center font-semibold">
            <Users className="w-5 h-5 mr-2 text-blue-400" />
            Usuarios ({filteredUsers.length} de {total})
          </h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Usuario</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Rol</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Último Login</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-slate-400 text-sm">
                            Miembro desde {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-300">{user.email}</p>
                      {user.isVerified && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verificado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded border ${getRoleColor(user.role.name)}`}>
                        {user.role.name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded border ${
                        user.isActive
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-400 text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(user.id, !user.isActive)}
                          className={`p-2 rounded transition-colors ${
                            user.isActive
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          }`}
                        >
                          {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-slate-400 text-sm">
              Mostrando {filteredUsers.length} de {total} usuarios
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-slate-400 text-sm px-3">Página {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={filteredUsers.length < 10}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

