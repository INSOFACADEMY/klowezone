#!/usr/bin/env tsx

/**
 * BACKFILL TENANT FIELDS - KLOWEZONE
 *
 * Agrega organizationId a las tablas existentes de manera incremental y segura.
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

async function backfillTenantFields() {
  console.log('🔄 BACKFILL TENANT FIELDS')
  console.log('=========================\n')

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

    // 1. Backfill SystemConfig
    console.log('📋 Paso 1: Backfill SystemConfig...')
    const systemConfigCount = await prisma.systemConfig.count()
    if (systemConfigCount > 0) {
      await prisma.$executeRaw`
        UPDATE system_config
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${systemConfigCount} registros en system_config`)
    } else {
      console.log('   ℹ️  No hay registros en system_config')
    }

    // 2. Backfill EmailProvider
    console.log('📋 Paso 2: Backfill EmailProvider...')
    const emailProviderCount = await prisma.emailProvider.count()
    if (emailProviderCount > 0) {
      await prisma.$executeRaw`
        UPDATE email_providers
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${emailProviderCount} registros en email_providers`)
    } else {
      console.log('   ℹ️  No hay registros en email_providers')
    }

    // 3. Backfill AIProvider
    console.log('📋 Paso 3: Backfill AIProvider...')
    // Prisma delegate for AIProvider is aIProvider due to acronym casing
    const aiProviderCount = await prisma.aIProvider.count()
    if (aiProviderCount > 0) {
      await prisma.$executeRaw`
        UPDATE ai_providers
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${aiProviderCount} registros en ai_providers`)
    } else {
      console.log('   ℹ️  No hay registros en ai_providers')
    }

    // 4. Backfill StorageProvider
    console.log('📋 Paso 4: Backfill StorageProvider...')
    const storageProviderCount = await prisma.storageProvider.count()
    if (storageProviderCount > 0) {
      await prisma.$executeRaw`
        UPDATE storage_providers
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${storageProviderCount} registros en storage_providers`)
    } else {
      console.log('   ℹ️  No hay registros en storage_providers')
    }

    // 5. Backfill AuditLog
    console.log('📋 Paso 5: Backfill AuditLog...')
    const auditLogCount = await prisma.auditLog.count()
    if (auditLogCount > 0) {
      await prisma.$executeRaw`
        UPDATE audit_logs
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${auditLogCount} registros en audit_logs`)
    } else {
      console.log('   ℹ️  No hay registros en audit_logs')
    }

    // 6. Backfill MetricEvent (opcional)
    console.log('📋 Paso 6: Backfill MetricEvent (opcional)...')
    const metricEventCount = await prisma.metricEvent.count()
    if (metricEventCount > 0) {
      await prisma.$executeRaw`
        UPDATE metric_events
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${metricEventCount} registros en metric_events`)
    } else {
      console.log('   ℹ️  No hay registros en metric_events')
    }

    // 7. Backfill MetricDashboard
    console.log('📋 Paso 7: Backfill MetricDashboard...')
    const metricDashboardCount = await prisma.metricDashboard.count()
    if (metricDashboardCount > 0) {
      await prisma.$executeRaw`
        UPDATE metric_dashboards
        SET organization_id = ${defaultOrg.id}
        WHERE organization_id IS NULL
      `
      console.log(`   ✅ Actualizados ${metricDashboardCount} registros en metric_dashboards`)
    } else {
      console.log('   ℹ️  No hay registros en metric_dashboards')
    }

    console.log('')
    console.log('🎉 BACKFILL COMPLETADO')
    console.log('======================')
    console.log('✅ Todos los campos organizationId han sido asignados a la organización por defecto')
    console.log('')
    console.log('📋 Próximos pasos:')
    console.log('1. Ahora puedes ejecutar: npx prisma db push')
    console.log('2. Luego ejecutar: npx tsx scripts/tenantIsolationSmoke.ts')

  } catch (error) {
    console.error('❌ Error en backfill:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  backfillTenantFields().catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
}

export { backfillTenantFields }



