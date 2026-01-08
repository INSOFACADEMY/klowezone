import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { hashPassword } from '../src/lib/auth'
import { randomBytes } from 'crypto'

// Types and helper functions
interface AdminSetupParams {
  email?: string
  userId?: string
  password?: string
  orgSlug?: string
  orgName?: string
}

async function getOrCreateSuperAdminRole(prisma: PrismaClient): Promise<string> {
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

async function generateAdminPassword(params: AdminSetupParams): Promise<string> {
  // Usar password de env var si existe, sino usar parámetro, sino generar uno random
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD || params.password
  if (envPassword) {
    console.log('   🔐 Usando password proporcionado')
    return envPassword
  }

  // Generar password random de 16 caracteres
  const randomPassword = randomBytes(8).toString('hex') // 16 caracteres hex
  console.log('   🔐 Password generado (guárdalo):', randomPassword)
  console.log('   💡 Para usar un password específico, setea ADMIN_INITIAL_PASSWORD en .env')

  return randomPassword
}

async function getOrCreateAdminUser(
  prisma: PrismaClient,
  params: AdminSetupParams & { email: string; userId: string; roleId: string }
): Promise<any> {
  // Buscar usuario existente
  let adminUser = await prisma.user.findUnique({
    where: { id: params.userId }
  })

  if (!adminUser) {
    // Generar password y hashearlo
    console.log('   🔐 Generando password para admin...')
    const plainPassword = await generateAdminPassword(params)
    const hashedPassword = await hashPassword(plainPassword)

    adminUser = await prisma.user.create({
      data: {
        id: params.userId,
        email: params.email,
        password: hashedPassword,
        roleId: params.roleId,
        firstName: 'Super',
        lastName: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    console.log('   ✅ Usuario admin creado en Prisma:', adminUser.id)
  } else {
    console.log('   ℹ️ Usuario admin ya existe en Prisma:', adminUser.id)
  }

  return adminUser
}

async function getOrCreateDefaultOrganization(
  prisma: PrismaClient,
  params: AdminSetupParams
): Promise<any> {
  const orgName = params.orgName || 'KloweZone'

  // Buscar organización existente por nombre
  let defaultOrg = await prisma.organization.findFirst({
    where: { name: orgName }
  })

  if (!defaultOrg) {
    // Si no hay org existente, usar el slug proporcionado o generar uno basado en el nombre
    const finalSlug = params.orgSlug || orgName.toLowerCase().replace(/\s+/g, '-')

    defaultOrg = await prisma.organization.create({
      data: {
        name: orgName,
        slug: finalSlug,
        description: `Organización principal de ${orgName}`
      }
    })
    console.log('   ✅ Organización creada:', defaultOrg.id)
  } else {
    console.log('   ℹ️ Organización ya existe:', defaultOrg.id)
  }

  return defaultOrg
}

// Load environment variables
const envLocalPath = resolve('.env.local')
const envPath = resolve('.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath })
} else if (existsSync(envPath)) {
  config({ path: envPath })
}

// Environment variables with defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const connectionString = process.env.DATABASE_URL
const adminEmail = process.env.ADMIN_EMAIL || 'admin@klowezone.com'
const adminUserId = process.env.ADMIN_USER_ID
const adminOrgSlug = process.env.ADMIN_ORG_SLUG
const adminOrgName = process.env.ADMIN_ORG_NAME

if (!supabaseUrl || !supabaseKey || !connectionString) {
  console.error('❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL')
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

    const adminUser = supabaseUser.users.find(u => u.email === adminEmail)
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
      where: { email: adminEmail }
    })

    if (existingPrismaUser && existingPrismaUser.id !== adminUserTyped.id) {
      console.log('   🗑️ Eliminando usuario incorrecto:', existingPrismaUser.id)
      await prisma.user.delete({
        where: { id: existingPrismaUser.id }
      })
      console.log('   ✅ Usuario incorrecto eliminado')
    }

    // Validate required fields
    if (!adminUserTyped.email) {
      throw new Error(`Admin user email is missing for user id=${adminUserTyped.id}`)
    }
    if (!adminUserTyped.id) {
      throw new Error('Admin user id is missing')
    }

    // 3. Crear/asegurar role superadmin
    console.log('\n3. Asegurando role superadmin...')
    const superAdminRoleId = await getOrCreateSuperAdminRole(prisma)

    // 4. Crear/asegurar usuario admin
    console.log('\n4. Creando usuario admin...')
    const adminUserIdToUse = adminUserId || adminUserTyped.id
    const prismaUser = await getOrCreateAdminUser(prisma, {
      email: adminUserTyped.email,
      userId: adminUserIdToUse,
      roleId: superAdminRoleId
    })

    // 5. Crear perfil en user_profiles
    console.log('\n5. Creando perfil en user_profiles...')
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

    // 6. Crear organización por defecto
    console.log('\n6. Creando organización por defecto...')
    const defaultOrg = await getOrCreateDefaultOrganization(prisma, {
      orgSlug: adminOrgSlug,
      orgName: adminOrgName
    })

    // 7. Crear membresía
    console.log('\n7. Creando membresía OWNER...')
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

    // 8. Establecer organización activa
    console.log('\n8. Estableciendo organización activa...')
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



