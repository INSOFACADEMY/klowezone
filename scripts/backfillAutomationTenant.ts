#!/usr/bin/env tsx

/**
 * BACKFILL AUTOMATION TENANT FIELDS - KLOWEZONE
 *
 * Agrega organizationId a las tablas de automatización existentes.
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
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

async function backfillAutomationTenant() {
  console.log('🔄 BACKFILL AUTOMATION TENANT FIELDS')
  console.log('====================================\n')

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

    // 1. Backfill AutomationWorkflow
    console.log('📋 Paso 1: Backfill AutomationWorkflow...')
    const workflowCount = await prisma.automationWorkflow.count()
    if (workflowCount > 0) {
      await prisma.$executeRaw`
        UPDATE automation_workflows
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${workflowCount} registros en automation_workflows`)
    } else {
      console.log('   ℹ️  No hay registros en automation_workflows')
    }

    // 2. Backfill AutomationAction (basado en workflowId)
    console.log('📋 Paso 2: Backfill AutomationAction...')
    const actionCount = await prisma.automationAction.count()
    if (actionCount > 0) {
      await prisma.$executeRaw`
        UPDATE automation_actions
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${actionCount} registros en automation_actions`)
    } else {
      console.log('   ℹ️  No hay registros en automation_actions')
    }

    // 3. Backfill AutomationRun (basado en workflowId)
    console.log('📋 Paso 3: Backfill AutomationRun...')
    const runCount = await prisma.automationRun.count()
    if (runCount > 0) {
      await prisma.$executeRaw`
        UPDATE automation_runs
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${runCount} registros en automation_runs`)
    } else {
      console.log('   ℹ️  No hay registros en automation_runs')
    }

    // 4. Backfill JobQueue (basado en runId)
    console.log('📋 Paso 4: Backfill JobQueue...')
    const jobCount = await prisma.jobQueue.count()
    if (jobCount > 0) {
      await prisma.$executeRaw`
        UPDATE job_queue
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${jobCount} registros en job_queue`)
    } else {
      console.log('   ℹ️  No hay registros en job_queue')
    }

    console.log('')
    console.log('🎉 BACKFILL AUTOMATION COMPLETADO')
    console.log('==================================')
    console.log('✅ Todos los campos organizationId de automatización han sido asignados a la organización por defecto')
    console.log('')
    console.log('📋 Próximos pasos:')
    console.log('1. Ahora puedes ejecutar: npx prisma db push')
    console.log('2. Luego ejecutar: npx tsx scripts/automationTenantSmoke.ts')

  } catch (error) {
    console.error('❌ Error en backfill:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  backfillAutomationTenant().catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
}

export { backfillAutomationTenant }







