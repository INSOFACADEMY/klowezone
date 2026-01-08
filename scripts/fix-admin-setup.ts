import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { hashPassword } from '../src/lib/auth'
import { randomBytes } from 'crypto'

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

async function getOrCreateSuperAdminRole(): Promise<string> {
  // Buscar role superadmin existente
  let superAdminRole = await prisma.role.findUnique({
    where: { name: 'superadmin' }
  })

  if (!superAdminRole) {
    console.log('   📝 Creando role superadmin...')
    superAdminRole = await prisma.role.create({
      data: {
        name: 'superadmin',
        description: 'Super Administrator with full access',
        isSystem: true
      }
    })
    console.log('   ✅ Role superadmin creado:', superAdminRole.id)
  } else {
    console.log('   ℹ️ Role superadmin ya existe:', superAdminRole.id)
  }

  return superAdminRole.id
}

async function generateAdminPassword(): Promise<string> {
  // Usar password de env var si existe, sino generar uno random
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD
  if (envPassword) {
    console.log('   🔐 Usando password de ADMIN_INITIAL_PASSWORD')
    return envPassword
  }

  // Generar password random de 16 caracteres
  const randomPassword = randomBytes(8).toString('hex') // 16 caracteres hex
  console.log('   🔐 Password generado (guárdalo):', randomPassword)
  console.log('   💡 Para usar un password específico, setea ADMIN_INITIAL_PASSWORD en .env')

  return randomPassword
}

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

    // Type assertion after null check to narrow the type
    const adminUserTyped = adminUser as NonNullable<typeof adminUser>

    console.log('✅ Usuario Supabase encontrado:')
    console.log('   🆔 ID:', adminUserTyped.id)
    console.log('   📧 Email:', adminUserTyped.email)

    // 2. Eliminar usuario incorrecto de Prisma si existe
    console.log('\n2. Limpiando usuario incorrecto de Prisma...')
    const existingPrismaUser = await prisma.user.findFirst({
      where: { email: 'admin@klowezone.com' }
    })

    if (existingPrismaUser && existingPrismaUser.id !== adminUserTyped.id) {
      console.log('   🗑️ Eliminando usuario incorrecto:', existingPrismaUser.id)
      await prisma.user.delete({
        where: { id: existingPrismaUser.id }
      })
      console.log('   ✅ Usuario incorrecto eliminado')
    }

    // 3. Crear usuario correcto en Prisma
    console.log('\n3. Creando usuario correcto en Prisma...')
    let prismaUser = await prisma.user.findUnique({
      where: { id: adminUserTyped.id }
    })

    if (!prismaUser) {
      // Validate required fields before creating user
      if (!adminUserTyped.email) {
        throw new Error(`Admin user email is missing for user id=${adminUserTyped.id}`)
      }
      if (!adminUserTyped.id) {
        throw new Error('Admin user id is missing')
      }
      if (!adminUserTyped.created_at) {
        throw new Error(`Admin user created_at is missing for user id=${adminUserTyped.id}`)
      }

      // Get or create superadmin role
      console.log('   👑 Obteniendo role superadmin...')
      const superAdminRoleId = await getOrCreateSuperAdminRole()

      // Generate/hash password
      console.log('   🔐 Generando password para admin...')
      const plainPassword = await generateAdminPassword()
      const hashedPassword = await hashPassword(plainPassword)

      prismaUser = await prisma.user.create({
        data: {
          id: adminUserTyped.id,
          email: adminUserTyped.email,
          password: hashedPassword,
          roleId: superAdminRoleId,
          firstName: 'Super',
          lastName: 'Admin',
          createdAt: new Date(adminUserTyped.created_at),
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
      SELECT id FROM user_profiles WHERE id = ${adminUserTyped.id}
    `

    if (existingProfile.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO user_profiles (id)
        VALUES (${adminUserTyped.id})
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
          slug: 'klowezone',
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
        userId: adminUserTyped.id,
        organizationId: defaultOrg.id
      }
    })

    if (!existingMembership) {
      await prisma.organizationMember.create({
        data: {
          userId: adminUserTyped.id,
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
      WHERE id = ${adminUserTyped.id}
    `
    console.log('   ✅ Organización activa configurada')

    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETA!')
    console.log('===========================')
    console.log('📧 Email: admin@klowezone.com')
    console.log('🔒 Password: SuperAdmin123!')
    console.log('🏢 Organización: KloweZone (OWNER)')
    console.log('🆔 User ID:', adminUserTyped.id)
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



