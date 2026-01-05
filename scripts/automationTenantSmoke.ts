#!/usr/bin/env tsx

/**
 * AUTOMATION TENANT SMOKE TEST - KLOWEZONE
 *
 * Prueba el aislamiento multi-tenant para automatizaciones.
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

async function automationTenantSmokeTest() {
  console.log('🤖 AUTOMATION TENANT SMOKE TEST')
  console.log('===============================\n')

  let orgA: any = null
  let orgB: any = null
  let adminUser: any = null
  let workflowA: any = null
  let workflowB: any = null

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
      where: { name: 'Test Automation Org A' }
    })

    if (!orgA) {
      orgA = await prisma.organization.create({
        data: {
          name: 'Test Automation Org A',
          slug: 'test-automation-org-a',
          description: 'Organización de prueba A para automatizaciones'
        }
      })
      console.log(`   ✅ Creada OrgA: ${orgA.name} (${orgA.id})`)
    } else {
      console.log(`   ✅ OrgA ya existe: ${orgA.name} (${orgA.id})`)
    }

    // Crear OrgB (si no existe)
    orgB = await prisma.organization.findFirst({
      where: { name: 'Test Automation Org B' }
    })

    if (!orgB) {
      orgB = await prisma.organization.create({
        data: {
          name: 'Test Automation Org B',
          slug: 'test-automation-org-b',
          description: 'Organización de prueba B para automatizaciones'
        }
      })
      console.log(`   ✅ Creada OrgB: ${orgB.name} (${orgB.id})`)
    } else {
      console.log(`   ✅ OrgB ya existe: ${orgB.name} (${orgB.id})`)
    }
    console.log('')

    // 3. Configurar membresías
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

    // 4. Simular setActiveOrg y crear workflows
    console.log('📋 Paso 4: Crear workflows en organizaciones separadas...')

    // Crear nombres únicos para evitar conflictos de ejecuciones anteriores
    const timestamp = Date.now()
    const workflowNameA = `wf-a-${timestamp}`
    const workflowNameB = `wf-b-${timestamp}`

    // Crear workflow en OrgA
    workflowA = await prisma.automationWorkflow.create({
      data: {
        name: workflowNameA,
        description: 'Workflow de prueba A',
        isActive: true,
        trigger: 'NEW_LEAD',
        triggerConfig: { conditions: [] },
        organizationId: orgA.id,
        createdBy: adminUser.id,
        actions: {
          create: [
            {
              order: 0,
              type: 'SEND_EMAIL',
              config: { template: 'welcome' },
              delay: 0,
              organizationId: orgA.id
            }
          ]
        }
      },
      include: { actions: true }
    })
    console.log(`   ✅ Creado workflow "${workflowNameA}" en OrgA (${workflowA.id})`)

    // Crear workflow en OrgB
    workflowB = await prisma.automationWorkflow.create({
      data: {
        name: workflowNameB,
        description: 'Workflow de prueba B',
        isActive: true,
        trigger: 'NEW_LEAD',
        triggerConfig: { conditions: [] },
        organizationId: orgB.id,
        createdBy: adminUser.id,
        actions: {
          create: [
            {
              order: 0,
              type: 'SEND_EMAIL',
              config: { template: 'welcome' },
              delay: 0,
              organizationId: orgB.id
            }
          ]
        }
      },
      include: { actions: true }
    })
    console.log(`   ✅ Creado workflow "${workflowNameB}" en OrgB (${workflowB.id})`)
    console.log('')

    // 5. Verificar aislamiento de workflows
    console.log('🔍 Paso 5: Verificar aislamiento de workflows...')

    // Obtener workflows de OrgA
    const workflowsA = await prisma.automationWorkflow.findMany({
      where: { organizationId: orgA.id }
    })

    // Obtener workflows de OrgB
    const workflowsB = await prisma.automationWorkflow.findMany({
      where: { organizationId: orgB.id }
    })

    console.log(`   📊 OrgA (${orgA.name}): ${workflowsA.length} workflows`)
    console.log(`   📊 OrgB (${orgB.name}): ${workflowsB.length} workflows`)

    // Verificar que no se mezclen los workflows
    const orgAWorkflows = workflowsA.filter(w => w.name === workflowNameA)
    const orgBWorkflows = workflowsB.filter(w => w.name === workflowNameB)
    const crossContaminationA = workflowsA.filter(w => w.name === workflowNameB)
    const crossContaminationB = workflowsB.filter(w => w.name === workflowNameA)

    console.log(`   ✅ OrgA tiene ${orgAWorkflows.length} workflow "${workflowNameA}"`)
    console.log(`   ✅ OrgB tiene ${orgBWorkflows.length} workflow "${workflowNameB}"`)
    console.log(`   🔍 Cross-contaminación en OrgA: ${crossContaminationA.length} workflows "${workflowNameB}"`)
    console.log(`   🔍 Cross-contaminación en OrgB: ${crossContaminationB.length} workflows "${workflowNameA}"`)

    // 6. Trigger workflow en OrgA y verificar Run/Job
    console.log('')
    console.log('⚡ Paso 6: Trigger workflow en OrgA y verificar Run/Job...')

    // Crear un run manualmente para OrgA
    const runA = await prisma.automationRun.create({
      data: {
        workflowId: workflowA.id,
        triggerData: { test: 'data' },
        organizationId: orgA.id
      }
    })
    console.log(`   ✅ Creado AutomationRun en OrgA (${runA.id})`)

    // Crear job para el run
    const jobA = await prisma.jobQueue.create({
      data: {
        runId: runA.id,
        actionId: workflowA.actions[0].id,
        payload: { test: 'payload' },
        organizationId: orgA.id
      }
    })
    console.log(`   ✅ Creado JobQueue en OrgA (${jobA.id})`)

    // Verificar que Run y Job están en OrgA
    const runsA = await prisma.automationRun.findMany({
      where: { organizationId: orgA.id }
    })

    const jobsA = await prisma.jobQueue.findMany({
      where: { organizationId: orgA.id }
    })

    const runsB = await prisma.automationRun.findMany({
      where: { organizationId: orgB.id }
    })

    const jobsB = await prisma.jobQueue.findMany({
      where: { organizationId: orgB.id }
    })

    console.log(`   📊 OrgA - Runs: ${runsA.length}, Jobs: ${jobsA.length}`)
    console.log(`   📊 OrgB - Runs: ${runsB.length}, Jobs: ${jobsB.length}`)

    // 7. Resultado final
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('===================')

    const isolationOk = orgAWorkflows.length >= 1 && orgBWorkflows.length >= 1 &&
                       crossContaminationA.length === 0 && crossContaminationB.length === 0 &&
                       runsA.length >= 1 && jobsA.length >= 1 &&
                       runsB.length === 0 && jobsB.length === 0

    if (isolationOk) {
      console.log('RESULT: PASS (aislamiento correcto - datos no se mezclan)')
    } else {
      console.log('RESULT: FAIL (aislamiento comprometido - datos se mezclan)')
    }

  } catch (error) {
    console.error('❌ Error en smoke test:', error)
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('===================')
    console.log('RESULT: FAIL (error en ejecución)')
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  automationTenantSmokeTest().catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
}

export { automationTenantSmokeTest }
