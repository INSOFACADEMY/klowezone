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
  console.error('📝 Make sure .env.local or .env file exists with DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

async function createUserProfiles() {
  try {
    console.log('🔧 Creando tabla user_profiles...')

    // Crear tabla user_profiles usando raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        active_org_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    console.log('✅ Tabla user_profiles creada')

    // Crear perfil para el usuario admin
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@klowezone.com' },
      include: { memberships: true }
    })

    if (adminUser) {
      console.log('👤 Usuario admin encontrado:', adminUser.id)

      // Verificar si ya existe un perfil
      const existingProfile = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM user_profiles WHERE id = ${adminUser.id}
      `

      if (existingProfile.length === 0) {
        // Crear perfil con la primera organización como activa
        const firstMembership = adminUser.memberships[0]
        if (firstMembership) {
          await prisma.$executeRaw`
            INSERT INTO user_profiles (id, active_org_id)
            VALUES (${adminUser.id}, ${firstMembership.organizationId})
          `
          console.log('✅ Perfil de usuario admin creado con org activa:', firstMembership.organizationId)
        } else {
          await prisma.$executeRaw`
            INSERT INTO user_profiles (id)
            VALUES (${adminUser.id})
          `
          console.log('✅ Perfil de usuario admin creado (sin org activa)')
        }
      } else {
        console.log('ℹ️ Perfil de usuario admin ya existe')
      }
    } else {
      console.log('❌ Usuario admin@klowezone.com no encontrado')
    }

    console.log('🎉 ¡Proceso completado exitosamente!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createUserProfiles()
