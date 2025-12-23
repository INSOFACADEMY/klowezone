import { supabase } from './supabase'

export interface Project {
  id?: string
  cliente_id: string
  user_id?: string
  nombre_proyecto: string
  descripcion?: string
  estado: 'Planificación' | 'En Progreso' | 'Completado' | 'Pausado' | 'Cancelado'
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente'
  fecha_entrega?: string
  presupuesto?: number
  created_at?: string
  updated_at?: string
  // Campo adicional para incluir información del cliente
  cliente_nombre?: string
}

// Obtener todos los proyectos del usuario actual, incluyendo el nombre del cliente
export async function getProjects(): Promise<Project[]> {
  try {
    console.log('📊 Consultando proyectos...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Usuario para proyectos:', user?.id);

    const { data, error } = await supabase
      .from('proyectos')
      .select(`
        *,
        clientes:cliente_id (
          nombre
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error RLS/Consulta en proyectos:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      throw error
    }

    // Transformar los datos para incluir el nombre del cliente
    const projectsWithClientName = data?.map(project => ({
      ...project,
      cliente_nombre: project.clientes?.nombre || 'Cliente no encontrado'
    })) || []

    console.log('✅ Proyectos obtenidos:', projectsWithClientName.length);
    return projectsWithClientName as Project[]
  } catch (error) {
    console.error('❌ Error en getProjects:', error)
    throw error
  }
}

// Crear un nuevo proyecto
export async function createProject(project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'cliente_nombre'>): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .insert([{
        ...project,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select(`
        *,
        clientes:cliente_id (
          nombre
        )
      `)
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw error
    }

    // Transformar el resultado para incluir el nombre del cliente
    const projectWithClientName = {
      ...data,
      cliente_nombre: data.clientes?.nombre || 'Cliente no encontrado'
    }

    return projectWithClientName as Project
  } catch (error) {
    console.error('Error in createProject:', error)
    throw error
  }
}

// Obtener estadísticas de proyectos
export async function getProjectStats(): Promise<{
  total: number
  completados: number
  enProgreso: number
  planificacion: number
}> {
  try {
    const { data: projects, error } = await supabase
      .from('proyectos')
      .select('estado')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

    if (error) {
      console.error('Error fetching project stats:', error)
      throw error
    }

    // Calcular estadísticas
    const total = projects?.length || 0
    const completados = projects?.filter(p => p.estado === 'Completado').length || 0
    const enProgreso = projects?.filter(p => p.estado === 'En Progreso').length || 0
    const planificacion = projects?.filter(p => p.estado === 'Planificación').length || 0

    return {
      total,
      completados,
      enProgreso,
      planificacion
    }
  } catch (error) {
    console.error('Error in getProjectStats:', error)
    throw error
  }
}

// Actualizar un proyecto
export async function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'cliente_nombre'>>): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .select(`
        *,
        clientes:cliente_id (
          nombre
        )
      `)
      .single()

    if (error) {
      console.error('Error updating project:', error)
      throw error
    }

    // Transformar el resultado para incluir el nombre del cliente
    const projectWithClientName = {
      ...data,
      cliente_nombre: data.clientes?.nombre || 'Cliente no encontrado'
    }

    return projectWithClientName as Project
  } catch (error) {
    console.error('Error in updateProject:', error)
    throw error
  }
}

// Eliminar un proyecto
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', id)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

    if (error) {
      console.error('Error deleting project:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in deleteProject:', error)
    throw error
  }
}

// Obtener proyectos por cliente
export async function getProjectsByClient(clienteId: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .select(`
        *,
        clientes:cliente_id (
          nombre
        )
      `)
      .eq('cliente_id', clienteId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects by client:', error)
      throw error
    }

    // Transformar los datos para incluir el nombre del cliente
    const projectsWithClientName = data?.map(project => ({
      ...project,
      cliente_nombre: project.clientes?.nombre || 'Cliente no encontrado'
    })) || []

    return projectsWithClientName as Project[]
  } catch (error) {
    console.error('Error in getProjectsByClient:', error)
    throw error
  }
}

// Buscar proyectos por nombre o descripción
export async function searchProjects(query: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .select(`
        *,
        clientes:cliente_id (
          nombre
        )
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .or(`nombre_proyecto.ilike.%${query}%,descripcion.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching projects:', error)
      throw error
    }

    // Transformar los datos para incluir el nombre del cliente
    const projectsWithClientName = data?.map(project => ({
      ...project,
      cliente_nombre: project.clientes?.nombre || 'Cliente no encontrado'
    })) || []

    return projectsWithClientName as Project[]
  } catch (error) {
    console.error('Error in searchProjects:', error)
    throw error
  }
}
