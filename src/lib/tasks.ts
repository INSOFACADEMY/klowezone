import { supabase } from './supabase'

export interface Task {
  id?: string
  proyecto_id: string
  user_id?: string
  titulo: string
  descripcion?: string
  estado: 'To Do' | 'In Progress' | 'Review' | 'Done'
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente'
  asignado_a?: string
  fecha_inicio?: string
  fecha_entrega?: string
  orden_kanban?: number
  tiempo_estimado?: string // Interval string like '4 hours'
  tiempo_real?: string // Interval string
  progreso?: number
  etiquetas?: string[]
  created_at?: string
  updated_at?: string
}

// Obtener todas las tareas de un proyecto
export async function getTasksByProject(projectId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .eq('proyecto_id', projectId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('orden_kanban', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }

    return data as Task[]
  } catch (error) {
    console.error('Error in getTasksByProject:', error)
    throw error
  }
}

// Crear una nueva tarea
export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tareas')
      .insert([{
        ...task,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      throw error
    }

    return data as Task
  } catch (error) {
    console.error('Error in createTask:', error)
    throw error
  }
}

// Actualizar una tarea
export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tareas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      throw error
    }

    return data as Task
  } catch (error) {
    console.error('Error in updateTask:', error)
    throw error
  }
}

// Eliminar una tarea
export async function deleteTask(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tareas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteTask:', error)
    throw error
  }
}

// Actualizar orden Kanban de múltiples tareas
export async function updateTasksOrder(tasks: { id: string; orden_kanban: number }[]): Promise<void> {
  try {
    const updates = tasks.map(task =>
      supabase
        .from('tareas')
        .update({ orden_kanban: task.orden_kanban })
        .eq('id', task.id)
    )

    const results = await Promise.all(updates)

    for (const result of results) {
      if (result.error) {
        console.error('Error updating task order:', result.error)
        throw result.error
      }
    }
  } catch (error) {
    console.error('Error in updateTasksOrder:', error)
    throw error
  }
}

// Obtener tareas asignadas a un usuario
export async function getTasksByAssignee(userId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tareas')
      .select(`
        *,
        proyectos:proyecto_id (
          nombre_proyecto
        )
      `)
      .eq('asignado_a', userId)
      .order('fecha_entrega', { ascending: true })

    if (error) {
      console.error('Error fetching assigned tasks:', error)
      throw error
    }

    return data as Task[]
  } catch (error) {
    console.error('Error in getTasksByAssignee:', error)
    throw error
  }
}

// Obtener estadísticas de tareas por proyecto
export async function getTaskStats(projectId: string) {
  try {
    const { data: tasks, error } = await supabase
      .from('tareas')
      .select('estado, prioridad')
      .eq('proyecto_id', projectId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

    if (error) {
      console.error('Error fetching task stats:', error)
      throw error
    }

    const stats = {
      total: tasks?.length || 0,
      todo: tasks?.filter(t => t.estado === 'To Do').length || 0,
      inProgress: tasks?.filter(t => t.estado === 'In Progress').length || 0,
      review: tasks?.filter(t => t.estado === 'Review').length || 0,
      done: tasks?.filter(t => t.estado === 'Done').length || 0,
      urgentes: tasks?.filter(t => t.prioridad === 'Urgente').length || 0
    }

    return stats
  } catch (error) {
    console.error('Error in getTaskStats:', error)
    throw error
  }
}



















