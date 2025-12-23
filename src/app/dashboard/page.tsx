'use client'

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { getClients, getClientStats, Client } from "@/lib/clients";
import { getProjectStats } from "@/lib/projects";
import { Users, Target, TrendingUp, Sparkles, BarChart3, Search, Plus, Menu, X, Edit, Trash2, AlertCircle, Check, CheckCircle, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient, insertTestClients } from "@/lib/clients";
import { createProject, getProjects, updateProject, deleteProject, Project } from "@/lib/projects";

export default function DashboardNewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientStats, setClientStats] = useState({ total: 0, activos: 0, nuevosEsteMes: 0 });
  const [projectStats, setProjectStats] = useState({ total: 0, completados: 0, enProgreso: 0, planificacion: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInsertingTestData, setIsInsertingTestData] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [newClient, setNewClient] = useState({
    nombre: '',
    email: '',
    telefono: '',
    estado: 'Activo' as const,
    notas: ''
  });
  const [newProject, setNewProject] = useState({
    cliente_id: '',
    nombre_proyecto: '',
    prioridad: 'Media' as const,
    estado: 'Planificación' as const,
    fecha_entrega: '',
    descripcion: ''
  });
  const [editProject, setEditProject] = useState({
    cliente_id: '',
    nombre_proyecto: '',
    prioridad: 'Media' as const,
    estado: 'Planificación' as const,
    fecha_entrega: '',
    descripcion: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load data function with useCallback
  const loadData = useCallback(async () => {
    try {
      const [clientsData, projectsData, clientStatsData, projectStatsData] = await Promise.all([
        getClients(),
        getProjects(),
        getClientStats(),
        getProjectStats()
      ]);
      setClients(clientsData);
      setFilteredClients(clientsData);
      setProjects(projectsData);
      setClientStats(clientStatsData);
      setProjectStats(projectStatsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Handle create client function
  const handleCreateClient = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones robustas - NO permitir valores null o vacíos
    const validationErrors: Record<string, string> = {};

    const nombreTrimmed = newClient.nombre?.trim();
    const emailTrimmed = newClient.email?.trim();

    if (!nombreTrimmed || nombreTrimmed.length === 0) {
      validationErrors.nombre = 'El nombre del cliente es obligatorio y no puede estar vacío';
    }

    if (!emailTrimmed || emailTrimmed.length === 0) {
      validationErrors.email = 'El email del cliente es obligatorio y no puede estar vacío';
    } else if (!/\S+@\S+\.\S+/.test(emailTrimmed)) {
      validationErrors.email = 'El email debe tener un formato válido (ej: usuario@dominio.com)';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // NO enviar a Supabase, mantener modal abierto
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Asegurar que enviamos datos limpios y no null
      const clientData = {
        nombre: nombreTrimmed,
        email: emailTrimmed,
        telefono: newClient.telefono?.trim() && newClient.telefono.trim().length > 0 ? newClient.telefono.trim() : undefined,
        estado: newClient.estado && newClient.estado.trim().length > 0 ? newClient.estado : 'Activo',
        notas: newClient.notas?.trim() && newClient.notas.trim().length > 0 ? newClient.notas.trim() : undefined
      };

      await createClient(clientData);

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
      setErrors({ general: 'Error al crear el cliente. Verifica tu conexión e inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [newClient, loadData]);

  // Handle create project function
  const handleCreateProject = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones robustas para proyectos - NO permitir valores null
    const validationErrors: Record<string, string> = {};

    const clienteIdTrimmed = newProject.cliente_id?.trim();
    const nombreProyectoTrimmed = newProject.nombre_proyecto?.trim();

    if (!clienteIdTrimmed || clienteIdTrimmed.length === 0) {
      validationErrors.cliente_id = 'Debes seleccionar un cliente para el proyecto';
    }

    if (!nombreProyectoTrimmed || nombreProyectoTrimmed.length === 0) {
      validationErrors.nombre_proyecto = 'El nombre del proyecto es obligatorio y no puede estar vacío';
    } else if (nombreProyectoTrimmed.length < 3) {
      validationErrors.nombre_proyecto = 'El nombre del proyecto debe tener al menos 3 caracteres';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // NO enviar a Supabase si hay errores
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await createProject({
        cliente_id: newProject.cliente_id,
        nombre_proyecto: newProject.nombre_proyecto,
        prioridad: newProject.prioridad,
        fecha_entrega: newProject.fecha_entrega || undefined,
        descripcion: newProject.descripcion || undefined,
        estado: 'Planificación'
      });

      setNewProject({
        cliente_id: '',
        nombre_proyecto: '',
        prioridad: 'Media',
        fecha_entrega: '',
        descripcion: ''
      });
      setIsProjectModalOpen(false);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error creating project:', error);
      setErrors({ general: 'Error al crear el proyecto' });
    } finally {
      setIsSubmitting(false);
    }
  }, [newProject, loadData]);

  // Handle project status change
  const handleProjectStatusChange = useCallback(async (projectId: string, newStatus: string) => {
    try {
      await updateProject(projectId, { estado: newStatus as any });
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  }, [loadData]);

  // Handle project edit
  const handleProjectEdit = useCallback((project: Project) => {
    setProjectToEdit(project);
    setEditProject({
      cliente_id: project.cliente_id,
      nombre_proyecto: project.nombre_proyecto,
      prioridad: project.prioridad,
      estado: project.estado,
      fecha_entrega: project.fecha_entrega || '',
      descripcion: project.descripcion || ''
    });
    setIsEditModalOpen(true);
  }, []);

  // Handle project edit submit
  const handleProjectEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectToEdit || !editProject.nombre_proyecto.trim()) {
      setErrors({ nombre_proyecto: 'El nombre es requerido' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateProject(projectToEdit.id!, {
        cliente_id: editProject.cliente_id,
        nombre_proyecto: editProject.nombre_proyecto,
        prioridad: editProject.prioridad,
        estado: editProject.estado,
        fecha_entrega: editProject.fecha_entrega || undefined,
        descripcion: editProject.descripcion || undefined
      });

      setIsEditModalOpen(false);
      setProjectToEdit(null);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error updating project:', error);
      setErrors({ general: 'Error al actualizar el proyecto' });
    } finally {
      setIsSubmitting(false);
    }
  }, [projectToEdit, editProject, loadData]);

  // Handle project delete (open modal)
  const handleProjectDelete = useCallback((project: Project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  }, []);

  // Handle project delete confirm
  const handleProjectDeleteConfirm = useCallback(async () => {
    if (!projectToDelete) return;

    setIsSubmitting(true);
    try {
      await deleteProject(projectToDelete.id!);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting project:', error);
      setErrors({ general: 'Error al eliminar el proyecto' });
    } finally {
      setIsSubmitting(false);
    }
  }, [projectToDelete, loadData]);

  // Check if project has urgent deadline (less than 3 days)
  const isUrgentDeadline = useCallback((fechaEntrega: string | undefined) => {
    if (!fechaEntrega) return false;

    const today = new Date();
    const deliveryDate = new Date(fechaEntrega);
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 3 && diffDays >= 0;
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
        setErrors({ general: 'Error al cerrar sesión. Inténtalo de nuevo.' });
      } else {
        // Redirigir a la página de inicio
        router.push('/');
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      setErrors({ general: 'Error inesperado al cerrar sesión.' });
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

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
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error getting user:', error);
          router.push('/login');
          return;
        }

        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error during auth check:', err);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
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
      title: "Total Proyectos",
      value: projectStats.total.toString(),
      icon: BarChart3,
      color: "from-purple-500 to-pink-500"
    }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Validando sesión...</p>
          <p className="text-slate-500 text-sm mt-2">Verificando credenciales de acceso</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-slate-400">
                Bienvenido {user?.user_metadata?.full_name || user?.email}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
            >
              {isLoggingOut ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Cerrando...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </div>
              )}
            </Button>
          </div>
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
                      disabled={isSubmitting || !newClient.nombre.trim() || !newClient.email.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creando...' : 'Crear Cliente'}
                    </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Proyecto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl text-white">Crear Nuevo Proyecto</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Asigna este proyecto a un cliente existente
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cliente_id" className="text-slate-300">Cliente *</Label>
                        <Select value={newProject.cliente_id} onValueChange={(value) => setNewProject(prev => ({ ...prev, cliente_id: value }))}>
                          <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                            <SelectValue placeholder="Selecciona un cliente" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id!} className="text-white hover:bg-slate-700">
                                {client.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.cliente_id && <p className="text-sm text-red-400 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.cliente_id}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project_name" className="text-slate-300">Nombre del Proyecto *</Label>
                        <Input
                          id="project_name"
                          value={newProject.nombre_proyecto}
                          onChange={(e) => setNewProject(prev => ({ ...prev, nombre_proyecto: e.target.value }))}
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                          placeholder="Nombre del proyecto"
                        />
                        {errors.nombre_proyecto && <p className="text-sm text-red-400 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.nombre_proyecto}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="prioridad" className="text-slate-300">Prioridad</Label>
                          <Select value={newProject.prioridad} onValueChange={(value: any) => setNewProject(prev => ({ ...prev, prioridad: value }))}>
                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              <SelectItem value="Urgente" className="text-red-400 hover:bg-slate-700">🔴 Urgente</SelectItem>
                              <SelectItem value="Alta" className="text-orange-400 hover:bg-slate-700">🟠 Alta</SelectItem>
                              <SelectItem value="Media" className="text-yellow-400 hover:bg-slate-700">🟡 Media</SelectItem>
                              <SelectItem value="Baja" className="text-green-400 hover:bg-slate-700">🟢 Baja</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="estado" className="text-slate-300">Estado</Label>
                          <Select value={newProject.estado} onValueChange={(value: any) => setNewProject(prev => ({ ...prev, estado: value }))}>
                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              <SelectItem value="Planificación" className="text-slate-400 hover:bg-slate-700">📋 Planificación</SelectItem>
                              <SelectItem value="En Progreso" className="text-blue-400 hover:bg-slate-700">⚡ En Progreso</SelectItem>
                              <SelectItem value="Completado" className="text-green-400 hover:bg-slate-700">✅ Completado</SelectItem>
                              <SelectItem value="Pausado" className="text-yellow-400 hover:bg-slate-700">⏸️ Pausado</SelectItem>
                              <SelectItem value="Cancelado" className="text-red-400 hover:bg-slate-700">❌ Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fecha_entrega" className="text-slate-300">Fecha de Entrega</Label>
                        <Input
                          id="fecha_entrega"
                          type="date"
                          value={newProject.fecha_entrega}
                          onChange={(e) => setNewProject(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                          className="bg-slate-800/50 border-slate-600 text-white"
                        />
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
                          onClick={() => setIsProjectModalOpen(false)}
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Cancelar
                        </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !newProject.cliente_id.trim() || !newProject.nombre_proyecto.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
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

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8"
        >
          <Card className="bg-slate-900/40 backdrop-blur-lg border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                Proyectos Activos
              </CardTitle>
              <CardDescription className="text-slate-400">
                {projects.filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado').length} proyectos activos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado').slice(0, 6).map((project, index) => {
                  // Calcular progreso y color basado en estado
                  const getProgressInfo = (estado: string) => {
                    switch (estado) {
                      case 'Planificación':
                        return { progress: 25, color: 'from-slate-400 to-slate-500', bgColor: 'bg-slate-500' };
                      case 'En Progreso':
                        return { progress: 65, color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-500' };
                      case 'Completado':
                        return { progress: 100, color: 'from-green-400 to-green-600', bgColor: 'bg-green-500' };
                      case 'Pausado':
                        return { progress: 40, color: 'from-yellow-400 to-yellow-600', bgColor: 'bg-yellow-500' };
                      case 'Cancelado':
                        return { progress: 0, color: 'from-red-400 to-red-600', bgColor: 'bg-red-500' };
                      default:
                        return { progress: 0, color: 'from-slate-400 to-slate-500', bgColor: 'bg-slate-500' };
                    }
                  };

                  const progressInfo = getProgressInfo(project.estado);
                  const priorityColor = {
                    'Urgente': 'text-red-400 bg-red-500/20 border-red-500/30',
                    'Alta': 'text-orange-400 bg-orange-500/20 border-orange-500/30',
                    'Media': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
                    'Baja': 'text-green-400 bg-green-500/20 border-green-500/30'
                  }[project.prioridad] || 'text-slate-400 bg-slate-500/20 border-slate-500/30';

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border transition-all duration-200 group ${
                        isUrgentDeadline(project.fecha_entrega)
                          ? 'border-amber-500/50 shadow-lg shadow-amber-500/10 animate-pulse'
                          : 'border-slate-700/50 hover:border-slate-600/50'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold mb-1 truncate group-hover:text-blue-400 transition-colors">
                            {project.nombre_proyecto}
                          </h4>
                          <p className="text-sm text-slate-400 truncate">
                            👤 {project.cliente_nombre}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColor}`}>
                            {project.prioridad}
                          </span>
                        </div>
                      </div>

                      {/* Estado y Progreso */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">Estado</span>
                          <div className="flex items-center space-x-2">
                            {isUrgentDeadline(project.fecha_entrega) && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-2 h-2 bg-amber-500 rounded-full"
                                title="Fecha de entrega cercana"
                              />
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              project.estado === 'En Progreso' ? 'bg-blue-500/20 text-blue-400' :
                              project.estado === 'Planificación' ? 'bg-slate-500/20 text-slate-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {project.estado}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Progreso</span>
                            <span>{progressInfo.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressInfo.progress}%` }}
                              transition={{ duration: 1.2, delay: 0.3 + (0.1 * index), ease: "easeOut" }}
                              className={`h-2 rounded-full bg-gradient-to-r ${progressInfo.color} shadow-sm`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Fecha de entrega */}
                      {project.fecha_entrega && (
                        <div className="mb-4 text-xs text-slate-400 bg-slate-700/30 rounded-lg px-3 py-2">
                          📅 Entrega: {new Date(project.fecha_entrega).toLocaleDateString('es-ES')}
                        </div>
                      )}

                      {/* Acciones rápidas */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProjectEdit(project)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                            title="Editar proyecto"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Select onValueChange={(value) => handleProjectStatusChange(project.id!, value)}>
                            <SelectTrigger className="h-8 w-8 p-0 bg-transparent border-0 hover:bg-slate-700/50">
                              <BarChart3 className="w-4 h-4 text-slate-400 hover:text-blue-400" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600 min-w-[140px]">
                              <SelectItem value="Planificación" className="text-slate-400 hover:bg-slate-700">📋 Planificación</SelectItem>
                              <SelectItem value="En Progreso" className="text-blue-400 hover:bg-slate-700">⚡ En Progreso</SelectItem>
                              <SelectItem value="Completado" className="text-green-400 hover:bg-slate-700">✅ Completado</SelectItem>
                              <SelectItem value="Pausado" className="text-yellow-400 hover:bg-slate-700">⏸️ Pausado</SelectItem>
                              <SelectItem value="Cancelado" className="text-red-400 hover:bg-slate-700">❌ Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProjectStatusChange(project.id!, 'Completado')}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-green-400 hover:bg-green-500/10"
                            title="Marcar completado"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProjectDelete(project)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {projects.filter(p => p.estado === 'En Progreso' || p.estado === 'Planificación').length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No hay proyectos activos
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Crea tu primer proyecto para comenzar a trabajar
                  </p>
                  <Button
                    onClick={() => setIsProjectModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Proyecto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Project Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Editar Proyecto</DialogTitle>
              <DialogDescription className="text-slate-400">
                Actualiza la información del proyecto
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleProjectEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_cliente_id" className="text-slate-300">Cliente</Label>
                <Select value={editProject.cliente_id} onValueChange={(value) => setEditProject(prev => ({ ...prev, cliente_id: value }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id!} className="text-white hover:bg-slate-700">
                        {client.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_project_name" className="text-slate-300">Nombre del Proyecto *</Label>
                <Input
                  id="edit_project_name"
                  value={editProject.nombre_proyecto}
                  onChange={(e) => setEditProject(prev => ({ ...prev, nombre_proyecto: e.target.value }))}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="Nombre del proyecto"
                />
                {errors.nombre_proyecto && <p className="text-sm text-red-400 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.nombre_proyecto}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_prioridad" className="text-slate-300">Prioridad</Label>
                  <Select value={editProject.prioridad} onValueChange={(value: any) => setEditProject(prev => ({ ...prev, prioridad: value }))}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="Urgente" className="text-red-400 hover:bg-slate-700">🔴 Urgente</SelectItem>
                      <SelectItem value="Alta" className="text-orange-400 hover:bg-slate-700">🟠 Alta</SelectItem>
                      <SelectItem value="Media" className="text-yellow-400 hover:bg-slate-700">🟡 Media</SelectItem>
                      <SelectItem value="Baja" className="text-green-400 hover:bg-slate-700">🟢 Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_estado" className="text-slate-300">Estado</Label>
                  <Select value={editProject.estado} onValueChange={(value: any) => setEditProject(prev => ({ ...prev, estado: value }))}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="Planificación" className="text-slate-400 hover:bg-slate-700">📋 Planificación</SelectItem>
                      <SelectItem value="En Progreso" className="text-blue-400 hover:bg-slate-700">⚡ En Progreso</SelectItem>
                      <SelectItem value="Completado" className="text-green-400 hover:bg-slate-700">✅ Completado</SelectItem>
                      <SelectItem value="Pausado" className="text-yellow-400 hover:bg-slate-700">⏸️ Pausado</SelectItem>
                      <SelectItem value="Cancelado" className="text-red-400 hover:bg-slate-700">❌ Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_fecha_entrega" className="text-slate-300">Fecha de Entrega</Label>
                <Input
                  id="edit_fecha_entrega"
                  type="date"
                  value={editProject.fecha_entrega}
                  onChange={(e) => setEditProject(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                  className="bg-slate-800/50 border-slate-600 text-white"
                />
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
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSubmitting ? 'Actualizando...' : 'Actualizar Proyecto'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-white flex items-center">
                <AlertCircle className="w-6 h-6 text-red-400 mr-2" />
                Confirmar Eliminación
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                ¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>

            {projectToDelete && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="text-white font-medium mb-2">{projectToDelete.nombre_proyecto}</h4>
                <p className="text-slate-400 text-sm">Cliente: {projectToDelete.cliente_nombre}</p>
                <p className="text-slate-400 text-sm">Estado: {projectToDelete.estado}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleProjectDeleteConfirm}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                {isSubmitting ? 'Eliminando...' : 'Eliminar Proyecto'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
