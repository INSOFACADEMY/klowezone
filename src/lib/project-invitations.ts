import { supabase } from './supabase'

export interface ProjectInvitation {
  id?: string
  proyecto_id: string
  email: string
  rol: 'Admin' | 'Staff' | 'Viewer'
  token?: string
  invitado_por?: string
  estado?: 'Pendiente' | 'Aceptada' | 'Expirada' | 'Rechazada'
  fecha_expiracion?: string
  fecha_aceptacion?: string
  notas_admin?: string
  created_at?: string
  updated_at?: string
}

// Crear una nueva invitación
export async function createProjectInvitation(data: {
  proyecto_id: string
  email: string
  rol: 'Admin' | 'Staff' | 'Viewer'
  notas_admin?: string
}): Promise<ProjectInvitation> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user
    if (!currentUser) throw new Error('No authenticated user')

    // Verificar que el usuario actual es Admin del proyecto
    const { data: membership, error: checkError } = await supabase
      .from('proyecto_equipo')
      .select('rol')
      .eq('proyecto_id', data.proyecto_id)
      .eq('user_id', currentUser.id)
      .single()

    if (checkError || membership?.rol !== 'Admin') {
      throw new Error('No tienes permisos para invitar miembros al proyecto')
    }

    const invitation = {
      proyecto_id: data.proyecto_id,
      email: data.email.toLowerCase().trim(),
      rol: data.rol,
      invitado_por: currentUser.id,
      notas_admin: data.notas_admin
    }

    const { data: result, error } = await supabase
      .from('invitaciones_proyecto')
      .insert([invitation])
      .select(`
        *,
        proyectos:proyecto_id (
          nombre_proyecto
        ),
        profiles:invitado_por (
          nombre_completo,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error creating invitation:', error)
      throw error
    }

    return result as ProjectInvitation
  } catch (error) {
    console.error('Error in createProjectInvitation:', error)
    throw error
  }
}

// Obtener invitaciones de un proyecto
export async function getProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
  try {
    const { data, error } = await supabase
      .from('invitaciones_proyecto')
      .select(`
        *,
        proyectos:proyecto_id (
          nombre_proyecto
        ),
        profiles:invitado_por (
          nombre_completo,
          email
        )
      `)
      .eq('proyecto_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project invitations:', error)
      throw error
    }

    return data as ProjectInvitation[]
  } catch (error) {
    console.error('Error in getProjectInvitations:', error)
    throw error
  }
}

// Validar y obtener invitación por token
export async function validateInvitationToken(token: string): Promise<ProjectInvitation | null> {
  try {
    const { data, error } = await supabase
      .from('invitaciones_proyecto')
      .select(`
        *,
        proyectos:proyecto_id (
          id,
          nombre_proyecto,
          descripcion
        )
      `)
      .eq('token', token)
      .eq('estado', 'Pendiente')
      .gt('fecha_expiracion', new Date().toISOString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Invitación no encontrada o expirada
      }
      console.error('Error validating invitation token:', error)
      throw error
    }

    return data as ProjectInvitation
  } catch (error) {
    console.error('Error in validateInvitationToken:', error)
    return null
  }
}

// Aceptar invitación
export async function acceptInvitation(token: string): Promise<{ success: boolean; projectId: string; role: string }> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user
    if (!currentUser) throw new Error('No authenticated user')

    // Obtener la invitación
    const invitation = await validateInvitationToken(token)
    if (!invitation) {
      throw new Error('Invitación inválida o expirada')
    }

    // Verificar que el email coincida
    if (invitation.email !== currentUser.email?.toLowerCase()) {
      throw new Error('Esta invitación no corresponde a tu email')
    }

    // Agregar usuario al equipo del proyecto
    const { error: teamError } = await supabase
      .from('proyecto_equipo')
      .upsert({
        proyecto_id: invitation.proyecto_id,
        user_id: currentUser.id,
        rol: invitation.rol
      })

    if (teamError) {
      console.error('Error adding user to team:', teamError)
      throw teamError
    }

    // Marcar invitación como aceptada
    const { error: updateError } = await supabase
      .from('invitaciones_proyecto')
      .update({
        estado: 'Aceptada',
        fecha_aceptacion: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation status:', updateError)
      throw updateError
    }

    return {
      success: true,
      projectId: invitation.proyecto_id,
      role: invitation.rol
    }
  } catch (error) {
    console.error('Error in acceptInvitation:', error)
    throw error
  }
}

// Revocar invitación
export async function revokeInvitation(invitationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('invitaciones_proyecto')
      .update({
        estado: 'Rechazada'
      })
      .eq('id', invitationId)

    if (error) {
      console.error('Error revoking invitation:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in revokeInvitation:', error)
    throw error
  }
}

// Reenviar invitación (generar nuevo token)
export async function resendInvitation(invitationId: string): Promise<ProjectInvitation> {
  try {
    const { data, error } = await supabase
      .from('invitaciones_proyecto')
      .update({
        token: `inv_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
        estado: 'Pendiente'
      })
      .eq('id', invitationId)
      .select()
      .single()

    if (error) {
      console.error('Error resending invitation:', error)
      throw error
    }

    return data as ProjectInvitation
  } catch (error) {
    console.error('Error in resendInvitation:', error)
    throw error
  }
}

