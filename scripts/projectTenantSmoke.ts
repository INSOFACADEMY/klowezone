#!/usr/bin/env tsx

/**
 * PROJECT TENANT SMOKE TEST - KLOWEZONE
 *
 * Prueba el aislamiento multi-tenant para proyectos.
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

async function projectTenantSmokeTest() {
  console.log('📁 PROJECT TENANT SMOKE TEST')
  console.log('============================\n')

  let orgA: any = null
  let orgB: any = null
  let adminUser: any = null
  let projectA: any = null
  let projectB: any = null

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
      where: { name: 'Test Project Org A' }
    })

    if (!orgA) {
      orgA = await prisma.organization.create({
        data: {
          name: 'Test Project Org A',
          slug: 'test-project-org-a',
          description: 'Organización de prueba A para proyectos'
        }
      })
      console.log(`   ✅ Creada OrgA: ${orgA.name} (${orgA.id})`)
    } else {
      console.log(`   ✅ OrgA ya existe: ${orgA.name} (${orgA.id})`)
    }

    // Crear OrgB (si no existe)
    orgB = await prisma.organization.findFirst({
      where: { name: 'Test Project Org B' }
    })

    if (!orgB) {
      orgB = await prisma.organization.create({
        data: {
          name: 'Test Project Org B',
          slug: 'test-project-org-b',
          description: 'Organización de prueba B para proyectos'
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

    // 4. Crear proyectos en organizaciones separadas
    console.log('📋 Paso 4: Crear proyectos en organizaciones separadas...')

    // Crear nombres únicos para evitar conflictos
    const timestamp = Date.now()
    const projectNameA = `p-a-${timestamp}`
    const projectNameB = `p-b-${timestamp}`

    // Crear proyecto en OrgA
    projectA = await prisma.project.create({
      data: {
        cliente_id: adminUser.id, // Usar admin como cliente para simplificar
        user_id: adminUser.id,
        nombre_proyecto: projectNameA,
        descripcion: 'Proyecto de prueba A',
        estado: 'PLANIFICACION',
        prioridad: 'MEDIA',
        presupuesto_estimado: 10000,
        precio_venta: 15000,
        organizationId: orgA.id
      }
    })
    console.log(`   ✅ Creado proyecto "${projectNameA}" en OrgA (${projectA.id})`)

    // Crear proyecto en OrgB
    projectB = await prisma.project.create({
      data: {
        cliente_id: adminUser.id, // Usar admin como cliente para simplificar
        user_id: adminUser.id,
        nombre_proyecto: projectNameB,
        descripcion: 'Proyecto de prueba B',
        estado: 'PLANIFICACION',
        prioridad: 'MEDIA',
        presupuesto_estimado: 20000,
        precio_venta: 25000,
        organizationId: orgB.id
      }
    })
    console.log(`   ✅ Creado proyecto "${projectNameB}" en OrgB (${projectB.id})`)
    console.log('')

    // 5. Verificar aislamiento de proyectos
    console.log('🔍 Paso 5: Verificar aislamiento de proyectos...')

    // Obtener proyectos de OrgA
    const projectsA = await prisma.project.findMany({
      where: { organizationId: orgA.id }
    })

    // Obtener proyectos de OrgB
    const projectsB = await prisma.project.findMany({
      where: { organizationId: orgB.id }
    })

    console.log(`   📊 OrgA (${orgA.name}): ${projectsA.length} proyectos`)
    console.log(`   📊 OrgB (${orgB.name}): ${projectsB.length} proyectos`)

    // Verificar que no se mezclen los proyectos
    const orgAProjects = projectsA.filter(p => p.nombre_proyecto === projectNameA)
    const orgBProjects = projectsB.filter(p => p.nombre_proyecto === projectNameB)
    const crossContaminationA = projectsA.filter(p => p.nombre_proyecto === projectNameB)
    const crossContaminationB = projectsB.filter(p => p.nombre_proyecto === projectNameA)

    console.log(`   ✅ OrgA tiene 1 proyecto "${projectNameA}"`)
    console.log(`   ✅ OrgB tiene 1 proyecto "${projectNameB}"`)
    console.log(`   🔍 Cross-contaminación en OrgA: ${crossContaminationA.length} proyectos "${projectNameB}"`)
    console.log(`   🔍 Cross-contaminación en OrgB: ${crossContaminationB.length} proyectos "${projectNameA}"`)

    // 6. Probar acceso cruzado (debería fallar)
    console.log('')
    console.log('🚫 Paso 6: Probar acceso cruzado...')

    // Intentar acceder a proyecto de OrgA desde OrgB (debería fallar)
    const projectAFromOrgB = await prisma.project.findFirst({
      where: {
        id: projectA.id,
        organizationId: orgB.id // Intentando acceder con orgId incorrecto
      }
    })

    if (projectAFromOrgB) {
      console.log(`   ❌ ERROR: Se pudo acceder al proyecto "${projectNameA}" desde OrgB`)
    } else {
      console.log(`   ✅ Correcto: No se pudo acceder al proyecto "${projectNameA}" desde OrgB`)
    }

    // Intentar acceder a proyecto de OrgB desde OrgA (debería fallar)
    const projectBFromOrgA = await prisma.project.findFirst({
      where: {
        id: projectB.id,
        organizationId: orgA.id // Intentando acceder con orgId incorrecto
      }
    })

    if (projectBFromOrgA) {
      console.log(`   ❌ ERROR: Se pudo acceder al proyecto "${projectNameB}" desde OrgA`)
    } else {
      console.log(`   ✅ Correcto: No se pudo acceder al proyecto "${projectNameB}" desde OrgA`)
    }

    // 7. Resultado final
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('===================')

    const isolationOk = orgAProjects.length >= 1 && orgBProjects.length >= 1 &&
                       crossContaminationA.length === 0 && crossContaminationB.length === 0 &&
                       !projectAFromOrgB && !projectBFromOrgA

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
  projectTenantSmokeTest().catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
}

export { projectTenantSmokeTest }
