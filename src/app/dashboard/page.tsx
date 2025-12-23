'use client'

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { getClients, getClientStats, Client } from "@/lib/clients";
import { getProjectStats, getProjects, Project } from "@/lib/projects";
import { getUserProfile, UserProfile } from "@/lib/user-profiles";
import {
  Users, Target, TrendingUp, Sparkles, BarChart3, Search, Plus, Menu, X, Edit, Trash2,
  AlertCircle, CheckCircle, LogOut, User, Briefcase, Receipt, FileText, Settings,
  Building2, Globe, DollarSign, Calendar, ChevronRight, Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient, insertTestClients } from "@/lib/clients";
import { createProject, updateProject, deleteProject } from "@/lib/projects";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
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
    console.log('🔄 Iniciando carga de datos del dashboard...');
    try {
      console.log('📡 Ejecutando consultas paralelas...');

      const [clientsData, projectsData, clientStatsData, projectStatsData] = await Promise.all([
        getClients(),
        getProjects(),
        getClientStats(),
        getProjectStats()
      ]);

      console.log('✅ Datos cargados exitosamente:', {
        clients: clientsData?.length || 0,
        projects: projectsData?.length || 0,
        clientStats: clientStatsData,
        projectStats: projectStatsData
      });

      setClients(clientsData || []);
      setFilteredClients(clientsData || []);
      setProjects(projectsData || []);
      setClientStats(clientStatsData || { total: 0, activos: 0, nuevosEsteMes: 0 });
      setProjectStats(projectStatsData || { total: 0, completados: 0, enProgreso: 0, planificacion: 0 });

      console.log('🎯 Estado actualizado correctamente');
      setLoading(false); // Asegurar que loading termine
    } catch (error) {
      console.error('❌ Error loading data:', error);
      console.error('Detalles del error:', error);

      // Resetear estado en caso de error para evitar bucles
      setClients([]);
      setFilteredClients([]);
      setProjects([]);
      setClientStats({ total: 0, activos: 0, nuevosEsteMes: 0 });
      setProjectStats({ total: 0, completados: 0, enProgreso: 0, planificacion: 0 });
      setLoading(false); // Importante: terminar el estado de carga

      // Mostrar error al usuario pero no bloquear la UI
      console.error('No se pudieron cargar los datos. Revisa la conexión a Supabase.');
    }
  }, []);

  // Check authentication and onboarding
  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      console.log('🔐 Iniciando verificación de autenticación y onboarding...');

      try {
        console.log('👤 Verificando usuario autenticado...');
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('❌ Error de autenticación:', error);
          router.push('/login');
          return;
        }

        if (!user) {
          console.log('⚠️ No hay usuario autenticado, redirigiendo a login');
          router.push('/login');
          return;
        }

        console.log('✅ Usuario autenticado:', user.id);
        setUser(user);

        // Pequeño delay para permitir que los datos del onboarding se propaguen
        console.log('⏳ Esperando propagación de datos del onboarding (1s)...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if onboarding is completed
        console.log('📋 Verificando estado del onboarding...');
        const profile = await getUserProfile();

        console.log('Perfil obtenido:', {
          exists: !!profile,
          onboarding_completed: profile?.onboarding_completed,
          business_name: profile?.business_name
        });

        if (!profile?.onboarding_completed) {
          console.log('⚠️ Onboarding no completado, redirigiendo...');
          router.push('/onboarding');
          return;
        }

        console.log('✅ Onboarding completado, cargando dashboard...');
        setUserProfile(profile);
        setAuthLoading(false);
      } catch (error) {
        console.error('❌ Error en verificación de auth:', error);
        console.error('Detalles del error:', error);
        // En caso de error, asegurar que no se quede en loading infinito
        setAuthLoading(false);
        router.push('/login');
      }
    };

    checkAuthAndOnboarding();
  }, [router]);

  useEffect(() => {
    if (user && !authLoading) {
      console.log('🚀 Ejecutando carga inicial de datos...');
      loadData();
    }
  }, [user, authLoading]); // Solo ejecutar cuando el usuario esté autenticado y la verificación haya terminado

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

  const getProgressInfo = useCallback((estado: Project['estado']) => {
    switch (estado) {
      case 'Planificación': return { progress: 25, color: 'bg-gradient-to-r from-slate-400 to-slate-500' };
      case 'En Progreso': return { progress: 65, color: 'bg-gradient-to-r from-blue-400 to-blue-600' };
      case 'Completado': return { progress: 100, color: 'bg-gradient-to-r from-green-400 to-green-600' };
      case 'Pausado': return { progress: 40, color: 'bg-gradient-to-r from-yellow-400 to-yellow-600' };
      case 'Cancelado': return { progress: 0, color: 'bg-gradient-to-r from-red-400 to-red-600' };
      default: return { progress: 0, color: 'bg-gradient-to-r from-slate-500 to-slate-600' };
    }
  }, []);

  const isUrgentDeadline = (fechaEntrega: string | null | undefined) => {
    if (!fechaEntrega) return false;
    const today = new Date();
    const entrega = new Date(fechaEntrega);
    const diffTime = entrega.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle create client function
  const handleCreateClient = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🏗️ Iniciando creación de cliente...');

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
      console.log('❌ Errores de validación:', validationErrors);
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

      console.log('📤 Enviando datos a Supabase:', clientData);
      await createClient(clientData);
      console.log('✅ Cliente creado exitosamente');

      setNewClient({
        nombre: '',
        email: '',
        telefono: '',
        estado: 'Activo',
        notas: ''
      });
      setIsModalOpen(false);
      console.log('🔄 Recargando datos...');
      await loadData(); // Reload data
    } catch (error) {
      console.error('❌ Error creating client:', error);
      console.error('Detalles del error:', error);
      setErrors({ general: 'Error al crear el cliente. Verifica tu conexión e inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [loadData]);

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
        estado: 'Planificación',
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
  }, [loadData]);

  const handleInsertTestData = useCallback(async () => {
    setIsInsertingTestData(true);
    try {
      await insertTestClients();
      await loadData();
    } catch (error) {
      console.error('Error inserting test data:', error);
    } finally {
      setIsInsertingTestData(false);
    }
  }, [loadData]);

  // Timeout de respaldo por si la autenticación se queda colgada
  useEffect(() => {
    if (authLoading) {
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout de respaldo activado - forzando fin de loading');
        setAuthLoading(false);
      }, 10000); // 10 segundos máximo

      return () => clearTimeout(timeout);
    }
  }, [authLoading]);

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
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-lg border-r border-slate-700/50 z-40">
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center mb-8">
            <Sparkles className="w-8 h-8 text-emerald-400 mr-3" />
            <h2 className="text-xl font-bold">Klowezone</h2>
          </div>

          <nav className="flex-1 space-y-2">
            <div className="text-slate-400 text-sm font-medium mb-4">NAVEGACIÓN</div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center text-emerald-400">
                <BarChart3 className="w-5 h-5 mr-3" />
                <span className="font-medium">Dashboard</span>
              </div>
            </div>
          </nav>

          <div className="border-t border-slate-700/50 pt-4">
            <div className="flex items-center mb-4 p-3 bg-slate-800/30 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {userProfile?.business_name || 'Sin configurar'}
                </p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="ghost"
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start"
            >
              {isLoggingOut ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                  Cerrando...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Header with Actions */}
        <header className="bg-slate-900/60 backdrop-blur-lg border-b border-slate-700/50 p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold mb-2">
              Hola {user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'}
              {userProfile && (
                <span className="text-slate-400 font-normal">
                  , configurando tu espacio para {userProfile.business_type.toLowerCase()} en {userProfile.location}
                </span>
              )}
            </h1>
            <p className="text-slate-400">
              Gestiona tus clientes y proyectos de manera profesional
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-4"
          >
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Proyecto
                </Button>
              </DialogTrigger>
            </Dialog>

            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <Receipt className="w-4 h-4 mr-2" />
              Crear Factura
            </Button>

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
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Datos de Prueba
                </div>
              )}
            </Button>
          </motion.div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column - 70% */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Summary Card */}
              {userProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="text-white flex items-center">
                        <Building2 className="w-5 h-5 mr-3 text-blue-400" />
                        Resumen de Negocio
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                          <Building2 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 mb-1">Tipo</p>
                          <p className="text-sm font-medium text-white">{userProfile.business_type}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                          <Globe className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 mb-1">Ubicación</p>
                          <p className="text-sm font-medium text-white">{userProfile.location}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                          <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 mb-1">Equipo</p>
                          <p className="text-sm font-medium text-white">{userProfile.team_size}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 mb-1">Moneda</p>
                          <p className="text-sm font-medium text-white">{userProfile.currency}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Clients Management */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="w-5 h-5 mr-3 text-blue-400" />
                      Gestión de Clientes
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {filteredClients.length} de {clients.length} clientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Search Bar */}
                    <div className="px-6 pb-4">
                      <div className="relative">
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

                    {/* Clients Table */}
                    <div className="px-6 pb-6">
                      {filteredClients.length === 0 ? (
                        <div className="text-center py-12">
                          {searchQuery ? (
                            <div>
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
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-center"
                            >
                              <Users className="w-20 h-20 text-slate-600 mx-auto mb-6" />
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
                        <div className="space-y-3">
                          {filteredClients.map((client, index) => (
                            <motion.div
                              key={client.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/50 transition-colors cursor-pointer group"
                              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {client.nombre.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                                      {client.nombre}
                                    </h4>
                                    <p className="text-slate-400 text-sm">{client.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Badge
                                    variant="outline"
                                    className={`${
                                      client.estado === 'Activo'
                                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                                        : client.estado === 'Pendiente'
                                        ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                                        : 'border-red-500 text-red-400 bg-red-500/10'
                                    }`}
                                  >
                                    {client.estado}
                                  </Badge>
                                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar Column - 30% */}
            <div className="space-y-6">
              {/* Projects Activity */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Briefcase className="w-5 h-5 mr-3 text-purple-400" />
                      Proyectos Activos
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {projects.filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado').length} proyectos en curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="px-6 pb-6">
                      {projects.filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado').length === 0 ? (
                        <div className="text-center py-8">
                          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400 text-sm">
                            No hay proyectos activos
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {projects
                            .filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado')
                            .slice(0, 5)
                            .map((project, index) => {
                              const progressInfo = getProgressInfo(project.estado);
                              return (
                                <motion.div
                                  key={project.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 + (index * 0.1) }}
                                  className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border transition-all duration-200 ${
                                    isUrgentDeadline(project.fecha_entrega)
                                      ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                                      : 'border-slate-700/50'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-white font-medium text-sm truncate mb-1">
                                        {project.nombre_proyecto}
                                      </h4>
                                      <p className="text-slate-400 text-xs truncate">
                                        {project.cliente_nombre}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs px-2 py-0.5 ml-2 ${
                                        project.prioridad === 'Urgente'
                                          ? 'border-red-500 text-red-400 bg-red-500/10'
                                          : project.prioridad === 'Alta'
                                          ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                                          : project.prioridad === 'Media'
                                          ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                                          : 'border-green-500 text-green-400 bg-green-500/10'
                                      }`}
                                    >
                                      {project.prioridad}
                                    </Badge>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400">
                                      <span>{project.estado}</span>
                                      <span>{progressInfo.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressInfo.progress}%` }}
                                        transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                                        className={`${progressInfo.color} h-2 rounded-full`}
                                      />
                                    </div>
                                  </div>

                                  {project.fecha_entrega && (
                                    <div className="mt-2 text-xs text-slate-400 flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(project.fecha_entrega).toLocaleDateString('es-ES')}
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
              <Label htmlFor="email" className="text-slate-300">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="cliente@email.com"
              />
              {errors.email && <p className="text-sm text-red-400 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.email}</p>}
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

      {/* Add Project Modal */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
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
    </div>
  );
}
