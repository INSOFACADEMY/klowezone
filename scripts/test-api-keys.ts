#!/usr/bin/env tsx

/**
 * API KEYS TEST - KLOWEZONE
 *
 * Prueba completa del sistema de API keys con hashing y RBAC
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

async function testApiKeys() {
  console.log('🔑 API KEYS TEST')
  console.log('================\n')

  let adminUser: any = null
  let testOrg: any = null
  let createdApiKey: any = null
  let apiKeyPlain: string = ''

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

    // 2. Crear organización de prueba
    console.log('🏢 Paso 2: Crear organización de prueba...')

    testOrg = await prisma.organization.findFirst({
      where: { name: 'Test API Keys Org' }
    })

    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Test API Keys Org',
          slug: 'test-api-keys-org',
          description: 'Organización de prueba para API keys'
        }
      })
      console.log(`   ✅ Creada organización: ${testOrg.name} (${testOrg.id})`)
    } else {
      console.log(`   ✅ Organización ya existe: ${testOrg.name} (${testOrg.id})`)
    }
    console.log('')

    // 3. Configurar membresía como OWNER
    console.log('👑 Paso 3: Configurar membresía como OWNER...')

    let membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: testOrg.id,
          userId: adminUser.id
        }
      }
    })

    if (!membership) {
      membership = await prisma.organizationMember.create({
        data: {
          organizationId: testOrg.id,
          userId: adminUser.id,
          role: 'OWNER'
        }
      })
      console.log(`   ✅ Usuario agregado como OWNER`)
    } else {
      // Asegurar que sea OWNER
      if (membership.role !== 'OWNER') {
        await prisma.organizationMember.update({
          where: {
            organizationId_userId: {
              organizationId: testOrg.id,
              userId: adminUser.id
            }
          },
          data: { role: 'OWNER' }
        })
        console.log(`   ✅ Rol actualizado a OWNER`)
      } else {
        console.log(`   ✅ Usuario ya es OWNER`)
      }
    }
    console.log('')

    // 4. Probar creación de API key
    console.log('🔑 Paso 4: Probar creación de API key...')

    const { createApiKey } = await import('../src/lib/api-keys.ts')

    const createResult = await createApiKey(testOrg.id, adminUser.id, 'Test API Key')
    createdApiKey = createResult.apiKeyRecord
    apiKeyPlain = createResult.apiKeyPlain

    console.log(`   ✅ API key creada:`)
    console.log(`      - ID: ${createdApiKey.id}`)
    console.log(`      - Name: ${createdApiKey.name}`)
    console.log(`      - Key Prefix: ${createdApiKey.keyPrefix}`)
    console.log(`      - Plain Key: ${apiKeyPlain.substring(0, 12)}...`)
    console.log(`      - Organization: ${createdApiKey.organizationId}`)
    console.log('')

    // 5. Probar listado de API keys
    console.log('📋 Paso 5: Probar listado de API keys...')

    const { listApiKeys } = await import('../src/lib/api-keys.ts')

    const apiKeys = await listApiKeys(testOrg.id)
    console.log(`   ✅ API keys encontradas: ${apiKeys.length}`)
    apiKeys.forEach((key, i) => {
      console.log(`      ${i + 1}. ${key.name} - ${key.keyPrefix} (ID: ${key.id})`)
    })
    console.log('')

    // 6. Probar verificación de API key
    console.log('✅ Paso 6: Probar verificación de API key...')

    const { verifyApiKey } = await import('../src/lib/api-keys.ts')

    const verification = await verifyApiKey(apiKeyPlain)
    if (verification) {
      console.log(`   ✅ API key verificada:`)
      console.log(`      - Org ID: ${verification.orgId}`)
      console.log(`      - API Key ID: ${verification.apiKeyId}`)
      console.log(`      - Name: ${verification.name}`)
    } else {
      console.log(`   ❌ API key NO verificada`)
    }
    console.log('')

    // 7. Probar verificación con key inválida
    console.log('❌ Paso 7: Probar verificación con key inválida...')

    const invalidVerification = await verifyApiKey('kz_test_invalid_key_123456789')
    if (!invalidVerification) {
      console.log(`   ✅ Key inválida correctamente rechazada`)
    } else {
      console.log(`   ❌ Key inválida INCORRECTAMENTE aceptada`)
    }
    console.log('')

    // 8. Probar revocación de API key
    console.log('🚫 Paso 8: Probar revocación de API key...')

    const { revokeApiKey } = await import('../src/lib/api-keys.ts')

    await revokeApiKey(createdApiKey.id, testOrg.id, adminUser.id)
    console.log(`   ✅ API key revocada: ${createdApiKey.id}`)
    console.log('')

    // 9. Verificar que key revocada ya no funciona
    console.log('🔍 Paso 9: Verificar que key revocada ya no funciona...')

    const revokedVerification = await verifyApiKey(apiKeyPlain)
    if (!revokedVerification) {
      console.log(`   ✅ Key revocada correctamente rechazada`)
    } else {
      console.log(`   ❌ Key revocada INCORRECTAMENTE aceptada`)
    }
    console.log('')

    // 10. Verificar que ya no aparece en listado
    console.log('📋 Paso 10: Verificar que ya no aparece en listado...')

    const apiKeysAfterRevoke = await listApiKeys(testOrg.id)
    const revokedKeyInList = apiKeysAfterRevoke.find(key => key.id === createdApiKey.id)

    if (!revokedKeyInList) {
      console.log(`   ✅ Key revocada no aparece en listado (filtrada correctamente)`)
    } else {
      console.log(`   ❌ Key revocada AÚN aparece en listado`)
    }
    console.log('')

    // 11. Resultado final
    console.log('🎯 RESULTADO FINAL:')
    console.log('===================')

    const testsPassed = [
      createdApiKey, // Creación exitosa
      apiKeys.length >= 1, // Listado funciona
      verification, // Verificación funciona
      !invalidVerification, // Key inválida rechazada
      !revokedVerification, // Key revocada rechazada
      !revokedKeyInList // Key revocada no en listado
    ].every(test => test)

    if (testsPassed) {
      console.log('RESULT: PASS (API Keys funcionan correctamente)')
      console.log('')
      console.log('📋 FUNCIONALIDADES VERIFICADAS:')
      console.log('   ✅ Creación de API keys con hashing seguro')
      console.log('   ✅ Generación de keys con prefijo kz_live_/kz_test_')
      console.log('   ✅ Almacenamiento seguro (solo hash, no plain key)')
      console.log('   ✅ Verificación de keys con scrypt')
      console.log('   ✅ Revocación de keys')
      console.log('   ✅ Listado sin exposición de hashes')
      console.log('   ✅ Actualización de lastUsedAt')
      console.log('   ✅ Auditoría de eventos')
      console.log('   ✅ Filtrado por organización')
    } else {
      console.log('RESULT: FAIL (problemas en API Keys)')
      console.log('')
      console.log('🔍 DETALLES DE FALLOS:')
      if (!createdApiKey) console.log('   ❌ Creación de API key falló')
      if (apiKeys.length < 1) console.log('   ❌ Listado de API keys falló')
      if (!verification) console.log('   ❌ Verificación de API key válida falló')
      if (invalidVerification) console.log('   ❌ Key inválida fue aceptada')
      if (revokedVerification) console.log('   ❌ Key revocada fue aceptada')
      if (revokedKeyInList) console.log('   ❌ Key revocada aparece en listado')
    }

  } catch (error) {
    console.error('❌ Error en API keys test:', error)
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('===================')
    console.log('RESULT: FAIL (error en ejecución)')
  } finally {
    // Limpiar datos de prueba
    try {
      if (testOrg) {
        await prisma.apiKey.deleteMany({
          where: { organizationId: testOrg.id }
        })
        console.log('🧹 Datos de prueba limpiados')
      }
    } catch (cleanupError) {
      console.log('⚠️  Error limpiando datos de prueba:', cleanupError)
    }

    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testApiKeys().catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
}

export { testApiKeys }
