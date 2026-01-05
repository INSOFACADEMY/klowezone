#!/usr/bin/env tsx

/**
 * BACKFILL PROJECT TENANT FIELDS - KLOWEZONE
 *
 * Agrega organizationId a las tablas de proyectos existentes.
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load environment variables
config({ path: '.env.local' })

// Configurar conexión a base de datos
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

console.log('🔗 Conexión a base de datos:')
const connInfo = getConnectionInfo(connectionString)
console.log(`   • Host: ${connInfo.host}`)
console.log(`   • Puerto: ${connInfo.port}`)
console.log(`   • Base de datos: ${connInfo.database}`)
console.log(`   • Tipo: ${connInfo.type}`)
console.log('')

// Configurar Prisma con PostgreSQL adapter
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function getConnectionInfo(connectionString: string) {
  try {
    const url = new URL(connectionString)
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      type: url.hostname.includes('neon.tech') ? '🟢 Supabase/Neon' : '🔵 PostgreSQL'
    }
  } catch (error) {
    return {
      host: 'unknown',
      port: 'unknown',
      database: 'unknown',
      type: '❌ Error parsing URL'
    }
  }
}

async function backfillProjectTenant() {
  console.log('🔄 BACKFILL PROJECT TENANT FIELDS')
  console.log('==================================\n')

  try {
    // Obtener organización por defecto
    const defaultOrg = await prisma.organization.findFirst({
      where: { slug: 'default-organization' }
    })

    if (!defaultOrg) {
      console.log('❌ No se encontró organización por defecto')
      console.log('💡 Ejecuta primero: npm run db:backfill:tenant')
      return
    }

    console.log(`🏢 Usando organización por defecto: ${defaultOrg.name} (${defaultOrg.id})`)
    console.log('')

    // 1. Backfill Project
    console.log('📋 Paso 1: Backfill Project...')
    const projectCount = await prisma.project.count()
    if (projectCount > 0) {
      await prisma.$executeRaw`
        UPDATE proyectos
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${projectCount} registros en proyectos`)
    } else {
      console.log('   ℹ️  No hay registros en proyectos')
    }

    // 2. Backfill ProjectDocument (basado en project_id -> organization_id)
    console.log('📋 Paso 2: Backfill ProjectDocument...')
    const documentCount = await prisma.projectDocument.count()
    if (documentCount > 0) {
      await prisma.$executeRaw`
        UPDATE project_documents
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${documentCount} registros en project_documents`)
    } else {
      console.log('   ℹ️  No hay registros en project_documents')
    }

    // 3. Backfill ProjectActivity (basado en project_id -> organization_id)
    console.log('📋 Paso 3: Backfill ProjectActivity...')
    const activityCount = await prisma.projectActivity.count()
    if (activityCount > 0) {
      await prisma.$executeRaw`
        UPDATE project_activities
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${activityCount} registros en project_activities`)
    } else {
      console.log('   ℹ️  No hay registros en project_activities')
    }

    // 4. Backfill ProjectExpense (basado en project_id -> organization_id)
    console.log('📋 Paso 4: Backfill ProjectExpense...')
    const expenseCount = await prisma.projectExpense.count()
    if (expenseCount > 0) {
      await prisma.$executeRaw`
        UPDATE project_expenses
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${expenseCount} registros en project_expenses`)
    } else {
      console.log('   ℹ️  No hay registros en project_expenses')
    }

    // 5. Backfill ProjectTeamMember (basado en project_id -> organization_id)
    console.log('📋 Paso 5: Backfill ProjectTeamMember...')
    const teamMemberCount = await prisma.projectTeamMember.count()
    if (teamMemberCount > 0) {
      await prisma.$executeRaw`
        UPDATE project_team_members
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${teamMemberCount} registros en project_team_members`)
    } else {
      console.log('   ℹ️  No hay registros en project_team_members')
    }

    console.log('')
    console.log('🎉 BACKFILL PROJECT COMPLETADO')
    console.log('===============================')
    console.log('✅ Todos los campos organizationId de proyectos han sido asignados a la organización por defecto')
    console.log('')
    console.log('📋 Próximos pasos:')
    console.log('1. Ahora puedes ejecutar: npx prisma db push')
    console.log('2. Luego ejecutar: npx tsx scripts/projectTenantSmoke.ts')

  } catch (error) {
    console.error('❌ Error en backfill:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  backfillProjectTenant().catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
}

export { backfillProjectTenant }
