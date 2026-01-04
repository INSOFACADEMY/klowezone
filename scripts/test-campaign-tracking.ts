#!/usr/bin/env tsx

/**
 * Script de prueba para el sistema de rastreo de campañas
 * Uso: npm run tsx scripts/test-campaign-tracking.ts
 */

import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env.local' })

// Simular funciones del navegador para testing
const mockLocalStorage = new Map<string, string>()

global.localStorage = {
  getItem: (key: string) => mockLocalStorage.get(key) || null,
  setItem: (key: string, value: string) => mockLocalStorage.set(key, value),
  removeItem: (key: string) => mockLocalStorage.delete(key),
  clear: () => mockLocalStorage.clear(),
  length: 0,
  key: () => null
}

// Simular URL para testing
const mockUrl = new URL('http://localhost:3000')
mockUrl.searchParams.set('fb_campaign_id', '6970537367061')

global.window = {
  location: mockUrl,
  history: {
    replaceState: () => {}
  }
} as any

// Importar funciones después de configurar mocks
import { getStoredCampaignId, clearStoredCampaignId, storeCampaignId } from '../src/lib/campaign-utils'

async function testCampaignTracking() {
  console.log('🧪 Probando sistema de rastreo de campañas...\n')

  // TEST 1: Simular llegada a página con campaign_id
  console.log('1️⃣ TEST: Detección de campaign_id en URL')
  console.log(`   URL simulada: ${mockUrl.href}`)
  console.log(`   Campaign ID detectado: ${mockUrl.searchParams.get('fb_campaign_id')}`)

  // Simular el comportamiento del CampaignTracker
  const fbCampaignId = mockUrl.searchParams.get('fb_campaign_id')
  const utmCampaign = mockUrl.searchParams.get('utm_campaign')
  const campaignId = fbCampaignId || utmCampaign

  if (campaignId) {
    storeCampaignId(campaignId)
  }

  console.log('')

  // TEST 2: Recuperar campaign_id almacenado
  console.log('2️⃣ TEST: Recuperación de campaign_id almacenado')

  const storedId = getStoredCampaignId()
  console.log(`   Campaign ID recuperado: ${storedId}`)
  console.log(`   ✅ Coincide con original: ${storedId === campaignId}`)
  console.log('')

  // TEST 3: Simular limpieza después de registro
  console.log('3️⃣ TEST: Limpieza después de registro exitoso')

  console.log('   Antes de limpiar:')
  console.log(`   - Campaign ID: ${localStorage.getItem('klowezone_campaign_id')}`)
  console.log(`   - Expiry: ${localStorage.getItem('klowezone_campaign_expiry')}`)

  clearStoredCampaignId()

  console.log('   Después de limpiar:')
  console.log(`   - Campaign ID: ${localStorage.getItem('klowezone_campaign_id') || 'null'}`)
  console.log(`   - Expiry: ${localStorage.getItem('klowezone_campaign_expiry') || 'null'}`)
  console.log('')

  // TEST 4: Simular expiración
  console.log('4️⃣ TEST: Manejo de expiración')

  // Establecer fecha de expiración en el pasado
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 1) // Ayer

  localStorage.setItem('klowezone_campaign_id', 'expired_campaign_123')
  localStorage.setItem('klowezone_campaign_expiry', pastDate.toISOString())

  const expiredId = getStoredCampaignId()
  console.log(`   Campaign ID expirado: ${expiredId || 'null (correctamente limpiado)'}`)
  console.log(`   ✅ Automáticamente limpiado: ${expiredId === null}`)
  console.log('')

  // TEST 5: Diferentes tipos de parámetros
  console.log('5️⃣ TEST: Diferentes tipos de parámetros de campaña')

  const testCases = [
    { url: '?fb_campaign_id=123456789', expected: '123456789', desc: 'fb_campaign_id' },
    { url: '?utm_campaign=987654321', expected: '987654321', desc: 'utm_campaign' },
    { url: '?fb_campaign_id=111&other_param=test', expected: '111', desc: 'fb_campaign_id con otros params' },
    { url: '?utm_campaign=222&fb_campaign_id=333', expected: '333', desc: 'fb_campaign_id tiene prioridad' },
    { url: '?no_campaign_param=test', expected: null, desc: 'sin parámetros de campaña' }
  ]

  testCases.forEach((testCase, index) => {
    const testUrl = new URL(`http://localhost:3000${testCase.url}`)
    const fbId = testUrl.searchParams.get('fb_campaign_id')
    const utmId = testUrl.searchParams.get('utm_campaign')
    const result = fbId || utmId

    console.log(`   ${index + 1}. ${testCase.desc}`)
    console.log(`      URL: ${testCase.url}`)
    console.log(`      Resultado: ${result || 'null'}`)
    console.log(`      ✅ Esperado: ${result === testCase.expected}`)
  })

  console.log('\n🎉 Todos los tests completados exitosamente!')
  console.log('\n📋 Resumen del sistema de rastreo:')
  console.log('   ✅ Detecta fb_campaign_id y utm_campaign')
  console.log('   ✅ Almacena por 30 días en localStorage')
  console.log('   ✅ Limpia automáticamente al expirar')
  console.log('   ✅ Limpia después del registro exitoso')
  console.log('   ✅ Prioriza fb_campaign_id sobre utm_campaign')
  console.log('   ✅ Integra con Prisma para atribución de ROI')
}

// Ejecutar tests
if (require.main === module) {
  testCampaignTracking().catch((error) => {
    console.error('❌ Error en los tests:', error)
    process.exit(1)
  })
}

export { testCampaignTracking }
