'use client'

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { getClientById, Client } from "@/lib/clients";
import { getProjectsByClient, Project } from "@/lib/projects";
import {
  CheckCircle,
  Clock,
  MessageSquare,
  Camera,
  Send,
  User,
  Building,
  Calendar,
  Target,
  TrendingUp,
  Star,
  Award,
  Mail,
  Phone,
  ArrowLeft,
  AlertCircle,
  Loader2
} from "lucide-react";

// Types for client portal
interface ClientComment {
  id: string;
  message: string;
  created_at: string;
  is_from_client: boolean;
  client_name?: string;
}

interface ProjectEvidence {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  milestone?: string;
}

interface PortalToken {
  id: string;
  client_id: string;
  token: string;
  expires_at: string;
  is_active: boolean;
}

export default function ClientPortalPage() {
  const router = useRouter();
  const params = useParams();
  const portalId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [evidence, setEvidence] = useState<ProjectEvidence[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate overall progress
  const overallProgress = projects.length > 0
    ? projects.reduce((acc, project) => {
        const progressMap: Record<string, number> = {
          'PLANIFICACION': 25,
          'EN_PROGRESO': 65,
          'COMPLETADO': 100,
          'PAUSADO': 40,
          'CANCELADO': 0
        };
        return acc + (progressMap[project.estado] || 0);
      }, 0) / projects.length
    : 0;

  // Validate portal access
  const validatePortalAccess = async () => {
    try {
      // In a real implementation, this would validate the token
      // For now, we'll simulate access based on client ID
      const clientData = await getClientById(portalId);
      if (!clientData) {
        setError('Acceso no autorizado o enlace expirado');
        return;
      }

      setClient(clientData);
      await loadClientData(portalId);
    } catch (err) {
      console.error('Error validating portal access:', err);
      setError('Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  // Load client data
  const loadClientData = async (clientId: string) => {
    try {
      const [projectsData] = await Promise.all([
        getProjectsByClient(clientId)
      ]);

      setProjects(projectsData);

      // Simulate loading comments and evidence
      await loadMockComments(clientId);
      await loadMockEvidence(clientId);
    } catch (err) {
      console.error('Error loading client data:', err);
    }
  };

  // Load mock comments (in real implementation, this would be from database)
  const loadMockComments = async (clientId: string) => {
    const mockComments: ClientComment[] = [
      {
        id: '1',
        message: '¡Hola! Quería preguntar sobre el progreso del módulo de pagos. ¿Cómo va avanzando?',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        is_from_client: true,
        client_name: client?.nombre
      },
      {
        id: '2',
        message: '¡Excelente pregunta! El módulo de pagos está al 85% de completitud. Estamos finalizando las pruebas de seguridad y esperamos tenerlo listo para la próxima semana.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        is_from_client: false
      },
      {
        id: '3',
        message: '¡Genial! ¿Podrían enviarme una actualización cuando esté listo para pruebas?',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        is_from_client: true,
        client_name: client?.nombre
      }
    ];
    setComments(mockComments);
  };

  // Load mock evidence (in real implementation, this would be from database)
  const loadMockEvidence = async (clientId: string) => {
    const mockEvidence: ProjectEvidence[] = [
      {
        id: '1',
        title: 'Diseño de Interfaz Principal',
        description: 'Primeras maquetas del dashboard administrativo',
        image_url: '/api/placeholder/400/300',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        milestone: 'Fase de Diseño'
      },
      {
        id: '2',
        title: 'Implementación Base de Datos',
        description: 'Estructura de datos completada y probada',
        image_url: '/api/placeholder/400/300',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        milestone: 'Backend Completo'
      },
      {
        id: '3',
        title: 'Módulo de Usuarios',
        description: 'Sistema de autenticación y perfiles implementado',
        image_url: '/api/placeholder/400/300',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        milestone: 'Funcionalidades Core'
      }
    ];
    setEvidence(mockEvidence);
  };

  // Submit new comment
  const submitComment = async () => {
    if (!newComment.trim() || !client) return;

    setSubmittingComment(true);
    try {
      // In real implementation, this would save to database
      const newCommentObj: ClientComment = {
        id: Date.now().toString(),
        message: newComment,
        created_at: new Date().toISOString(),
        is_from_client: true,
        client_name: client.nombre
      };

      setComments(prev => [...prev, newCommentObj]);
      setNewComment("");
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    if (portalId) {
      validatePortalAccess();
    }
  }, [portalId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cargando Portal</h2>
          <p className="text-gray-600">Validando acceso...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">{error || 'Este enlace no es válido o ha expirado.'}</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Ir al Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header with Branding */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-indigo-100 shadow-sm"
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Klowezone</h1>
                <p className="text-sm text-gray-600">Portal del Cliente</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Bienvenido</p>
              <p className="font-semibold text-gray-900">{client.nombre}</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">¡Hola, {client.nombre}!</h2>
            <p className="text-indigo-100 mb-4">
              Bienvenido a tu portal exclusivo. Aquí puedes seguir el progreso de tus proyectos en tiempo real.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="text-sm">Progreso General: {Math.round(overallProgress)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm">{projects.length} Proyectos Activos</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Progreso del Proyecto
              </CardTitle>
              <CardDescription className="text-gray-600">
                Seguimiento en tiempo real del avance de tus proyectos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso General</span>
                    <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project, index) => {
                    const progressMap: Record<string, number> = {
                      'PLANIFICACION': 25,
                      'EN_PROGRESO': 65,
                      'COMPLETADO': 100,
                      'PAUSADO': 40,
                      'CANCELADO': 0
                    };
                    const progress = progressMap[project.estado] || 0;

                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                      >
                        <h4 className="font-semibold text-gray-900 mb-2">{project.nombre_proyecto}</h4>
                        <div className="flex justify-between items-center mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              project.estado === 'COMPLETADO' ? 'border-green-500 text-green-700' :
                              project.estado === 'EN_PROGRESO' ? 'border-blue-500 text-blue-700' :
                              'border-gray-500 text-gray-700'
                            }`}
                          >
                            {project.estado}
                          </Badge>
                          <span className="text-sm text-gray-600">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Evidence Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Camera className="w-5 h-5 text-indigo-600" />
                Galería de Evidencia
              </CardTitle>
              <CardDescription className="text-gray-600">
                Fotos y capturas del progreso de tu proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {evidence.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-gray-200 aspect-video mb-3">
                      <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-indigo-600" />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button size="sm" variant="secondary" className="bg-white/90 text-gray-900">
                          Ver Imagen
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {item.milestone}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Dudas y Comentarios
              </CardTitle>
              <CardDescription className="text-gray-600">
                Comunícate con nuestro equipo. Tus preguntas son importantes para nosotros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: comment.is_from_client ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`flex gap-3 ${comment.is_from_client ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${comment.is_from_client ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className={comment.is_from_client ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-white'}>
                          {comment.is_from_client ? client.nombre.charAt(0) : 'I'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`p-3 rounded-2xl ${
                        comment.is_from_client
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{comment.message}</p>
                        <p className={`text-xs mt-1 ${
                          comment.is_from_client ? 'text-indigo-200' : 'text-gray-500'
                        }`}>
                          {new Date(comment.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* New Comment Form */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Escribe tu pregunta o comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    rows={3}
                  />
                  <Button
                    onClick={submitComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white self-end"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-gray-600"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Klowezone</span>
          </div>
          <p className="text-sm">
            © 2024 Klowezone. Portal exclusivo para clientes.
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
