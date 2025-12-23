import { supabase } from './supabase'

export interface Client {
  id?: string
  user_id?: string
  nombre: string
  email?: string
  telefono?: string
  estado: 'Activo' | 'Inactivo' | 'Pendiente'
  notas?: string
  created_at?: string
  updated_at?: string
}

// Obtener todos los clientes del usuario actual
export async function getClients() {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      throw error
    }

    return data as Client[]
  } catch (error) {
    console.error('❌ Error en getClients:', error)
    throw error
  }
}

// Crear un nuevo cliente
export async function createClient(client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        ...client,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      throw error
    }

    return data as Client
  } catch (error) {
    console.error('Error in createClient:', error)
    throw error
  }
}

// Actualizar un cliente
export async function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      throw error
    }

    return data as Client
  } catch (error) {
    console.error('Error in updateClient:', error)
    throw error
  }
}

// Eliminar un cliente
export async function deleteClient(id: string) {
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in deleteClient:', error)
    throw error
  }
}

// Buscar clientes por nombre o email
export async function searchClients(query: string) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching clients:', error)
      throw error
    }

    return data as Client[]
  } catch (error) {
    console.error('Error in searchClients:', error)
    throw error
  }
}

// Obtener estadísticas de clientes
export async function getClientStats() {
  try {
    // Obtener todos los clientes del usuario
    const { data: clients, error } = await supabase
      .from('clientes')
      .select('*')

    if (error) {
      console.error('Error fetching client stats:', error)
      throw error
    }

    // Calcular estadísticas
    const total = clients?.length || 0
    const activos = clients?.filter(client => client.estado === 'Activo').length || 0

    // Calcular clientes nuevos este mes
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nuevosEsteMes = clients?.filter(client => {
      const createdAt = new Date(client.created_at)
      return createdAt >= startOfMonth
    }).length || 0

    return {
      total,
      activos,
      nuevosEsteMes
    }
  } catch (error) {
    console.error('Error in getClientStats:', error)
    throw error
  }
}

// Insertar datos de prueba
export async function insertTestClients() {
  try {
    const testClients = [
      {
        nombre: 'TechCorp Solutions',
        email: 'contacto@techcorp.com',
        telefono: '+1 (555) 123-4567',
        estado: 'Activo',
        notas: 'Empresa líder en soluciones tecnológicas. Proyecto de migración a la nube en proceso.'
      },
      {
        nombre: 'GreenLife Organics',
        email: 'info@greenlife.com',
        telefono: '+1 (555) 234-5678',
        estado: 'Activo',
        notas: 'Empresa de productos orgánicos. Necesitan sitio web e-commerce.'
      },
      {
        nombre: 'BuildMaster Construction',
        email: 'projects@buildmaster.com',
        telefono: '+1 (555) 345-6789',
        estado: 'Pendiente',
        notas: 'Constructora mediana. Interesados en software de gestión de proyectos.'
      },
      {
        nombre: 'EduTech Academy',
        email: 'admin@edutech.com',
        telefono: '+1 (555) 456-7890',
        estado: 'Activo',
        notas: 'Academia de tecnología educativa. Desarrollo de plataforma de cursos online.'
      },
      {
        nombre: 'FashionForward',
        email: 'hello@fashionforward.com',
        telefono: '+1 (555) 567-8901',
        estado: 'Inactivo',
        notas: 'Marca de moda. Proyecto pausado temporalmente.'
      }
    ]

    const { data, error } = await supabase
      .from('clientes')
      .insert(testClients)
      .select()

    if (error) {
      console.error('Error inserting test clients:', error)
      throw error
    }

    return data as Client[]
  } catch (error) {
    console.error('Error in insertTestClients:', error)
    throw error
  }
}

// Obtener un cliente específico por ID
export async function getClientById(id: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el cliente
        return null
      }
      console.error('Error fetching client:', error)
      throw error
    }

    return data as Client
  } catch (error) {
    console.error('Error in getClientById:', error)
    throw error
  }
}

// Obtener proyectos de un cliente específico
export async function getClientProjects(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .eq('cliente_id', clientId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching client projects:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getClientProjects:', error)
    throw error
  }
}
