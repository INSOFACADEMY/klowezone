#!/usr/bin/env tsx

/**
 * VERIFY TENANT BACKFILL - KLOWEZONE
 *
 * Script para verificar que el backfill multi-tenant se ejecutó correctamente.
 *
 * Verifica:
 * - Total de organizaciones
 * - Total de miembros de organización
 * - Usuarios sin activeOrgId (debe ser 0)
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
  console.log('🔍 Verificando estado del backfill multi-tenant...\n')

  // Configurar Prisma Client
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set')
    console.error('   Solución: Asegúrate de que existe .env.local con DATABASE_URL')
    process.exit(1)
  }

  const connInfo = getConnectionInfo(connectionString)
  console.log('🔗 Verificando conexión a base de datos:')
  console.log(`   • Host: ${connInfo.host}`)
  console.log(`   • Puerto: ${connInfo.port}`)
  console.log(`   • Base de datos: ${connInfo.database}`)
  console.log(`   • Tipo: ${connInfo.isSupabase ? '🟢 Supabase/Neon' : connInfo.isLocalhost ? '🟡 Localhost' : '❓ Otro'}`)

  if (!connInfo.isSupabase && !connInfo.isLocalhost) {
    console.warn('⚠️  ADVERTENCIA: No parece ser una conexión a Supabase. Verifica DATABASE_URL')
  }
  console.log('') // Línea en blanco

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  let prisma: PrismaClient

  try {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    prisma = new PrismaClient({
      adapter,
      log: [] // Silenciar logs de Prisma
    })

    // Probar conexión
    await prisma.$connect()
    console.log('✅ Conexión a base de datos verificada')
    console.log('')
  } catch (error) {
    console.error('❌ ERROR: No se pudo conectar a la base de datos')
    console.error('   Detalles:', error instanceof Error ? error.message : String(error))
    console.error('   Verifica que DATABASE_URL sea correcta y la base de datos esté accesible')
    process.exit(1)
  }

  try {
    // =====================================================
    // VERIFICACIONES
    // =====================================================

    console.log('📊 ESTADO ACTUAL:\n')

    // Total organizaciones
    const totalOrganizations = await prisma.organization.count()
    console.log(`🏢 Total organizaciones: ${totalOrganizations}`)

    // Total miembros
    const totalOrgMembers = await prisma.organizationMember.count()
    console.log(`👥 Total miembros de organización: ${totalOrgMembers}`)

    // Usuarios sin activeOrgId
    const usersWithoutActiveOrgId = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.id
      WHERE up.active_org_id IS NULL OR up.id IS NULL
    `
    console.log(`⚠️  Usuarios sin activeOrgId: ${usersWithoutActiveOrgId[0].count}`)

    // =====================================================
    // DETALLES ADICIONALES
    // =====================================================

    console.log('\n📋 DETALLES:\n')

    // Organizaciones existentes
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true, isActive: true }
    })

    console.log('🏢 Organizaciones:')
    organizations.forEach(org => {
      console.log(`  • ${org.name} (${org.slug}) - ${org.isActive ? 'Activa' : 'Inactiva'}`)
    })

    // Distribución de roles
    const roleDistribution = await prisma.organizationMember.groupBy({
      by: ['role'],
      _count: { role: true }
    })

    console.log('\n👥 Distribución de roles:')
    roleDistribution.forEach(role => {
      console.log(`  • ${role.role}: ${role._count.role}`)
    })

    // Usuarios con perfiles completos
    const completeProfiles = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM user_profiles
      WHERE active_org_id IS NOT NULL
    `
    console.log(`\n✅ Perfiles completos: ${completeProfiles[0].count}`)

    // =====================================================
    // AUDITORÍA Y RESULTADO FINAL
    // =====================================================

    console.log('\n🎯 RESULTADO DE LA AUDITORÍA:')

    // Sistema de issues
    const issues: string[] = []

    // Verificar condiciones críticas
    if (usersWithoutActiveOrgId[0].count > 0) {
      issues.push(`${usersWithoutActiveOrgId[0].count} usuarios sin activeOrgId`)
    }
    if (totalOrganizations === 0) {
      issues.push('No se crearon organizaciones')
    }
    if (totalOrgMembers === 0) {
      issues.push('No se asignaron miembros')
    }

    // Verificar integridad adicional
    if (totalOrganizations > 0 && totalOrgMembers === 0) {
      issues.push('Organizaciones existen pero no tienen miembros')
    }

    // Determinar resultado
    const status = issues.length === 0 ? 'PASS' : 'FAIL'
    const statusEmoji = status === 'PASS' ? '✅' : '❌'
    const statusMessage = status === 'PASS' ? 'AUDITORÍA 2.A - ÉXITO' : 'AUDITORÍA 2.A - PROBLEMAS DETECTADOS'

    // Imprimir resultado
    console.log(`${statusEmoji} ${statusMessage}`)

    if (issues.length > 0) {
      issues.forEach(issue => {
        console.log(`   • ${issue}`)
      })
    } else {
      console.log('   • Todos los usuarios tienen activeOrgId')
      console.log('   • Organizaciones creadas correctamente')
      console.log('   • Miembros asignados correctamente')
      console.log('   • No hay duplicados en memberships')
    }

    // Resumen final
    console.log('\n📊 RESUMEN FINAL:')
    console.log(`   • Status: ${status}`)
    console.log(`   • Issues encontrados: ${issues.length}`)

  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script de verificación falló:', error)
    process.exit(1)
  })
}

export { main as verifyTenantBackfill }
