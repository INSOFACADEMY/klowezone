import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
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
const connectionString = process.env.DATABASE_URL

if (!supabaseUrl || !supabaseKey || !connectionString) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserConsistency() {
  try {
    console.log('🔍 Verificando consistencia de usuarios...\n')

    // 1. Buscar usuario en Supabase Auth
    console.log('1. Buscando usuario en Supabase Auth...')
    const { data: supabaseUser, error: supabaseError } = await supabase.auth.admin.listUsers()

    if (supabaseError) {
      console.error('❌ Error obteniendo usuarios de Supabase:', supabaseError)
      return
    }

    const adminUser = supabaseUser.users.find(u => u.email === 'admin@klowezone.com')
    if (adminUser) {
      console.log('✅ Usuario encontrado en Supabase Auth:')
      console.log('   📧 Email:', adminUser.email)
      console.log('   🆔 User ID (Supabase):', adminUser.id)
      console.log('   📅 Created:', adminUser.created_at)
    } else {
      console.log('❌ Usuario NO encontrado en Supabase Auth')
      return
    }

    // 2. Buscar usuario en tabla User de Prisma
    console.log('\n2. Buscando usuario en tabla User (Prisma)...')
    const prismaUser = await prisma.user.findFirst({
      where: { email: 'admin@klowezone.com' }
    })

    if (prismaUser) {
      console.log('✅ Usuario encontrado en Prisma User:')
      console.log('   📧 Email:', prismaUser.email)
      console.log('   🆔 User ID (Prisma):', prismaUser.id)
      console.log('   📅 Created:', prismaUser.createdAt)
    } else {
      console.log('❌ Usuario NO encontrado en tabla User de Prisma')
    }

    // 3. Comparar IDs
    console.log('\n3. Comparación de IDs:')
    if (prismaUser) {
      const supabaseId = adminUser.id
      const prismaId = prismaUser.id

      console.log('   Supabase ID:', supabaseId)
      console.log('   Prisma ID:  ', prismaId)

      if (supabaseId === prismaId) {
        console.log('   ✅ IDs coinciden')
      } else {
        console.log('   ❌ IDs NO coinciden - ¡PROBLEMA!')
        console.log('   🔧 Solución: Necesitamos sincronizar los IDs')
      }
    }

    // 4. Verificar perfil en user_profiles
    console.log('\n4. Verificando perfil en user_profiles...')
    const profileQuery = await prisma.$queryRaw<Array<{ id: string; active_org_id: string | null }>>`
      SELECT id, active_org_id FROM user_profiles WHERE id = ${adminUser.id}
    `

    if (profileQuery.length > 0) {
      console.log('✅ Perfil encontrado en user_profiles:')
      console.log('   🆔 User ID:', profileQuery[0].id)
      console.log('   🏢 Active Org:', profileQuery[0].active_org_id || 'Ninguna')
    } else {
      console.log('❌ Perfil NO encontrado en user_profiles')
    }

    // 5. Recomendaciones
    console.log('\n🎯 CONCLUSIONES:')
    if (prismaUser && adminUser.id !== prismaUser.id) {
      console.log('❌ Los IDs no coinciden. Necesitamos:')
      console.log('   1. Actualizar el ID en tabla User de Prisma')
      console.log('   2. O crear un nuevo registro con el ID correcto')
    } else if (!prismaUser) {
      console.log('❌ El usuario no existe en Prisma. Necesitamos crearlo.')
    } else if (profileQuery.length === 0) {
      console.log('❌ Falta el perfil en user_profiles. Necesitamos crearlo.')
    } else {
      console.log('✅ Todo parece estar bien configurado.')
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserConsistency()







