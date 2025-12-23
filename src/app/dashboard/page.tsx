'use client'

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { getClients, getClientStats, Client } from "@/lib/clients";
import { Users, Target, TrendingUp, Sparkles, Search, Plus, Menu, X, Edit, Trash2, AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient, insertTestClients } from "@/lib/clients";

export default function DashboardNewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState({ total: 0, activos: 0, nuevosEsteMes: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInsertingTestData, setIsInsertingTestData] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: '',
    email: '',
    telefono: '',
    estado: 'Activo' as const,
    notas: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load data function with useCallback
  const loadData = useCallback(async () => {
    try {
      const [clientsData, statsData] = await Promise.all([
        getClients(),
        getClientStats()
      ]);
      setClients(clientsData);
      setFilteredClients(clientsData);
      setClientStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Handle create client function
  const handleCreateClient = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newClient.nombre.trim()) {
      setErrors({ nombre: 'El nombre es requerido' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await createClient({
        nombre: newClient.nombre,
        email: newClient.email || undefined,
        telefono: newClient.telefono || undefined,
        estado: newClient.estado,
        notas: newClient.notas || undefined
      });

      setNewClient({
        nombre: '',
        email: '',
        telefono: '',
        estado: 'Activo',
        notas: ''
      });
      setIsModalOpen(false);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error creating client:', error);
      setErrors({ general: 'Error al crear el cliente' });
    } finally {
      setIsSubmitting(false);
    }
  }, [newClient, loadData]);

  // Handle insert test data function
  const handleInsertTestData = useCallback(async () => {
    setIsInsertingTestData(true);
    try {
      await insertTestClients();
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error inserting test data:', error);
    } finally {
      setIsInsertingTestData(false);
    }
  }, [loadData]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Filter clients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
  }, [clients, searchQuery]);

  const stats = [
    {
      title: "Total Clientes",
      value: clientStats.total.toString(),
      icon: Users,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Clientes Activos",
      value: clientStats.activos.toString(),
      icon: Target,
      color: "from-emerald-500 to-teal-500"
    },
    {
      title: "Nuevos Este Mes",
      value: clientStats.nuevosEsteMes.toString(),
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Proyectos",
      value: "0",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-slate-400">
            Bienvenido {user?.user_metadata?.full_name || user?.email}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Clients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar clientes por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/30 border border-slate-600/50 rounded-lg text-white placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <Card className="bg-slate-900/40 backdrop-blur-lg border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Gestión de Clientes</CardTitle>
              <CardDescription className="text-slate-400">
                {filteredClients.length} de {clients.length} clientes
              </CardDescription>
              <div className="flex gap-3">
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl text-white">Añadir Nuevo Cliente</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Completa la información del cliente
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateClient} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-slate-300">Nombre *</Label>
                        <Input
                          id="nombre"
                          value={newClient.nombre}
                          onChange={(e) => setNewClient(prev => ({ ...prev, nombre: e.target.value }))}
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                          placeholder="Nombre del cliente"
                        />
                        {errors.nombre && <p className="text-sm text-red-400 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.nombre}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                          placeholder="cliente@email.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefono" className="text-slate-300">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={newClient.telefono}
                          onChange={(e) => setNewClient(prev => ({ ...prev, telefono: e.target.value }))}
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                          placeholder="+1234567890"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estado" className="text-slate-300">Estado</Label>
                        <Select value={newClient.estado} onValueChange={(value: any) => setNewClient(prev => ({ ...prev, estado: value }))}>
                          <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="Activo" className="text-white hover:bg-slate-700">Activo</SelectItem>
                            <SelectItem value="Pendiente" className="text-white hover:bg-slate-700">Pendiente</SelectItem>
                            <SelectItem value="Inactivo" className="text-white hover:bg-slate-700">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {errors.general && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <p className="text-sm text-red-400">{errors.general}</p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                        >
                          {isSubmitting ? 'Creando...' : 'Crear Cliente'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={handleInsertTestData}
                  disabled={isInsertingTestData}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  {isInsertingTestData ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Insertando...
                    </div>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Datos de Prueba
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredClients.length === 0 ? (
                <div className="p-12">
                  {searchQuery ? (
                    <div className="text-center">
                      <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No se encontraron resultados
                      </h3>
                      <p className="text-slate-400">
                        No hay clientes que coincidan con "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-20 h-20 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20"
                      >
                        <Users className="w-10 h-10 text-blue-400" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        ¡Comienza tu viaje!
                      </h3>
                      <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Aún no tienes clientes registrados. Comienza añadiendo tu primer cliente
                        para gestionar tus proyectos de manera profesional.
                      </p>
                      <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir mi primer cliente
                      </Button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-700/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Cliente</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Email</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Estado</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Teléfono</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Fecha</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client, index) => (
                        <motion.tr
                          key={client.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 * index }}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white font-semibold text-sm">
                                  {client.nombre.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{client.nombre}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-300">{client.email || '-'}</td>
                          <td className="p-4">
                            <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                              {client.estado}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-300">{client.telefono || '-'}</td>
                          <td className="p-4 text-slate-300">
                            {client.created_at ? new Date(client.created_at).toLocaleDateString('es-ES') : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
