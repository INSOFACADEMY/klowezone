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

async function fixAdminSetup() {
  try {
    console.log('🔧 Corrigiendo configuración del administrador...\n')

    // 1. Obtener usuario correcto de Supabase
    console.log('1. Obteniendo usuario de Supabase Auth...')
    const { data: supabaseUser, error: supabaseError } = await supabase.auth.admin.listUsers()

    if (supabaseError) {
      console.error('❌ Error obteniendo usuarios de Supabase:', supabaseError)
      return
    }

    const adminUser = supabaseUser.users.find(u => u.email === 'admin@klowezone.com')
    if (!adminUser) {
      console.error('❌ Usuario admin no encontrado en Supabase Auth')
      return
    }

    console.log('✅ Usuario Supabase encontrado:')
    console.log('   🆔 ID:', adminUser.id)
    console.log('   📧 Email:', adminUser.email)

    // 2. Eliminar usuario incorrecto de Prisma si existe
    console.log('\n2. Limpiando usuario incorrecto de Prisma...')
    const existingPrismaUser = await prisma.user.findFirst({
      where: { email: 'admin@klowezone.com' }
    })

    if (existingPrismaUser && existingPrismaUser.id !== adminUser.id) {
      console.log('   🗑️ Eliminando usuario incorrecto:', existingPrismaUser.id)
      await prisma.user.delete({
        where: { id: existingPrismaUser.id }
      })
      console.log('   ✅ Usuario incorrecto eliminado')
    }

    // 3. Crear usuario correcto en Prisma
    console.log('\n3. Creando usuario correcto en Prisma...')
    let prismaUser = await prisma.user.findUnique({
      where: { id: adminUser.id }
    })

    if (!prismaUser) {
      prismaUser = await prisma.user.create({
        data: {
          id: adminUser.id,
          email: adminUser.email,
          name: 'Super Admin',
          createdAt: new Date(adminUser.created_at),
          updatedAt: new Date()
        }
      })
      console.log('   ✅ Usuario creado en Prisma')
    } else {
      console.log('   ℹ️ Usuario ya existe en Prisma')
    }

    // 4. Crear perfil en user_profiles
    console.log('\n4. Creando perfil en user_profiles...')
    const existingProfile = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM user_profiles WHERE id = ${adminUser.id}
    `

    if (existingProfile.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO user_profiles (id)
        VALUES (${adminUser.id})
      `
      console.log('   ✅ Perfil creado en user_profiles')
    } else {
      console.log('   ℹ️ Perfil ya existe en user_profiles')
    }

    // 5. Crear organización por defecto
    console.log('\n5. Creando organización por defecto...')
    let defaultOrg = await prisma.organization.findFirst({
      where: { name: 'KloweZone' }
    })

    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'KloweZone',
          description: 'Organización principal de KloweZone'
        }
      })
      console.log('   ✅ Organización KloweZone creada:', defaultOrg.id)
    } else {
      console.log('   ℹ️ Organización KloweZone ya existe:', defaultOrg.id)
    }

    // 6. Crear membresía
    console.log('\n6. Creando membresía OWNER...')
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: adminUser.id,
        organizationId: defaultOrg.id
      }
    })

    if (!existingMembership) {
      await prisma.organizationMember.create({
        data: {
          userId: adminUser.id,
          organizationId: defaultOrg.id,
          role: 'OWNER'
        }
      })
      console.log('   ✅ Membresía OWNER creada')
    } else {
      console.log('   ℹ️ Membresía ya existe')
    }

    // 7. Establecer organización activa
    console.log('\n7. Estableciendo organización activa...')
    await prisma.$executeRaw`
      UPDATE user_profiles
      SET active_org_id = ${defaultOrg.id}
      WHERE id = ${adminUser.id}
    `
    console.log('   ✅ Organización activa configurada')

    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETA!')
    console.log('===========================')
    console.log('📧 Email: admin@klowezone.com')
    console.log('🔒 Password: SuperAdmin123!')
    console.log('🏢 Organización: KloweZone (OWNER)')
    console.log('🆔 User ID:', adminUser.id)
    console.log('🏢 Org ID:', defaultOrg.id)
    console.log('\n✅ Ahora puedes iniciar sesión en la aplicación')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminSetup()



