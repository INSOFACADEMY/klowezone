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

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// ID correcto del usuario admin en Supabase Auth
const ADMIN_USER_ID = '19fcf809-bdd1-4b45-bbcb-9347befabd99'
const ADMIN_EMAIL = 'admin@klowezone.com'

async function setupAdminDirect() {
  try {
    console.log('🔧 Configurando administrador directamente...\n')

    // 1. Eliminar usuario incorrecto si existe
    console.log('1. Limpiando usuario incorrecto...')
    const existingUser = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL }
    })

    if (existingUser && existingUser.id !== ADMIN_USER_ID) {
      console.log('   🗑️ Eliminando usuario con ID incorrecto:', existingUser.id)
      await prisma.user.delete({
        where: { id: existingUser.id }
      })
      console.log('   ✅ Usuario incorrecto eliminado')
    }

    // 2. Crear usuario correcto
    console.log('\n2. Creando usuario correcto...')
    let adminUser = await prisma.user.findUnique({
      where: { id: ADMIN_USER_ID }
    })

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          id: ADMIN_USER_ID,
          email: ADMIN_EMAIL,
          name: 'Super Admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      console.log('   ✅ Usuario admin creado en Prisma')
    } else {
      console.log('   ℹ️ Usuario admin ya existe en Prisma')
    }

    // 3. Crear perfil en user_profiles
    console.log('\n3. Creando perfil en user_profiles...')
    const existingProfile = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM user_profiles WHERE id = ${ADMIN_USER_ID}
    `

    if (existingProfile.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO user_profiles (id)
        VALUES (${ADMIN_USER_ID})
      `
      console.log('   ✅ Perfil creado en user_profiles')
    } else {
      console.log('   ℹ️ Perfil ya existe en user_profiles')
    }

    // 4. Crear organización
    console.log('\n4. Creando organización KloweZone...')
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

    // 5. Crear membresía
    console.log('\n5. Creando membresía OWNER...')
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: ADMIN_USER_ID,
        organizationId: defaultOrg.id
      }
    })

    if (!existingMembership) {
      await prisma.organizationMember.create({
        data: {
          userId: ADMIN_USER_ID,
          organizationId: defaultOrg.id,
          role: 'OWNER'
        }
      })
      console.log('   ✅ Membresía OWNER creada')
    } else {
      console.log('   ℹ️ Membresía ya existe')
    }

    // 6. Establecer organización activa
    console.log('\n6. Estableciendo organización activa...')
    await prisma.$executeRaw`
      UPDATE user_profiles
      SET active_org_id = ${defaultOrg.id}
      WHERE id = ${ADMIN_USER_ID}
    `
    console.log('   ✅ Organización activa configurada')

    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA!')
    console.log('=============================')
    console.log('📧 Email: admin@klowezone.com')
    console.log('🔒 Password: SuperAdmin123!')
    console.log('🏢 Organización: KloweZone (OWNER)')
    console.log('🆔 User ID:', ADMIN_USER_ID)
    console.log('🏢 Org ID:', defaultOrg.id)
    console.log('\n✅ Ahora puedes iniciar sesión en la aplicación')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdminDirect()
