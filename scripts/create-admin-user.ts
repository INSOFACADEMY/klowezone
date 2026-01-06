import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Load environment variables
const envLocalPath = resolve('.env.local')
const envPath = resolve('.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath })
} else if (existsSync(envPath)) {
  config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminUser() {
  console.log('👤 Creando usuario administrador...')

  try {
    // Create the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@klowezone.com',
      password: 'SuperAdmin123!'
    })

    if (authError) {
      console.log('⚠️ Usuario ya existe o error:', authError.message)

      // Try to sign in instead
      console.log('🔑 Intentando iniciar sesión...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@klowezone.com',
        password: 'SuperAdmin123!'
      })

      if (signInError) {
        console.error('❌ Error al iniciar sesión:', signInError.message)
        return
      }

      console.log('✅ Usuario administrador ya existe y puede iniciar sesión')
      console.log('📧 Email: admin@klowezone.com')
      console.log('🔒 Password: SuperAdmin123!')
      return
    }

    console.log('✅ Usuario administrador creado exitosamente')
    console.log('📧 Email: admin@klowezone.com')
    console.log('🔒 Password: SuperAdmin123!')

    if (authData.user) {
      console.log('🆔 User ID:', authData.user.id)
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

createAdminUser()
