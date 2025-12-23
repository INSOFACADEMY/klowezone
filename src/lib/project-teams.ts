import { supabase } from './supabase'

export interface ProjectTeamMember {
  proyecto_id: string
  user_id: string
  rol: 'Admin' | 'Staff' | 'Viewer' | 'Client'
  invitado_por?: string
  fecha_invitacion?: string
  ultimo_acceso?: string
  permisos_especiales?: Record<string, any>
  profiles?: {
    nombre_completo?: string
    email?: string
    avatar_url?: string
  }
}

// Agregar un miembro al equipo del proyecto
export async function addTeamMember(data: {
  proyecto_id: string
  user_id: string
  rol: 'Admin' | 'Staff' | 'Viewer' | 'Client'
  permisos_especiales?: Record<string, any>
}): Promise<void> {
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
      throw new Error('No tienes permisos para agregar miembros al equipo')
    }

    const teamMember = {
      proyecto_id: data.proyecto_id,
      user_id: data.user_id,
      rol: data.rol,
      invitado_por: currentUser.id,
      permisos_especiales: data.permisos_especiales || {}
    }

    const { error } = await supabase
      .from('proyecto_equipo')
      .insert([teamMember])

    if (error) {
      console.error('Error adding team member:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in addTeamMember:', error)
    throw error
  }
}

// Obtener equipo de un proyecto
export async function getProjectTeam(projectId: string): Promise<ProjectTeamMember[]> {
  try {
    const { data, error } = await supabase
      .from('proyecto_equipo')
      .select(`
        *,
        profiles:user_id (
          nombre_completo,
          email,
          avatar_url
        )
      `)
      .eq('proyecto_id', projectId)

    if (error) {
      console.error('Error fetching project team:', error)
      throw error
    }

    return data as ProjectTeamMember[]
  } catch (error) {
    console.error('Error in getProjectTeam:', error)
    throw error
  }
}

// Actualizar rol de un miembro del equipo
export async function updateTeamMemberRole(
  proyecto_id: string,
  user_id: string,
  rol: 'Admin' | 'Staff' | 'Viewer' | 'Client'
): Promise<void> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user
    if (!currentUser) throw new Error('No authenticated user')

    // Verificar permisos de admin
    const { data: membership, error: checkError } = await supabase
      .from('proyecto_equipo')
      .select('rol')
      .eq('proyecto_id', proyecto_id)
      .eq('user_id', currentUser.id)
      .single()

    if (checkError || membership?.rol !== 'Admin') {
      throw new Error('No tienes permisos para actualizar roles')
    }

    const { error } = await supabase
      .from('proyecto_equipo')
      .update({ rol: rol })
      .eq('proyecto_id', proyecto_id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Error updating team member role:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in updateTeamMemberRole:', error)
    throw error
  }
}

// Remover un miembro del equipo
export async function removeTeamMember(proyecto_id: string, user_id: string): Promise<void> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user
    if (!currentUser) throw new Error('No authenticated user')

    // Verificar permisos de admin
    const { data: membership, error: checkError } = await supabase
      .from('proyecto_equipo')
      .select('rol')
      .eq('proyecto_id', proyecto_id)
      .eq('user_id', currentUser.id)
      .single()

    if (checkError || membership?.rol !== 'Admin') {
      throw new Error('No tienes permisos para remover miembros')
    }

    // No permitir que un admin se remueva a sí mismo
    if (user_id === currentUser.id) {
      throw new Error('No puedes removerte a ti mismo del proyecto')
    }

    const { error } = await supabase
      .from('proyecto_equipo')
      .delete()
      .eq('proyecto_id', proyecto_id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Error removing team member:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in removeTeamMember:', error)
    throw error
  }
}

// Obtener proyectos donde el usuario es miembro del equipo
export async function getUserTeamProjects(userId?: string): Promise<any[]> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id

    const { data, error } = await supabase
      .from('proyecto_equipo')
      .select(`
        rol,
        fecha_invitacion,
        ultimo_acceso,
        proyectos:proyecto_id (
          id,
          nombre_proyecto,
          estado,
          fecha_entrega
        )
      `)
      .eq('user_id', targetUserId)

    if (error) {
      console.error('Error fetching user team projects:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserTeamProjects:', error)
    throw error
  }
}

// Verificar si un usuario tiene un rol específico en un proyecto
export async function checkUserProjectRole(
  proyecto_id: string,
  user_id?: string
): Promise<'Admin' | 'Staff' | 'Viewer' | 'Client' | null> {
  try {
    const targetUserId = user_id || (await supabase.auth.getUser()).data.user?.id

    const { data, error } = await supabase
      .from('proyecto_equipo')
      .select('rol')
      .eq('proyecto_id', proyecto_id)
      .eq('user_id', targetUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Usuario no es miembro del equipo
      }
      console.error('Error checking user project role:', error)
      throw error
    }

    return data.rol
  } catch (error) {
    console.error('Error in checkUserProjectRole:', error)
    return null
  }
}

// Actualizar último acceso del usuario al proyecto
export async function updateLastAccess(proyecto_id: string): Promise<void> {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user
    if (!currentUser) return

    const { error } = await supabase
      .from('proyecto_equipo')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('proyecto_id', proyecto_id)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error updating last access:', error)
      // No lanzamos error para no interrumpir el flujo
    }
  } catch (error) {
    console.error('Error in updateLastAccess:', error)
  }
}
