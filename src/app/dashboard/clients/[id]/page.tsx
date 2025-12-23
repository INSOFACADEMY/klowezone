'use client'

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { getClientById, getClientProjects, Client } from "@/lib/clients";
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
  Building
} from "lucide-react";

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar cliente y sus proyectos en paralelo
        const [clientData, projectsData] = await Promise.all([
          getClientById(clientId),
          getClientProjects(clientId)
        ]);

        if (!clientData) {
          setError('Cliente no encontrado');
          return;
        }

        setClient(clientData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error loading client data:', err);
        setError('Error al cargar los datos del cliente');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  // Calcular progreso de proyectos
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

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Pendiente':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Inactivo':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityIcon = (prioridad: string) => {
    switch (prioridad) {
      case 'Urgente':
        return '🔴';
      case 'Alta':
        return '🟠';
      case 'Media':
        return '🟡';
      case 'Baja':
        return '🟢';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {error || 'Cliente no encontrado'}
          </h2>
          <Button
            onClick={() => router.push('/dashboard')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{client.nombre}</h1>
                <p className="text-sm text-slate-500">Detalle del cliente</p>
              </div>
            </div>
            <Badge className={`border ${getStatusColor(client.estado)}`}>
              {client.estado}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Client Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900">{client.nombre}</CardTitle>
                      <CardDescription className="text-slate-600">Cliente registrado</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-3">
                    {client.email && (
                      <div className="flex items-center space-x-3 text-sm">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{client.email}</span>
                      </div>
                    )}
                    {client.telefono && (
                      <div className="flex items-center space-x-3 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{client.telefono}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">
                        Registrado {client.created_at ? new Date(client.created_at).toLocaleDateString('es-ES') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Estado</span>
                      <Badge className={`border ${getStatusColor(client.estado)}`}>
                        {client.estado}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes Card */}
            {client.notas && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-slate-500" />
                      Notas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 leading-relaxed">{client.notas}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Estadísticas Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Proyectos totales</span>
                    <span className="font-semibold text-slate-900">{projects.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">En progreso</span>
                    <span className="font-semibold text-blue-600">
                      {projects.filter(p => p.estado === 'En Progreso').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Completados</span>
                    <span className="font-semibold text-green-600">
                      {projects.filter(p => p.estado === 'Completado').length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Projects */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Projects Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Proyectos</h2>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Nuevo Proyecto
                </Button>
              </div>

              {/* Projects List */}
              {projects.length === 0 ? (
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">
                        No hay proyectos
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Este cliente aún no tiene proyectos asignados.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Crear primer proyecto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projects.map((project, index) => {
                    const progressInfo = getProgressInfo(project.estado);

                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * index }}
                      >
                        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                  {project.nombre_proyecto}
                                </h3>
                                {project.descripcion && (
                                  <p className="text-sm text-slate-600 mb-3">{project.descripcion}</p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-slate-500">
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {project.fecha_entrega ? new Date(project.fecha_entrega).toLocaleDateString('es-ES') : 'Sin fecha'}
                                  </span>
                                  <span className="flex items-center">
                                    {getPriorityIcon(project.prioridad)} {project.prioridad}
                                  </span>
                                </div>
                              </div>
                              <Badge className={`border ${
                                project.estado === 'En Progreso' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                                project.estado === 'Planificación' ? 'bg-slate-500/10 text-slate-700 border-slate-500/20' :
                                project.estado === 'Completado' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                                'bg-slate-500/10 text-slate-700 border-slate-500/20'
                              }`}>
                                {project.estado}
                              </Badge>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>Progreso del proyecto</span>
                                <span>{progressInfo.progress}% completado</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressInfo.progress}%` }}
                                  transition={{ duration: 1, delay: 0.5 + (0.1 * index), ease: "easeOut" }}
                                  className={`h-2 rounded-full bg-gradient-to-r ${progressInfo.color}`}
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end mt-4 space-x-2">
                              <Button variant="outline" size="sm" className="text-slate-600 border-slate-300">
                                Ver detalles
                              </Button>
                              <Button variant="outline" size="sm" className="text-slate-600 border-slate-300">
                                Editar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
