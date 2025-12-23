'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getClients, getClientStats, Client } from '@/lib/clients'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [clientStats, setClientStats] = useState({ total: 0, activos: 0, nuevosEsteMes: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [clientsData, statsData] = await Promise.all([
          getClients(),
          getClientStats()
        ])

        setClients(clientsData)
        setFilteredClients(clientsData)
        setClientStats(statsData)
      } catch (error) {
        console.error('Error loading clients:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtrar clientes
  useEffect(() => {
    let filtered = clients

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefono?.includes(searchTerm)
      )
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.estado === statusFilter)
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter])

  const getStatusColor = (status: Client['estado']) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800 border-green-200'
      case 'Inactivo': return 'bg-red-100 text-red-800 border-red-200'
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Client['estado']) => {
    switch (status) {
      case 'Activo': return <UserCheck className="w-3 h-3" />
      case 'Inactivo': return <UserX className="w-3 h-3" />
      case 'Pendiente': return <Clock className="w-3 h-3" />
      default: return <Users className="w-3 h-3" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-slate-400">
            Gestiona tu base de clientes y mantén el seguimiento de sus proyectos
          </p>
        </motion.div>

        {/* Estadísticas rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-slate-400">Total Clientes</p>
                  <p className="text-2xl font-bold text-white">{clientStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-slate-400">Clientes Activos</p>
                  <p className="text-2xl font-bold text-white">{clientStats.activos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-slate-400">Nuevos Este Mes</p>
                  <p className="text-2xl font-bold text-white">{clientStats.nuevosEsteMes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Barra de herramientas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            {/* Filtros */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activos</SelectItem>
                <SelectItem value="Inactivo">Inactivos</SelectItem>
                <SelectItem value="Pendiente">Pendientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botón nuevo cliente */}
          <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </motion.div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {clients.length === 0 ? 'No tienes clientes' : 'No se encontraron clientes'}
            </h2>
            <p className="text-slate-400 mb-6">
              {clients.length === 0
                ? 'Agrega tu primer cliente para comenzar'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Cliente
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300 font-semibold">Cliente</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Contacto</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Estado</TableHead>
                  <TableHead className="text-slate-300 font-semibold">Última Actividad</TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-slate-700/50 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {client.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{client.nombre}</p>
                          <p className="text-sm text-slate-400">
                            ID: {client.id?.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-300">{client.email}</span>
                          </div>
                        )}
                        {client.telefono && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-300">{client.telefono}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={`flex items-center gap-1 ${getStatusColor(client.estado)}`}>
                        {getStatusIcon(client.estado)}
                        {client.estado}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-slate-400">
                        {client.created_at ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(client.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Sin actividad</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Editar cliente
                          }}
                          className="text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Eliminar cliente
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </div>
    </div>
  )
}
