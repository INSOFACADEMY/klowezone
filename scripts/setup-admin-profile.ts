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

async function setupAdminProfile() {
  try {
    console.log('🚀 Configurando perfil de administrador...')

    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@klowezone.com' }
    })

    if (!adminUser) {
      console.error('❌ Usuario admin no encontrado en la base de datos')
      return
    }

    console.log('👤 Usuario admin encontrado:', adminUser.id)

    // Create user profile if it doesn't exist
    const existingProfile = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM user_profiles WHERE id = ${adminUser.id}
    `

    if (existingProfile.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO user_profiles (id)
        VALUES (${adminUser.id})
      `
      console.log('✅ Perfil de usuario creado')
    } else {
      console.log('ℹ️ Perfil de usuario ya existe')
    }

    // Create default organization if it doesn't exist
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
      console.log('✅ Organización KloweZone creada:', defaultOrg.id)
    } else {
      console.log('ℹ️ Organización KloweZone ya existe:', defaultOrg.id)
    }

    // Create membership if it doesn't exist
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
      console.log('✅ Membresía OWNER creada')
    } else {
      console.log('ℹ️ Membresía ya existe')
    }

    // Set active organization in user profile
    await prisma.$executeRaw`
      UPDATE user_profiles
      SET active_org_id = ${defaultOrg.id}
      WHERE id = ${adminUser.id}
    `
    console.log('✅ Organización activa configurada')

    console.log('\n🎉 ¡Perfil de administrador completamente configurado!')
    console.log('📧 Email: admin@klowezone.com')
    console.log('🔒 Password: SuperAdmin123!')
    console.log('🏢 Organización: KloweZone (OWNER)')
    console.log('🆔 User ID:', adminUser.id)
    console.log('🏢 Org ID:', defaultOrg.id)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdminProfile()
