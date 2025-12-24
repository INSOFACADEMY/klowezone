import { supabase } from './supabase'

export interface TimeEntry {
  id?: string
  tarea_id?: string
  user_id?: string
  proyecto_id?: string
  descripcion?: string
  inicio: string
  fin?: string
  duracion_segundos?: number
  es_facturable?: boolean
  tarifa_por_hora?: number
  costo_total?: number
  created_at?: string
  updated_at?: string
}

// Iniciar un time entry
export async function startTimeEntry(data: {
  tarea_id?: string
  proyecto_id: string
  descripcion?: string
}): Promise<TimeEntry> {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) throw new Error('No authenticated user')

    const timeEntry = {
      tarea_id: data.tarea_id,
      proyecto_id: data.proyecto_id,
      user_id: user.id,
      descripcion: data.descripcion,
      inicio: new Date().toISOString(),
      es_facturable: true
    }

    const { data: result, error } = await supabase
      .from('time_entries')
      .insert([timeEntry])
      .select()
      .single()

    if (error) {
      console.error('Error starting time entry:', error)
      throw error
    }

    return result as TimeEntry
  } catch (error) {
    console.error('Error in startTimeEntry:', error)
    throw error
  }
}

// Detener un time entry activo
export async function stopTimeEntry(timeEntryId: string): Promise<TimeEntry> {
  try {
    const now = new Date()
    const fin = now.toISOString()

    // Primero obtener el time entry para calcular duración
    const { data: existingEntry, error: fetchError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', timeEntryId)
      .single()

    if (fetchError) {
      console.error('Error fetching time entry:', fetchError)
      throw fetchError
    }

    const inicio = new Date(existingEntry.inicio)
    const duracion_segundos = Math.floor((now.getTime() - inicio.getTime()) / 1000)

    // Actualizar con fin y duración
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        fin: fin,
        duracion_segundos: duracion_segundos
      })
      .eq('id', timeEntryId)
      .select()
      .single()

    if (error) {
      console.error('Error stopping time entry:', error)
      throw error
    }

    return data as TimeEntry
  } catch (error) {
    console.error('Error in stopTimeEntry:', error)
    throw error
  }
}

// Obtener time entries activos (sin fin)
export async function getActiveTimeEntries(userId?: string): Promise<TimeEntry[]> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id

    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        tareas:tarea_id (
          titulo
        ),
        proyectos:proyecto_id (
          nombre_proyecto
        )
      `)
      .eq('user_id', targetUserId)
      .is('fin', null)
      .order('inicio', { ascending: false })

    if (error) {
      console.error('Error fetching active time entries:', error)
      return [] // Devolver array vacío en caso de error
    }

    return data as TimeEntry[]
  } catch (error) {
    console.error('Error in getActiveTimeEntries:', error)
    return [] // Devolver array vacío en caso de error
  }
}

// Obtener time entries por rango de fechas
export async function getTimeEntriesByDateRange(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<TimeEntry[]> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id

    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        tareas:tarea_id (
          titulo
        ),
        proyectos:proyecto_id (
          nombre_proyecto
        )
      `)
      .eq('user_id', targetUserId)
      .gte('inicio', startDate)
      .lte('inicio', endDate)
      .order('inicio', { ascending: false })

    if (error) {
      console.error('Error fetching time entries by date:', error)
      throw error
    }

    return data as TimeEntry[]
  } catch (error) {
    console.error('Error in getTimeEntriesByDateRange:', error)
    throw error
  }
}

// Obtener time entries por tarea
export async function getTimeEntriesByTask(taskId: string): Promise<TimeEntry[]> {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('tarea_id', taskId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('inicio', { ascending: false })

    if (error) {
      console.error('Error fetching time entries by task:', error)
      throw error
    }

    return data as TimeEntry[]
  } catch (error) {
    console.error('Error in getTimeEntriesByTask:', error)
    throw error
  }
}

// Obtener estadísticas de tiempo por proyecto
export async function getTimeStatsByProject(projectId: string, userId?: string) {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id

    const { data: entries, error } = await supabase
      .from('time_entries')
      .select('duracion_segundos, es_facturable, costo_total')
      .eq('proyecto_id', projectId)
      .eq('user_id', targetUserId)

    if (error) {
      console.error('Error fetching time stats:', error)
      throw error
    }

    const total_segundos = entries?.reduce((sum, entry) => sum + (entry.duracion_segundos || 0), 0) || 0
    const segundos_facturables = entries?.filter(e => e.es_facturable).reduce((sum, entry) => sum + (entry.duracion_segundos || 0), 0) || 0
    const costo_total = entries?.reduce((sum, entry) => sum + (entry.costo_total || 0), 0) || 0
    const entradas_count = entries?.length || 0

    // Convertir segundos a horas para display
    const total_horas = Math.round((total_segundos / 3600) * 100) / 100
    const horas_facturables = Math.round((segundos_facturables / 3600) * 100) / 100

    return {
      total_segundos,
      segundos_facturables,
      costo_total,
      entradas_count,
      total_horas,
      horas_facturables
    }
  } catch (error) {
    console.error('Error in getTimeStatsByProject:', error)
    throw error
  }
}

// Actualizar un time entry
export async function updateTimeEntry(
  id: string,
  updates: Partial<Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>>
): Promise<TimeEntry> {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating time entry:', error)
      throw error
    }

    return data as TimeEntry
  } catch (error) {
    console.error('Error in updateTimeEntry:', error)
    throw error
  }
}

// Eliminar un time entry
export async function deleteTimeEntry(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting time entry:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteTimeEntry:', error)
    throw error
  }
}
