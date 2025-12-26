'use client'

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { getClientById, Client } from "@/lib/clients";
import { getProjectsByClient, Project } from "@/lib/projects";
import { updateProject, deleteProject, updateProjectStatus, getProjectActivities } from "../actions";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileCheck,
  FileClock,
  FileX,
  Activity,
  Plus,
  Send,
  Calendar as CalendarIcon,
  Star,
  Award,
  Archive,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  Paperclip,
  MessageSquare,
  CreditCard,
  PieChart,
  LineChart
} from "lucide-react";

// Types for advanced client view
interface ClientDocument {
  id: string;
  name: string;
  type: 'contrato' | 'propuesta' | 'factura' | 'otro';
  status: 'firmado' | 'pendiente' | 'expirado';
  created_at: string;
  size?: number;
}

interface ClientActivity {
  id: string;
  type: 'email' | 'task_update' | 'payment' | 'meeting' | 'document';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
}

interface ClientFinancials {
  totalRevenue: number;
  totalExpenses: number;
  pendingPayments: number;
  profitability: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

export default function ClientDeepViewPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [financials, setFinancials] = useState<ClientFinancials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Calculate Client Health Score
  const clientHealthScore = useMemo(() => {
    if (!client || !projects.length || !financials) return null;

    let score = 0;
    let maxScore = 100;

    // Profitability (40 points)
    const profitabilityScore = Math.min(40, (financials.profitability / 100) * 40);
    score += profitabilityScore;

    // Payment timeliness (30 points) - simulated based on pending payments
    const paymentRatio = (financials.totalRevenue - financials.pendingPayments) / financials.totalRevenue;
    const paymentScore = paymentRatio * 30;
    score += paymentScore;

    // Project completion rate (30 points)
    const completedProjects = projects.filter(p => p.estado === 'COMPLETADO').length;
    const completionRate = completedProjects / projects.length;
    const completionScore = completionRate * 30;
    score += completionScore;

    // Determine grade
    let grade: 'A' | 'B' | 'C';
    let gradeColor: string;
    let gradeDescription: string;

    if (score >= 80) {
      grade = 'A';
      gradeColor = 'text-emerald-400 bg-emerald-500/20';
      gradeDescription = 'Excelente cliente - Alto rendimiento';
    } else if (score >= 60) {
      grade = 'B';
      gradeColor = 'text-blue-400 bg-blue-500/20';
      gradeDescription = 'Buen cliente - Rendimiento sólido';
    } else {
      grade = 'C';
      gradeColor = 'text-amber-400 bg-amber-500/20';
      gradeDescription = 'Cliente regular - Requiere atención';
    }

    return {
      score: Math.round(score),
      grade,
      gradeColor,
      gradeDescription,
      breakdown: {
        profitability: Math.round(profitabilityScore),
        payments: Math.round(paymentScore),
        projects: Math.round(completionScore)
      }
    };
  }, [client, projects, financials]);


  // Load comprehensive client data
  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [clientData, projectsData, activitiesData] = await Promise.all([
        getClientById(clientId),
        getProjectsByClient(clientId),
        getProjectActivities(clientId)
      ]);

      if (!clientData) {
        setError('Cliente no encontrado');
        return;
      }

      setClient(clientData);
      setProjects(projectsData);

      // Load activities from database
      if (activitiesData.success) {
        setActivities(activitiesData.data.map(activity => ({
          id: activity.id,
          type: activity.tipo.toLowerCase() as ClientActivity['type'],
          title: activity.titulo,
          description: activity.descripcion,
          timestamp: activity.created_at,
          icon: getActivityIcon(activity.tipo)
        })));
      }

      // Load documents and financials (keep simulated for now)
      await loadClientDocuments(clientId);
      await loadClientFinancials(clientId);

    } catch (err) {
      console.error('Error loading client data:', err);
      setError('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  // Load client documents (simulated)
  const loadClientDocuments = async (clientId: string) => {
    // Simulate document data
    const mockDocuments: ClientDocument[] = [
      {
        id: '1',
        name: 'Contrato de Servicios 2024.pdf',
        type: 'contrato',
        status: 'firmado',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        size: 2457600
      },
      {
        id: '2',
        name: 'Propuesta Desarrollo Web.docx',
        type: 'propuesta',
        status: 'pendiente',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        size: 512000
      },
      {
        id: '3',
        name: 'Factura Julio 2024.pdf',
        type: 'factura',
        status: 'firmado',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        size: 128000
      }
    ];
    setDocuments(mockDocuments);
  };

  // Load client activities (simulated)
  const loadClientActivities = async (clientId: string) => {
    const mockActivities: ClientActivity[] = [
      {
        id: '1',
        type: 'payment',
        title: 'Pago recibido',
        description: 'Pago de $15,000 MXN por proyecto Desarrollo Web',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        icon: <CreditCard className="w-4 h-4" />
      },
      {
        id: '2',
        type: 'task_update',
        title: 'Tarea completada',
        description: 'Revisión de diseño finalizada en proyecto E-commerce',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        icon: <CheckCircle className="w-4 h-4" />
      },
      {
        id: '3',
        type: 'email',
        title: 'Correo enviado',
        description: 'Propuesta técnica enviada al equipo del cliente',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        icon: <Mail className="w-4 h-4" />
      },
      {
        id: '4',
        type: 'meeting',
        title: 'Reunión programada',
        description: 'Reunión de seguimiento para proyecto móvil',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        icon: <CalendarIcon className="w-4 h-4" />
      }
    ];
    setActivities(mockActivities);
  };

  // Load client financials (simulated)
  const loadClientFinancials = async (clientId: string) => {
    const mockFinancials: ClientFinancials = {
      totalRevenue: 125000,
      totalExpenses: 35000,
      pendingPayments: 15000,
      profitability: 72,
      monthlyData: [
        { month: 'Ene', revenue: 20000, expenses: 5000 },
        { month: 'Feb', revenue: 25000, expenses: 7000 },
        { month: 'Mar', revenue: 30000, expenses: 8000 },
        { month: 'Abr', revenue: 25000, expenses: 6000 },
        { month: 'May', revenue: 25000, expenses: 9000 }
      ]
    };
    setFinancials(mockFinancials);
  };

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  // Helper functions
  const getProgressInfo = (estado: string) => {
    switch (estado) {
      case 'PLANIFICACION': return { progress: 25, color: 'from-slate-400 to-slate-500', bgColor: 'bg-slate-500' };
      case 'EN_PROGRESO': return { progress: 65, color: 'from-indigo-400 to-indigo-600', bgColor: 'bg-indigo-500' };
      case 'COMPLETADO': return { progress: 100, color: 'from-emerald-400 to-emerald-600', bgColor: 'bg-emerald-500' };
      case 'PAUSADO': return { progress: 40, color: 'from-amber-400 to-amber-600', bgColor: 'bg-amber-500' };
      case 'CANCELADO': return { progress: 0, color: 'from-red-400 to-red-600', bgColor: 'bg-red-500' };
      default: return { progress: 0, color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-500' };
    }
  };

  const getDocumentIcon = (type: ClientDocument['type']) => {
    switch (type) {
      case 'contrato': return <FileCheck className="w-5 h-5 text-emerald-400" />;
      case 'propuesta': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'factura': return <FileText className="w-5 h-5 text-purple-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getDocumentStatusBadge = (status: ClientDocument['status']) => {
    switch (status) {
      case 'firmado': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Firmado</Badge>;
      case 'pendiente': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendiente</Badge>;
      case 'expirado': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expirado</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'EMAIL': return <Mail className="w-4 h-4" />;
      case 'PAYMENT': return <CreditCard className="w-4 h-4" />;
      case 'TASK_UPDATE': return <CheckCircle className="w-4 h-4" />;
      case 'MEETING': return <CalendarIcon className="w-4 h-4" />;
      case 'DOCUMENT': return <FileText className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Generate portal invitation link
  const generatePortalInvitation = async (clientId: string) => {
    setGeneratingLink(true);
    try {
      // In a real implementation, this would:
      // 1. Generate a unique token
      // 2. Store it in the database with expiration
      // 3. Return the portal URL

      // For now, simulate the process
      const token = `portal_${clientId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const portalUrl = `${window.location.origin}/portal/${clientId}`;

      setPortalLink(portalUrl);

      // Copy to clipboard automatically
      await navigator.clipboard.writeText(portalUrl);

      // Show success message (you could add a toast notification here)
      alert('¡Enlace del portal generado y copiado al portapapeles!');

    } catch (err) {
      console.error('Error generating portal invitation:', err);
      alert('Error al generar el enlace del portal');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Project management functions
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await deleteProject(projectId);
      if (result.success) {
        await loadClientData(); // Reload data
        alert('Proyecto eliminado exitosamente');
      } else {
        alert(`Error al eliminar proyecto: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Error al eliminar el proyecto');
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const result = await updateProjectStatus(projectId, newStatus as any);
      if (result.success) {
        await loadClientData(); // Reload data
      } else {
        alert(`Error al actualizar estado: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating project status:', err);
      alert('Error al actualizar el estado del proyecto');
    }
  };

  const handleSaveProject = async (updates: any) => {
    if (!editingProject) return;

    try {
      const result = await updateProject(editingProject.id!, updates);
      if (result.success) {
        setShowEditModal(false);
        setEditingProject(null);
        await loadClientData(); // Reload data
        alert('Proyecto actualizado exitosamente');
      } else {
        alert(`Error al actualizar proyecto: ${result.error}`);
      }
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Error al guardar el proyecto');
    }
  };

  // Trigger milestone notification
  const triggerMilestoneNotification = async (milestoneTitle: string, description: string) => {
    try {
      // In a real implementation, this would:
      // 1. Update task status in database
      // 2. Create milestone record
      // 3. Send notification to client via email/SMS
      // 4. Update client's portal with new milestone

      const newMilestone = {
        id: Date.now().toString(),
        title: milestoneTitle,
        description,
        completed_at: new Date().toISOString(),
        notified: true
      };

      setMilestones(prev => [newMilestone, ...prev]);

      // Simulate sending notification
      console.log(`🔔 Milestone notification sent to client: ${milestoneTitle}`);

      // Update activity timeline in portal
      alert(`¡Hito completado! El cliente ${client?.nombre} ha sido notificado automáticamente.`);

    } catch (err) {
      console.error('Error triggering milestone notification:', err);
      alert('Error al procesar el hito');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-100">Cargando vista avanzada del cliente...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-900/60 backdrop-blur-lg rounded-xl border border-slate-700/50">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error || 'Cliente no encontrado'}</p>
          <Button onClick={() => router.back()} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Klowezone
                  </span>
                  <span className="text-xs text-slate-100 bg-slate-700 border border-slate-600 px-2 py-1 rounded-full">
                    CRM Pro
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-100 mt-1">{client.nombre}</h1>
                <p className="text-slate-400">Vista avanzada del cliente</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Propuesta
            </Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
              <Send className="w-4 h-4 mr-2" />
              Solicitar Pago
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Agendar Reunión
            </Button>
            <Button
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              onClick={() => triggerMilestoneNotification(
                'Tarea Crítica Completada',
                'Se ha completado una tarea crítica del proyecto. El cliente ha sido notificado automáticamente.'
              )}
            >
              <Star className="w-4 h-4 mr-2" />
              Marcar Hito
            </Button>
            <Button
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white"
              onClick={() => generatePortalInvitation(clientId)}
              disabled={generatingLink}
            >
              {generatingLink ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-100 rounded-full animate-spin mr-2" />
              ) : (
                <User className="w-4 h-4 mr-2" />
              )}
              {generatingLink ? 'Generando...' : 'Portal del Cliente'}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Client Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-indigo-400" />
                  <CardTitle className="text-slate-100">Client Health Score</CardTitle>
                </div>
                {clientHealthScore && (
                  <div className={`px-4 py-2 rounded-full text-lg font-bold ${clientHealthScore.gradeColor}`}>
                    {clientHealthScore.grade}
                  </div>
                )}
              </div>
              <CardDescription className="text-slate-400">
                {clientHealthScore?.gradeDescription || 'Calculando calificación...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientHealthScore ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100">Puntuación General</span>
                    <span className="text-2xl font-bold text-indigo-400">{clientHealthScore.score}/100</span>
                  </div>
                  <Progress value={clientHealthScore.score} className="h-3" />

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{clientHealthScore.breakdown.profitability}</div>
                      <div className="text-sm text-slate-400">Rentabilidad</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{clientHealthScore.breakdown.payments}</div>
                      <div className="text-sm text-slate-400">Pagos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{clientHealthScore.breakdown.projects}</div>
                      <div className="text-sm text-slate-400">Proyectos</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Calculando calificación del cliente...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Portal Invitation Link */}
        {portalLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-400">
                  <User className="w-5 h-5" />
                  Portal del Cliente Generado
                </CardTitle>
                <CardDescription className="text-emerald-300">
                  Enlace de acceso exclusivo para {client?.nombre}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                  <input
                    type="text"
                    value={portalLink}
                    readOnly
                    className="flex-1 bg-transparent text-slate-100 border border-slate-600 rounded px-3 py-2 text-sm"
                  />
                  <Button
                    onClick={() => navigator.clipboard.writeText(portalLink)}
                    variant="outline"
                    size="sm"
                    className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/20 hover:!text-slate-900"
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Este enlace permite al cliente acceder a su portal personal para ver el progreso de sus proyectos.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client Info & Financials */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <User className="w-5 h-5 text-indigo-400" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="text-slate-100">{client.email || 'No especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Teléfono</p>
                        <p className="text-slate-100">{client.telefono || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                  {client.notas && (
                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-sm text-slate-400 mb-2">Notas</p>
                      <p className="text-slate-100">{client.notas}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Financial Hub */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    Financial Hub - Profitability Tracking
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Análisis de ingresos vs gastos del cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {financials ? (
                    <div className="space-y-6">
                      {/* Financial Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                          <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-emerald-400">
                            ${financials.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-400">Ingresos Totales</div>
                        </div>
                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                          <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-red-400">
                            ${financials.totalExpenses.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-400">Gastos Totales</div>
                        </div>
                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                          <TrendingUp className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-indigo-400">
                            {financials.profitability}%
                          </div>
                          <div className="text-sm text-slate-400">Rentabilidad</div>
                        </div>
                      </div>

                      {/* Monthly Chart Placeholder */}
                      <div className="h-64 bg-slate-800/30 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <LineChart className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400">Gráfico de ingresos mensuales</p>
                          <p className="text-xs text-slate-500">Implementación pendiente</p>
                        </div>
                      </div>

                      {financials.pendingPayments > 0 && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-400 font-medium">Pagos Pendientes</span>
                          </div>
                          <p className="text-slate-100 mt-1">
                            ${financials.pendingPayments.toLocaleString()} MXN pendientes de cobro
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Cargando datos financieros...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Projects Mini Kanban */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Target className="w-5 h-5 text-indigo-400" />
                    Proyectos Activos - Mini Kanban
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Vista rápida del progreso de proyectos del cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {projects.length > 0 ? (
                    <div className="space-y-3">
                      {projects.slice(0, 3).map((project, index) => {
                        const progressInfo = getProgressInfo(project.estado);
                        return (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-slate-100">{project.nombre_proyecto}</h4>
                              <div className="flex items-center gap-1">
                                <select
                                  value={project.estado}
                                  onChange={(e) => handleUpdateProjectStatus(project.id!, e.target.value)}
                                  className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100"
                                >
                                  <option value="PLANIFICACION">Planificación</option>
                                  <option value="EN_PROGRESO">En Progreso</option>
                                  <option value="COMPLETADO">Completado</option>
                                  <option value="PAUSADO">Pausado</option>
                                  <option value="CANCELADO">Cancelado</option>
                                </select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditProject(project)}
                                  className="text-slate-100 hover:bg-slate-700 p-1 h-6 w-6"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteProject(project.id!)}
                                  className="text-red-400 hover:bg-red-500/20 p-1 h-6 w-6"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Progreso</span>
                                <span className="text-slate-100">{progressInfo.progress}%</span>
                              </div>
                              <Progress value={progressInfo.progress} className="h-2" />
                            </div>
                          </motion.div>
                        );
                      })}
                      {projects.length > 3 && (
                        <Button variant="ghost" className="w-full text-slate-100 hover:bg-slate-800">
                          Ver todos los proyectos ({projects.length})
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No hay proyectos activos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Documents & Activity */}
          <div className="space-y-6">
            {/* Document Vault */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Archive className="w-5 h-5 text-indigo-400" />
                    Document Vault
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Contratos y documentos del cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getDocumentIcon(doc.type)}
                          <div>
                            <p className="text-sm font-medium text-slate-100">{doc.name}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(doc.created_at).toLocaleDateString('es-ES')}
                              {doc.size && ` • ${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDocumentStatusBadge(doc.status)}
                          <Button variant="ghost" size="sm" className="text-slate-100 hover:bg-slate-800">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    <Button className="w-full mt-4" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Documento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Timeline de Actividad
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Historial de interacciones con el cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100">{activity.title}</p>
                          <p className="text-sm text-slate-400">{activity.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(activity.timestamp).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Milestones History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-lg border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Star className="w-5 h-5 text-indigo-400" />
                    Historial de Hitos
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Tareas críticas completadas y notificaciones enviadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestones.length > 0 ? (
                      milestones.map((milestone, index) => (
                        <motion.div
                          key={milestone.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                        >
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-100 mb-1">{milestone.title}</h4>
                            <p className="text-sm text-slate-400 mb-2">{milestone.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                ✓ Notificado
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(milestone.completed_at).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Star className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No hay hitos completados aún</p>
                        <p className="text-slate-500 text-xs mt-1">
                          Los hitos aparecerán aquí cuando marques tareas críticas como completadas
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Project Edit Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Editar Proyecto</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const updates = {
                  nombre_proyecto: formData.get('nombre_proyecto') as string,
                  descripcion: formData.get('descripcion') as string,
                  fecha_entrega: formData.get('fecha_entrega') as string || undefined,
                  estado: formData.get('estado') as string
                };
                handleSaveProject(updates);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  name="nombre_proyecto"
                  defaultValue={editingProject.nombre_proyecto}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  defaultValue={editingProject.descripcion || ''}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Fecha de Entrega
                </label>
                <input
                  name="fecha_entrega"
                  type="date"
                  defaultValue={editingProject.fecha_entrega ? new Date(editingProject.fecha_entrega).toISOString().split('T')[0] : ''}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  defaultValue={editingProject.estado}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100"
                >
                  <option value="PLANIFICACION">Planificación</option>
                  <option value="EN_PROGRESO">En Progreso</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="PAUSADO">Pausado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Guardar Cambios
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProject(null);
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
