'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { sendProjectInvitation } from '@/actions/send-invitation'
import { getProjectTeam, updateTeamMemberRole, removeTeamMember } from '@/lib/project-teams'
import { getProjectInvitations, revokeInvitation } from '@/lib/project-invitations'
import { ProjectTeamMember } from '@/lib/project-teams'
import { ProjectInvitation } from '@/lib/project-invitations'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Eye,
  Crown,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Send,
  Trash2,
  Edit,
  MoreVertical,
  Calendar
} from 'lucide-react'

interface TeamManagementModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export function TeamManagementModal({ projectId, isOpen, onClose }: TeamManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members')
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([])
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Estados para nueva invitación
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: 'Staff' as 'Admin' | 'Staff' | 'Viewer',
    customMessage: ''
  })

  // Estados para edición de rol
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<'Admin' | 'Staff' | 'Viewer' | 'Client'>('Staff')

  // Estados de feedback
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Cargar datos del equipo
  useEffect(() => {
    if (isOpen) {
      loadTeamData()
    }
  }, [isOpen, projectId])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      const [membersData, invitationsData] = await Promise.all([
        getProjectTeam(projectId),
        getProjectInvitations(projectId)
      ])

      setTeamMembers(membersData)
      setInvitations(invitationsData)
    } catch (error) {
      console.error('Error loading team data:', error)
      showMessage('error', 'Error al cargar los datos del equipo')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSendInvitation = async () => {
    if (!newInvitation.email.trim()) {
      showMessage('error', 'El email es obligatorio')
      return
    }

    setSending(true)
    try {
      const result = await sendProjectInvitation({
        projectId,
        email: newInvitation.email,
        role: newInvitation.role,
        customMessage: newInvitation.customMessage
      })

      if (result.success) {
        showMessage('success', 'Invitación enviada exitosamente')
        setNewInvitation({ email: '', role: 'Staff', customMessage: '' })
        loadTeamData() // Recargar datos
      } else {
        showMessage('error', result.error || 'Error al enviar la invitación')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      showMessage('error', 'Error al enviar la invitación')
    } finally {
      setSending(false)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('¿Estás seguro de que quieres revocar esta invitación?')) return

    try {
      await revokeInvitation(invitationId)
      showMessage('success', 'Invitación revocada')
      loadTeamData()
    } catch (error) {
      console.error('Error revoking invitation:', error)
      showMessage('error', 'Error al revocar la invitación')
    }
  }

  const handleUpdateRole = async (userId: string) => {
    try {
      await updateTeamMemberRole(projectId, userId, newRole)
      showMessage('success', 'Rol actualizado exitosamente')
      setEditingMember(null)
      loadTeamData()
    } catch (error) {
      console.error('Error updating role:', error)
      showMessage('error', 'Error al actualizar el rol')
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres remover a ${userName} del proyecto?`)) return

    try {
      await removeTeamMember(projectId, userId)
      showMessage('success', 'Miembro removido del proyecto')
      loadTeamData()
    } catch (error) {
      console.error('Error removing member:', error)
      showMessage('error', 'Error al remover el miembro')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'Staff': return <Shield className="w-4 h-4 text-blue-500" />
      case 'Viewer': return <Eye className="w-4 h-4 text-green-500" />
      case 'Client': return <Users className="w-4 h-4 text-purple-500" />
      default: return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Staff': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Viewer': return 'bg-green-100 text-green-800 border-green-200'
      case 'Client': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'Aceptada': return 'bg-green-100 text-green-800'
      case 'Expirada': return 'bg-red-100 text-red-800'
      case 'Rechazada': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendiente': return <Clock className="w-4 h-4" />
      case 'Aceptada': return <CheckCircle className="w-4 h-4" />
      case 'Expirada': return <AlertTriangle className="w-4 h-4" />
      case 'Rechazada': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestión del Equipo
          </DialogTitle>
          <DialogDescription>
            Administra los miembros del equipo y envía invitaciones para colaborar en este proyecto.
          </DialogDescription>
        </DialogHeader>

        {/* Mensajes de feedback */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Miembros ({teamMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'invitations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Invitaciones ({invitations.length})
          </button>
        </div>

        {/* Contenido de las tabs */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Cargando...</span>
          </div>
        ) : (
          <>
            {/* Tab de Miembros */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin miembros</h3>
                    <p className="text-gray-500">Invita a colaboradores para trabajar en este proyecto.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {teamMembers.map((member) => (
                      <Card key={member.user_id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {(member.profiles?.nombre_completo || member.profiles?.email || 'U')[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.profiles?.nombre_completo || 'Usuario'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.profiles?.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {editingMember === member.user_id ? (
                                <div className="flex items-center gap-2">
                                  <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Admin">Admin</SelectItem>
                                      <SelectItem value="Staff">Staff</SelectItem>
                                      <SelectItem value="Viewer">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateRole(member.user_id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingMember(null)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Badge className={`${getRoleBadgeColor(member.rol)} flex items-center gap-1`}>
                                    {getRoleIcon(member.rol)}
                                    {member.rol}
                                  </Badge>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingMember(member.user_id)
                                        setNewRole(member.rol)
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveMember(
                                        member.user_id,
                                        member.profiles?.nombre_completo || member.profiles?.email || 'Usuario'
                                      )}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {member.ultimo_acceso && (
                            <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Último acceso: {new Date(member.ultimo_acceso).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Formulario para nueva invitación */}
                <Card className="border-2 border-dashed border-gray-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Invitar Nuevo Miembro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={newInvitation.email}
                          onChange={(e) => setNewInvitation(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Rol</Label>
                        <Select
                          value={newInvitation.role}
                          onValueChange={(value: any) => setNewInvitation(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Viewer">Viewer - Solo lectura</SelectItem>
                            <SelectItem value="Staff">Staff - Edición completa</SelectItem>
                            <SelectItem value="Admin">Admin - Control total</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Mensaje personalizado (opcional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Agrega un mensaje personalizado para esta invitación..."
                        value={newInvitation.customMessage}
                        onChange={(e) => setNewInvitation(prev => ({ ...prev, customMessage: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleSendInvitation}
                      disabled={sending || !newInvitation.email.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando invitación...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Invitación
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab de Invitaciones */}
            {activeTab === 'invitations' && (
              <div className="space-y-4">
                {invitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin invitaciones pendientes</h3>
                    <p className="text-gray-500">Las invitaciones enviadas aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {invitations.map((invitation) => (
                      <Card key={invitation.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{invitation.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={`${getRoleBadgeColor(invitation.rol)} flex items-center gap-1`}>
                                    {getRoleIcon(invitation.rol)}
                                    {invitation.rol}
                                  </Badge>
                                  <Badge className={`${getInvitationStatusColor(invitation.estado || 'Pendiente')} flex items-center gap-1`}>
                                    {getInvitationStatusIcon(invitation.estado || 'Pendiente')}
                                    {invitation.estado || 'Pendiente'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {invitation.fecha_expiracion && (
                                <div className="text-xs text-gray-500">
                                  Expira: {new Date(invitation.fecha_expiracion).toLocaleDateString('es-ES')}
                                </div>
                              )}

                              {invitation.estado === 'Pendiente' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevokeInvitation(invitation.id!)}
                                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Revocar
                                </Button>
                              )}
                            </div>
                          </div>

                          {invitation.notas_admin && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>Nota:</strong> {invitation.notas_admin}
                              </p>
                            </div>
                          )}

                          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Enviada: {new Date(invitation.created_at!).toLocaleDateString('es-ES')}
                            {invitation.fecha_aceptacion && (
                              <span className="ml-2">
                                • Aceptada: {new Date(invitation.fecha_aceptacion).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}