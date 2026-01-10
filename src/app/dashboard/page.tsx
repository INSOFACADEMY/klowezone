'use client'

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createClient, insertTestClients } from "@/lib/clients";
import { createProject, updateProject, deleteProject } from "@/lib/projects";
import { WhatsAppIconButton } from "@/components/ui/whatsapp-button";
import AppHeader from "@/components/navigation/AppHeader";

// Zod schemas for form validation
const clientSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().optional(),
  telefono: z.string().optional(),
  estado: z.enum(["Activo", "Inactivo", "Pendiente"]),
  notas: z.string().optional(),
  noTieneEmail: z.boolean(),
  noTieneTelefono: z.boolean(),
}).refine((data) => {
  // If noTieneEmail is false, email must be provided and valid
  if (!data.noTieneEmail) {
    return data.email && data.email.length > 0 && /\S+@\S+\.\S+/.test(data.email);
  }
  return true;
}, {
  message: "El email es obligatorio y debe tener un formato válido",
  path: ["email"],
});

const projectSchema = z.object({
  cliente_id: z.string().min(1, "Debes seleccionar un cliente"),
  nombre_proyecto: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  prioridad: z.enum(["Urgente", "Alta", "Media", "Baja"]),
  estado: z.enum(["PLANIFICACION", "EN_PROGRESO", "COMPLETADO", "PAUSADO", "CANCELADO"]),
  fecha_entrega: z.string().optional(),
  descripcion: z.string().optional(),
}).refine((data) => {
  // Validar que cliente_id no sea vacío después de trim
  return data.cliente_id && data.cliente_id.trim().length > 0;
}, {
  message: "Debes seleccionar un cliente",
  path: ["cliente_id"],
});

type ClientFormData = z.infer<typeof clientSchema>;
type ProjectFormData = z.infer<typeof projectSchema>;

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

  // React Hook Form for client
  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      estado: 'Activo',
      notas: '',
      noTieneEmail: false,
      noTieneTelefono: false
    }
  });

  // React Hook Form for project
  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      cliente_id: '',
      nombre_proyecto: '',
      prioridad: 'Media',
      estado: 'PLANIFICACION',
      fecha_entrega: '',
      descripcion: ''
    }
  });
  const [newProject, setNewProject] = useState({
    cliente_id: '',
    nombre_proyecto: '',
    prioridad: 'Media' as const,
    estado: 'PLANIFICACION' as const,
    fecha_entrega: '',
    descripcion: ''
  });
  const [editProject, setEditProject] = useState({
    cliente_id: '',
    nombre_proyecto: '',
    prioridad: 'Media' as const,
    estado: 'PLANIFICACION' as const,
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

      setClients(clientsData || []);
      setFilteredClients(clientsData || []);
      setProjects(projectsData || []);
      setClientStats(clientStatsData || { total: 0, activos: 0, nuevosEsteMes: 0 });
      setProjectStats(projectStatsData || { total: 0, completados: 0, enProgreso: 0, planificacion: 0 });
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);

      // Resetear estado en caso de error
      setClients([]);
      setFilteredClients([]);
      setProjects([]);
      setClientStats({ total: 0, activos: 0, nuevosEsteMes: 0 });
      setProjectStats({ total: 0, completados: 0, enProgreso: 0, planificacion: 0 });
      setLoading(false);
    }
  }, []);

  // Check authentication and onboarding
  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push('/login');
          return;
        }

        setUser(user);

        // Delay estratégico: permite que los datos del onboarding se propaguen completamente
        // en Supabase antes de verificar el estado. Evita bucles entre dashboard y onboarding.
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if onboarding is completed (skip for admin)
        const profile = await getUserProfile();
        const isAdmin = user.email === 'admin@klowezone.com';

        if (!isAdmin && !profile?.onboarding_completed) {
          router.push('/onboarding');
          return;
        }

        setUserProfile(profile);
        setAuthLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        // En caso de error, asegurar que no se quede en loading infinito
        setAuthLoading(false);
        router.push('/login');
      }
    };

    checkAuthAndOnboarding();
  }, [router]);

  useEffect(() => {
    if (user && !authLoading) {
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
      case 'PLANIFICACION': return { progress: 25, color: 'bg-gradient-to-r from-slate-400 to-slate-500' };
      case 'EN_PROGRESO': return { progress: 65, color: 'bg-gradient-to-r from-blue-400 to-blue-600' };
      case 'COMPLETADO': return { progress: 100, color: 'bg-gradient-to-r from-green-400 to-green-600' };
      case 'PAUSADO': return { progress: 40, color: 'bg-gradient-to-r from-yellow-400 to-yellow-600' };
      case 'CANCELADO': return { progress: 0, color: 'bg-gradient-to-r from-red-400 to-red-600' };
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

  // Debug logging for form values (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const clientFormValues = clientForm.watch();
    console.log("📋 Client form values:", clientFormValues);
    console.log("📋 Client form errors:", clientForm.formState.errors);
    console.log("📋 Client form isValid:", clientForm.formState.isValid);

    const projectFormValues = projectForm.watch();
    console.log("📋 Project form values:", projectFormValues);
  }
  console.log("📋 Project form errors:", projectForm.formState.errors);
  console.log("📋 Project form isValid:", projectForm.formState.isValid);

  // Handle create client function with react-hook-form
  const handleCreateClient = useCallback(async (data: ClientFormData) => {
    console.log("🚀 Submitting client form with data:", data);

    setIsSubmitting(true);

    try {
      // Prepare client data for API
      const clientData = {
        nombre: data.nombre.trim(),
        email: data.noTieneEmail ? 'na@klowezone.com' : (data.email?.trim() || undefined),
        telefono: data.noTieneTelefono
          ? '0000000000'
          : (data.telefono?.trim() && data.telefono.trim().length > 0 ? data.telefono.trim() : undefined),
        estado: data.estado || 'Activo',
        notas: data.notas?.trim() && data.notas.trim().length > 0 ? data.notas.trim() : undefined
      };

      console.log("📤 Sending client data to API:", clientData);

      await createClient(clientData);

      // Reset form and close modal
      clientForm.reset();
      setIsModalOpen(false);
      await loadData(); // Reload data

      console.log("✅ Client created successfully");
    } catch (error) {
      console.error('❌ Error creating client:', error);
      // You could set form errors here if needed
      clientForm.setError("root", {
        message: 'Error al crear el cliente. Verifica tu conexión e inténtalo de nuevo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [clientForm, loadData]);

  // Handle create project function with react-hook-form
  const handleCreateProject = useCallback(async (data: ProjectFormData) => {
    console.log("🚀 Submitting project form with data:", data);

    setIsSubmitting(true);

    try {
      await createProject({
        cliente_id: data.cliente_id,
        nombre_proyecto: data.nombre_proyecto.trim(),
        prioridad: data.prioridad,
        estado: data.estado,
        fecha_entrega: data.fecha_entrega || undefined,
        descripcion: data.descripcion?.trim() || undefined
      });

      // Reset form and close modal
      projectForm.reset();
      setIsProjectModalOpen(false);
      await loadData(); // Reload data

      console.log("✅ Project created successfully");
    } catch (error) {
      console.error('❌ Error creating project:', error);
      // Set form error
      projectForm.setError("root", {
        message: 'Error al crear el proyecto. Verifica tu conexión e inténtalo de nuevo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [projectForm, loadData]);

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

  // Timeout de respaldo: previene bucles infinitos si la autenticación falla
  // Forzando fin del estado de carga después de 10 segundos máximo
  useEffect(() => {
    if (authLoading) {
      const timeout = setTimeout(() => {
        console.error('Authentication timeout - forcing loading state to end');
        setAuthLoading(false);
      }, 10000);

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

            {/* Dashboard */}
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center text-emerald-400">
                <BarChart3 className="w-5 h-5 mr-3" />
                <span className="font-medium">Dashboard</span>
              </div>
            </div>

            {/* Proyectos */}
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="w-full text-left bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 transition-colors group"
            >
              <div className="flex items-center text-slate-100 group-hover:text-white">
                <Briefcase className="w-5 h-5 mr-3" />
                <span className="font-medium">Proyectos</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 ml-8">
                Kanban, Equipos, Gantt
              </div>
            </button>

            {/* IA Assistant */}
            <button
              onClick={() => router.push('/dashboard/ai')}
              className="w-full text-left bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 transition-colors group"
            >
              <div className="flex items-center text-slate-100 group-hover:text-white">
                <Sparkles className="w-5 h-5 mr-3" />
                <span className="font-medium">IA Assistant</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 ml-8">
                Auto-cronograma, Reportes
              </div>
            </button>

            {/* Finanzas */}
            <button
              onClick={() => router.push('/dashboard/finances')}
              className="w-full text-left bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 transition-colors group"
            >
              <div className="flex items-center text-slate-100 group-hover:text-white">
                <DollarSign className="w-5 h-5 mr-3" />
                <span className="font-medium">Finanzas</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 ml-8">
                Métricas, Gastos, Facturación
              </div>
            </button>

            {/* Clientes */}
            <button
              onClick={() => router.push('/dashboard/clients')}
              className="w-full text-left bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 transition-colors group"
            >
              <div className="flex items-center text-slate-100 group-hover:text-white">
                <Users className="w-5 h-5 mr-3" />
                <span className="font-medium">Clientes</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 ml-8">
                Gestión, Historial
              </div>
            </button>
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
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:!text-red-600 justify-start"
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
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Proyecto
                </Button>
              </DialogTrigger>
            </Dialog>

            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
              <Receipt className="w-4 h-4 mr-2" />
              Crear Factura
            </Button>

            <Button
              onClick={handleInsertTestData}
              disabled={isInsertingTestData}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white disabled:opacity-50"
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
                                  <WhatsAppIconButton
                                    telefono={client.telefono}
                                    clientName={client.nombre}
                                    templateKey="welcome"
                                  />
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
                      {projects.filter(p => p.estado !== 'COMPLETADO' && p.estado !== 'CANCELADO').length} proyectos en curso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="px-6 pb-6">
                      {projects.filter(p => p.estado !== 'COMPLETADO' && p.estado !== 'CANCELADO').length === 0 ? (
                        <div className="text-center py-8">
                          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400 text-sm">
                            No hay proyectos activos
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {projects
                            .filter(p => p.estado !== 'COMPLETADO' && p.estado !== 'CANCELADO')
                            .slice(0, 5)
                            .map((project, index) => {
                              const progressInfo = getProgressInfo(project.estado);
                              return (
                                <motion.div
                                  key={project.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 + (index * 0.1) }}
                                  className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border transition-all duration-200 cursor-pointer hover:bg-slate-800/70 ${
                                    isUrgentDeadline(project.fecha_entrega)
                                      ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                                      : 'border-slate-700/50'
                                  }`}
                                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
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
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(handleCreateClient)} className="space-y-4">
            <FormField
              control={clientForm.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Nombre del cliente"
                    />
                  </FormControl>
                  <FormMessage className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={clientForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">
                    Email {!clientForm.watch("noTieneEmail") && '*'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      disabled={clientForm.watch("noTieneEmail")}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={clientForm.watch("noTieneEmail") ? "No requerido" : "cliente@email.com"}
                    />
                  </FormControl>
                  <FormMessage className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={clientForm.control}
              name="noTieneEmail"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no-tiene-email"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean;
                        field.onChange(isChecked);
                        // When checkbox is checked, set email to default value
                        if (isChecked) {
                          clientForm.setValue('email', 'na@klowezone.com');
                        } else {
                          clientForm.setValue('email', '');
                        }
                      }}
                    />
                    <Label htmlFor="no-tiene-email" className="text-sm text-slate-300 cursor-pointer">
                      No tiene correo electrónico
                    </Label>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={clientForm.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={clientForm.watch("noTieneTelefono")}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={clientForm.watch("noTieneTelefono") ? "No requerido" : "+1234567890"}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={clientForm.control}
              name="noTieneTelefono"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no-tiene-telefono"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean;
                        field.onChange(isChecked);
                        // When checkbox is checked, set telefono to default value
                        if (isChecked) {
                          clientForm.setValue('telefono', '0000000000');
                        } else {
                          clientForm.setValue('telefono', '');
                        }
                      }}
                    />
                    <Label htmlFor="no-tiene-telefono" className="text-sm text-slate-300 cursor-pointer">
                      No tiene teléfono
                    </Label>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={clientForm.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="Activo" className="text-white hover:bg-slate-700">Activo</SelectItem>
                      <SelectItem value="Pendiente" className="text-white hover:bg-slate-700">Pendiente</SelectItem>
                      <SelectItem value="Inactivo" className="text-white hover:bg-slate-700">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={clientForm.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">Notas</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Notas adicionales del cliente"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {clientForm.formState.errors.root && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{clientForm.formState.errors.root.message}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 border border-slate-700 text-slate-100 hover:bg-slate-800 hover:border-slate-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !clientForm.formState.isValid}
                className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </Form>
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
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(handleCreateProject)} className="space-y-4">
            <FormField
              control={projectForm.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">Cliente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id!} className="text-white hover:bg-slate-700">
                          {client.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={projectForm.control}
              name="nombre_proyecto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">Nombre del Proyecto *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Nombre del proyecto"
                    />
                  </FormControl>
                  <FormMessage className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                  </FormMessage>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={projectForm.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-100">Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="Urgente" className="text-red-400 hover:bg-slate-700">🔴 Urgente</SelectItem>
                        <SelectItem value="Alta" className="text-orange-400 hover:bg-slate-700">🟠 Alta</SelectItem>
                        <SelectItem value="Media" className="text-yellow-400 hover:bg-slate-700">🟡 Media</SelectItem>
                        <SelectItem value="Baja" className="text-green-400 hover:bg-slate-700">🟢 Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={projectForm.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-100">Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="Planificación" className="text-slate-100 hover:bg-slate-700">📋 Planificación</SelectItem>
                        <SelectItem value="En Progreso" className="text-blue-400 hover:bg-slate-700">⚡ En Progreso</SelectItem>
                        <SelectItem value="Completado" className="text-green-400 hover:bg-slate-700">✅ Completado</SelectItem>
                        <SelectItem value="Pausado" className="text-yellow-400 hover:bg-slate-700">⏸️ Pausado</SelectItem>
                        <SelectItem value="Cancelado" className="text-red-400 hover:bg-slate-700">❌ Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={projectForm.control}
              name="fecha_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">Fecha de Entrega</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={projectForm.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-100">Descripción</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Descripción del proyecto (opcional)"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {projectForm.formState.errors.root && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{projectForm.formState.errors.root.message}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProjectModalOpen(false)}
                className="flex-1 border border-slate-700 text-slate-100 hover:bg-slate-800 hover:border-slate-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !projectForm.formState.isValid}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
              </Button>
            </div>
          </form>
        </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
