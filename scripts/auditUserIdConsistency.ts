#!/usr/bin/env tsx

/**
 * AUDIT USER ID CONSISTENCY - KLOWEZONE
 *
 * Script para auditar consistencia de formatos de userId en el sistema.
 *
 * Verifica formatos en:
 * - Prisma User model
 * - user_profiles table
 * - organization_members table
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

// Función para detectar formato de ID
function detectIdFormat(id: string): 'uuid' | 'cuid' | 'unknown' {
  // UUID v4 pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  // CUID pattern (empieza con 'c' seguido de números/letras)
  const cuidRegex = /^c[a-z0-9]+$/i

  if (uuidRegex.test(id)) {
    return 'uuid'
  } else if (cuidRegex.test(id)) {
    return 'cuid'
  } else {
    return 'unknown'
  }
}

async function auditUserIdConsistency() {
  console.log('🔍 AUDITORÍA DE CONSISTENCIA DE USER ID FORMATS')
  console.log('===============================================\n')

  const formats: { [key: string]: string[] } = {
    prisma_user: [],
    user_profiles: [],
    organization_members: []
  }

  // 1. Prisma User sample
  console.log('📋 1. Prisma User sample:')
  try {
    const userSample = await prisma.user.findFirst({
      select: { id: true, email: true }
    })

    if (userSample) {
      const format = detectIdFormat(userSample.id)
      formats.prisma_user.push(format)
      console.log(`   User ID: ${userSample.id}`)
      console.log(`   Email: ${userSample.email}`)
      console.log(`   Format: ${format.toUpperCase()}`)
    } else {
      console.log('   ❌ No users found')
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`)
  }

  console.log('')

  // 2. user_profiles sample vía SQL
  console.log('📋 2. user_profiles sample vía SQL:')
  try {
    const profileSample = await prisma.$queryRaw<Array<{ id: string; active_org_id: string | null }>>`
      SELECT id::text as id, active_org_id FROM user_profiles LIMIT 1;
    `

    if (profileSample && profileSample.length > 0) {
      const format = detectIdFormat(profileSample[0].id)
      formats.user_profiles.push(format)
      console.log(`   Profile ID: ${profileSample[0].id}`)
      console.log(`   Active Org ID: ${profileSample[0].active_org_id || 'null'}`)
      console.log(`   Format: ${format.toUpperCase()}`)
    } else {
      console.log('   ❌ No profiles found')
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`)
  }

  console.log('')

  // 3. organization_members sample
  console.log('📋 3. organization_members sample:')
  try {
    const memberSample = await prisma.organizationMember.findFirst({
      select: { userId: true, organizationId: true }
    })

    if (memberSample) {
      const userFormat = detectIdFormat(memberSample.userId)
      const orgFormat = detectIdFormat(memberSample.organizationId)
      formats.organization_members.push(userFormat, orgFormat)
      console.log(`   User ID: ${memberSample.userId} (Format: ${userFormat.toUpperCase()})`)
      console.log(`   Organization ID: ${memberSample.organizationId} (Format: ${orgFormat.toUpperCase()})`)
    } else {
      console.log('   ❌ No members found')
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`)
  }

  console.log('')
  console.log('📊 RESUMEN DE FORMATOS:')
  console.log('=======================')

  const allFormats = [
    ...formats.prisma_user,
    ...formats.user_profiles,
    ...formats.organization_members
  ].filter(format => format !== 'unknown')

  const uniqueFormats = [...new Set(allFormats)]
  const formatCounts = uniqueFormats.map(format =>
    `${format.toUpperCase()}: ${allFormats.filter(f => f === format).length}`
  ).join(', ')

  console.log(`Formatos encontrados: ${formatCounts}`)

  // Conclusión FINAL
  console.log('')
  console.log('🎯 CONCLUSIÓN FINAL:')
  console.log('==================')

  if (uniqueFormats.length === 1) {
    console.log('RESULT: MATCH (todos usan el mismo formato)')
  } else if (uniqueFormats.length > 1) {
    console.log('RESULT: MISMATCH (mezcla de formatos)')
  } else {
    console.log('RESULT: UNKNOWN (no se pudieron detectar formatos)')
  }

  await prisma.$disconnect()
}

// Ejecutar si se llama directamente
if (require.main === module) {
  auditUserIdConsistency().catch((error) => {
    console.error('❌ Error en auditoría:', error)
    process.exit(1)
  })
}

export { auditUserIdConsistency }
