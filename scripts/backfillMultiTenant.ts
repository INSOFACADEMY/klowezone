#!/usr/bin/env tsx

/**
 * BACKFILL MULTI-TENANT - KLOWEZONE
 *
 * Script idempotente para activar multi-tenant en datos existentes.
 *
 * Funciones:
 * - Crear Organization Default si no existe
 * - Insertar OrganizationMember para todos los usuarios
 * - Setear activeOrgId en user_profiles para usuarios sin organización
 *
 * Idempotente: Puede ejecutarse múltiples veces sin crear duplicados
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load environment variables
config({ path: '.env.local' })

// Función helper para extraer info segura de conexión
function getConnectionInfo(connectionString: string) {
  try {
    const url = new URL(connectionString)
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1), // Remove leading slash
      isSupabase: url.hostname.includes('supabase') || url.hostname.includes('neon'),
      isLocalhost: url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    }
  } catch (error) {
    return { host: 'unknown', port: 'unknown', database: 'unknown', isSupabase: false, isLocalhost: false }
  }
}

async function main() {
  console.log('🚀 Iniciando backfill multi-tenant...\n')

  // Verificar variables de entorno
  console.log('📋 Verificando configuración...')
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set')
    console.error('   Solución: Asegúrate de que existe .env.local con DATABASE_URL')
    process.exit(1)
  }

  const connInfo = getConnectionInfo(connectionString)
  console.log('🔗 Conexión a base de datos:')
  console.log(`   • Host: ${connInfo.host}`)
  console.log(`   • Puerto: ${connInfo.port}`)
  console.log(`   • Base de datos: ${connInfo.database}`)
  console.log(`   • Tipo: ${connInfo.isSupabase ? '🟢 Supabase/Neon' : connInfo.isLocalhost ? '🟡 Localhost' : '❓ Otro'}`)

  if (!connInfo.isSupabase && !connInfo.isLocalhost) {
    console.warn('⚠️  ADVERTENCIA: No parece ser una conexión a Supabase. Verifica DATABASE_URL')
  }

  // Configurar Prisma Client
  console.log('🔧 Configurando conexión a base de datos...')
  let pool: Pool
  let prisma: PrismaClient

  try {
    pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    prisma = new PrismaClient({
      adapter,
      log: [] // Silenciar logs de Prisma para nuestro output
    })

    // Probar conexión
    await prisma.$connect()
    console.log('✅ Conexión a base de datos establecida correctamente')
  } catch (error) {
    console.error('❌ ERROR: No se pudo conectar a la base de datos')
    console.error('   Detalles:', error instanceof Error ? error.message : String(error))
    console.error('   Verifica que DATABASE_URL sea correcta y la base de datos esté accesible')
    process.exit(1)
  }

  let createdOrg = 0
  let addedMembers = 0
  let updatedUsers = 0

  try {
    // =====================================================
    // 1. CREAR ORGANIZATION DEFAULT
    // =====================================================

    console.log('📋 Paso 1: Verificando/creando organización default...')

    let defaultOrg = await prisma.organization.findUnique({
      where: { slug: 'default' }
    })

    if (!defaultOrg) {
      console.log('  ➕ Creando organización default...')

      defaultOrg = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          description: 'Organización por defecto creada automáticamente',
          isActive: true
        }
      })

      createdOrg++
      console.log(`  ✅ Organización default creada: ${defaultOrg.id}`)
    } else {
      console.log(`  ✅ Organización default ya existe: ${defaultOrg.id}`)
    }

    // =====================================================
    // 2. OBTENER TODOS LOS USUARIOS
    // =====================================================

    console.log('\n📋 Paso 2: Obteniendo usuarios existentes...')

    // Obtener todos los usuarios que tienen perfil
    const usersWithProfiles = await prisma.user.findMany({
      include: {
        organizationMemberships: true
      }
    })

    console.log(`  👥 Encontrados ${usersWithProfiles.length} usuarios con perfiles`)

    // =====================================================
    // 3. CREAR MEMBERSHIPS PARA USUARIOS SIN ORGANIZACIÓN
    // =====================================================

    console.log('\n📋 Paso 3: Creando memberships de organización...')

    for (const user of usersWithProfiles) {
      // Verificar si el usuario ya tiene membership en la org default
      const existingMembership = user.organizationMemberships.find(
        m => m.organizationId === defaultOrg!.id
      )

      if (!existingMembership) {
        // Determinar el rol: OWNER para el primer usuario, MEMBER para los demás
        const role = user.organizationMemberships.length === 0 ? 'OWNER' : 'MEMBER'

        console.log(`  ➕ Agregando ${user.email} como ${role} a organización default...`)

        await prisma.organizationMember.create({
          data: {
            organizationId: defaultOrg!.id,
            userId: user.id,
            role: role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
          }
        })

        addedMembers++
      } else {
        console.log(`  ⏭️  ${user.email} ya tiene membership en organización default`)
      }
    }

    // =====================================================
    // 4. ACTUALIZAR ACTIVEORGID EN USER_PROFILES
    // =====================================================

    console.log('\n📋 Paso 4: Actualizando activeOrgId en perfiles de usuario...')

    // Primero, verificar si la tabla user_profiles existe y tiene la columna active_org_id
    // Esta es una tabla Supabase, no Prisma, así que usaremos SQL directo

    // Obtener usuarios sin activeOrgId en user_profiles
    console.log('  🔍 Buscando usuarios sin activeOrgId...')
    const usersWithoutActiveOrg = await prisma.$queryRaw<Array<{ id: string; email: string }>>`
      SELECT u.id, u.email
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.id
      WHERE up.active_org_id IS NULL OR up.id IS NULL
    `
    console.log(`  📊 Encontrados ${usersWithoutActiveOrg.length} usuarios sin activeOrgId`)

    console.log(`  👤 Encontrados ${usersWithoutActiveOrg.length} usuarios sin activeOrgId`)

    for (const user of usersWithoutActiveOrg) {
      console.log(`  ✏️  Actualizando activeOrgId para ${user.email}...`)

      try {
        // Usar SQL directo para actualizar user_profiles
        await prisma.$executeRaw`
          INSERT INTO user_profiles (id, active_org_id, business_type, business_name, location, currency, team_size, primary_goals, onboarding_completed, created_at, updated_at)
          VALUES (${user.id}, ${defaultOrg!.id}, 'Desarrollo de Software', 'Empresa', 'México', 'MXN', 'Solo yo', ARRAY['Gestión de Proyectos'], false, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            active_org_id = EXCLUDED.active_org_id,
            updated_at = NOW()
        `
        updatedUsers++
        console.log(`  ✅ Actualizado ${user.email}`)
      } catch (error) {
        console.log(`  ❌ Error actualizando ${user.email}:`, error)
      }
    }

    // =====================================================
    // 5. VERIFICACIÓN FINAL
    // =====================================================

    console.log('\n📋 Paso 5: Verificación final...')

    const finalOrgCount = await prisma.organization.count()
    const finalMemberCount = await prisma.organizationMember.count()

    const usersWithoutOrgFinal = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.id
      WHERE up.active_org_id IS NULL OR up.id IS NULL
    `

    console.log(`  📊 Organizaciones totales: ${finalOrgCount}`)
    console.log(`  👥 Miembros totales: ${finalMemberCount}`)
    console.log(`  ⚠️  Usuarios sin activeOrgId: ${usersWithoutOrgFinal[0].count}`)

    // =====================================================
    // 6. LOGS FINALES
    // =====================================================

    // Determinar estado final basado en las 3 condiciones críticas
    const isComplete = finalOrgCount >= 1 && finalMemberCount >= 1 && Number(usersWithoutOrgFinal[0].count) === 0
    console.log(`  🔍 Debug - isComplete: ${isComplete}`)
    const finalStatus = isComplete ? '✅ SUCCESS' : '⚠️  INCOMPLETE'

    console.log('\n🎉 BACKFILL COMPLETADO')
    console.log('📊 Resumen:')
    console.log(`  • Organizaciones creadas: ${createdOrg}`)
    console.log(`  • Miembros agregados: ${addedMembers}`)
    console.log(`  • Usuarios actualizados: ${updatedUsers}`)
    console.log(`  • Estado final: ${finalStatus}`)

    if (!isComplete) {
      console.log('\n❌ Condiciones faltantes:')
      if (finalOrgCount < 1) console.log('  • No hay organizaciones creadas')
      if (finalMemberCount < 1) console.log('  • No hay miembros asignados')
      if (usersWithoutOrgFinal[0].count > 0) console.log(`  • ${usersWithoutOrgFinal[0].count} usuarios sin activeOrgId`)
    }

  } catch (error) {
    console.error('❌ Error durante el backfill:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script falló:', error)
    process.exit(1)
  })
}

export { main as backfillMultiTenant }
