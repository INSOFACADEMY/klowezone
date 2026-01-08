#!/usr/bin/env tsx

/**
 * TENANT ISOLATION SMOKE TEST - KLOWEZONE
 *
 * Prueba el aislamiento multi-tenant creando organizaciones separadas
 * y verificando que los datos no se mezclen entre tenants.
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

async function smokeTest() {
  console.log('🧪 TENANT ISOLATION SMOKE TEST')
  console.log('==============================\n')

  let orgA: any = null
  let orgB: any = null
  let adminUser: any = null

  try {
    // 1. Obtener usuario admin
    console.log('👤 Paso 1: Obtener usuario admin...')
    adminUser = await prisma.user.findFirst({
      where: { email: 'admin@klowezone.com' }
    })

    if (!adminUser) {
      throw new Error('Usuario admin no encontrado')
    }
    console.log(`   ✅ Usuario admin: ${adminUser.email} (${adminUser.id})`)
    console.log('')

    // 2. Crear organizaciones de prueba
    console.log('🏢 Paso 2: Crear organizaciones de prueba...')

    // Crear OrgA (si no existe)
    orgA = await prisma.organization.findFirst({
      where: { name: 'Test Org A' }
    })

    if (!orgA) {
      orgA = await prisma.organization.create({
        data: {
          name: 'Test Org A',
          slug: 'test-org-a',
          description: 'Organización de prueba A para smoke test'
        }
      })
      console.log(`   ✅ Creada OrgA: ${orgA.name} (${orgA.id})`)
    } else {
      console.log(`   ✅ OrgA ya existe: ${orgA.name} (${orgA.id})`)
    }

    // Crear OrgB (si no existe)
    orgB = await prisma.organization.findFirst({
      where: { name: 'Test Org B' }
    })

    if (!orgB) {
      orgB = await prisma.organization.create({
        data: {
          name: 'Test Org B',
          slug: 'test-org-b',
          description: 'Organización de prueba B para smoke test'
        }
      })
      console.log(`   ✅ Creada OrgB: ${orgB.name} (${orgB.id})`)
    } else {
      console.log(`   ✅ OrgB ya existe: ${orgB.name} (${orgB.id})`)
    }
    console.log('')

    // 3. Agregar usuario admin como miembro de ambas organizaciones
    console.log('👥 Paso 3: Configurar membresías...')

    // Agregar a OrgA como OWNER
    const membershipA = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgA.id,
          userId: adminUser.id
        }
      }
    })

    if (!membershipA) {
      await prisma.organizationMember.create({
        data: {
          organizationId: orgA.id,
          userId: adminUser.id,
          role: 'OWNER'
        }
      })
      console.log(`   ✅ Usuario agregado como OWNER en OrgA`)
    } else {
      console.log(`   ✅ Usuario ya es OWNER en OrgA`)
    }

    // Agregar a OrgB como MEMBER
    const membershipB = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgB.id,
          userId: adminUser.id
        }
      }
    })

    if (!membershipB) {
      await prisma.organizationMember.create({
        data: {
          organizationId: orgB.id,
          userId: adminUser.id,
          role: 'MEMBER'
        }
      })
      console.log(`   ✅ Usuario agregado como MEMBER en OrgB`)
    } else {
      console.log(`   ✅ Usuario ya es MEMBER en OrgB`)
    }
    console.log('')

    // 4. Simular setActiveOrg y crear audit logs
    console.log('📋 Paso 4: Crear audit logs en organizaciones separadas...')

    // Simular OrgA activa y crear audit log "A"
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'SMOKE_TEST',
        resourceId: 'test-a',
        userId: adminUser.id,
        organizationId: orgA.id,
        ipAddress: '127.0.0.1',
        userAgent: 'SmokeTest/1.0'
      }
    })
    console.log(`   ✅ Creado audit log "A" en OrgA`)

    // Simular OrgB activa y crear audit log "B"
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'SMOKE_TEST',
        resourceId: 'test-b',
        userId: adminUser.id,
        organizationId: orgB.id,
        ipAddress: '127.0.0.1',
        userAgent: 'SmokeTest/1.0'
      }
    })
    console.log(`   ✅ Creado audit log "B" en OrgB`)
    console.log('')

    // 5. Verificar aislamiento
    console.log('🔍 Paso 5: Verificar aislamiento de datos...')

    // Obtener logs de OrgA
    const logsA = await prisma.auditLog.findMany({
      where: { organizationId: orgA.id },
      orderBy: { timestamp: 'desc' }
    })

    // Obtener logs de OrgB
    const logsB = await prisma.auditLog.findMany({
      where: { organizationId: orgB.id },
      orderBy: { timestamp: 'desc' }
    })

    console.log(`   📊 OrgA (${orgA.name}): ${logsA.length} audit logs`)
    console.log(`   📊 OrgB (${orgB.name}): ${logsB.length} audit logs`)

    // Verificar que no se mezclen los datos
    const orgALogs = logsA.filter(log => log.resourceId === 'test-a')
    const orgBLogs = logsB.filter(log => log.resourceId === 'test-b')
    const crossContaminationA = logsA.filter(log => log.resourceId === 'test-b')
    const crossContaminationB = logsB.filter(log => log.resourceId === 'test-a')

    console.log(`   ✅ OrgA tiene ${orgALogs.length} logs "test-a"`)
    console.log(`   ✅ OrgB tiene ${orgBLogs.length} logs "test-b"`)
    console.log(`   🔍 Cross-contaminación en OrgA: ${crossContaminationA.length} logs "test-b"`)
    console.log(`   🔍 Cross-contaminación en OrgB: ${crossContaminationB.length} logs "test-a"`)

    // 6. Resultado final
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('==================')

    const isolationOk = orgALogs.length >= 1 && orgBLogs.length >= 1 &&
                       crossContaminationA.length === 0 && crossContaminationB.length === 0

    if (isolationOk) {
      console.log('RESULT: PASS (aislamiento correcto - datos no se mezclan)')
    } else {
      console.log('RESULT: FAIL (aislamiento comprometido - datos se mezclan)')
    }

  } catch (error) {
    console.error('❌ Error en smoke test:', error)
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('==================')
    console.log('RESULT: FAIL (error en ejecución)')
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  smokeTest().catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
}

export { smokeTest }




