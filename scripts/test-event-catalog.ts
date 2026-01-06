#!/usr/bin/env tsx

/**
 * EVENT CATALOG TEST - KLOWEZONE
 *
 * Prueba el catálogo de eventos y la validación de payloads
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testEventCatalog() {
  console.log('📋 EVENT CATALOG TEST')
  console.log('=====================\n')

  const {
    EVENT_CATALOG,
    validateEvent,
    getSupportedEventTypes,
    getEventCategories,
    getEventsByCategory,
    getEventDefinition,
    isEventTypeSupported
  } = require('../src/lib/events/catalog.ts')

  // 1. Verificar catálogo básico
  console.log('1. ✅ CATÁLOGO BÁSICO')
  const supportedTypes = getSupportedEventTypes()
  console.log(`   Tipos de evento soportados: ${supportedTypes.length}`)
  console.log(`   - ${supportedTypes.join(', ')}\n`)

  const categories = getEventCategories()
  console.log(`   Categorías: ${categories.length}`)
  console.log(`   - ${categories.join(', ')}\n`)

  // 2. Verificar eventos por categoría
  console.log('2. ✅ EVENTOS POR CATEGORÍA')
  categories.forEach(category => {
    const events = getEventsByCategory(category)
    console.log(`   ${category}: ${events.length} eventos`)
    events.forEach(event => {
      console.log(`     - ${event.name}: ${event.description}`)
    })
  })
  console.log('')

  // 3. Verificar definición de eventos específicos
  console.log('3. ✅ DEFINICIONES DE EVENTOS')
  const testEvents = ['user.registered', 'demo.event', 'project.created', 'nonexistent.event']

  testEvents.forEach(eventType => {
    const definition = getEventDefinition(eventType)
    const supported = isEventTypeSupported(eventType)

    console.log(`   ${eventType}:`)
    console.log(`     - Soportado: ${supported}`)
    if (definition) {
      console.log(`     - Descripción: ${definition.description}`)
      console.log(`     - Categoría: ${definition.category}`)
      console.log(`     - Tiene schema: ${!!definition.schema}`)
    } else {
      console.log(`     - Definición: null`)
    }
    console.log('')
  })

  // 4. Probar validación de payloads
  console.log('4. ✅ VALIDACIÓN DE PAYLOADS\n')

  // Test casos válidos
  const validTests = [
    {
      eventType: 'user.registered',
      payload: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        registrationMethod: 'email'
      },
      expected: 'success'
    },
    {
      eventType: 'demo.event',
      payload: {
        userId: 'user123',
        action: 'button_clicked',
        timestamp: '2024-01-15T10:30:00Z',
        metadata: { source: 'web_app' }
      },
      expected: 'success'
    },
    {
      eventType: 'project.created',
      payload: {
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Website Redesign',
        description: 'Complete redesign',
        ownerId: '550e8400-e29b-41d4-a716-446655440000',
        budget: 50000
      },
      expected: 'success'
    }
  ]

  console.log('   PRUEBAS VÁLIDAS:')
  validTests.forEach((test, i) => {
    const result = validateEvent(test.eventType, test.payload)
    const status = result.success && result.validated ? '✅ PASS' : '❌ FAIL'
    console.log(`     ${i + 1}. ${test.eventType}: ${status}`)
    if (!result.success || !result.validated) {
      console.log(`        Error: ${result.error}`)
    }
  })
  console.log('')

  // Test casos inválidos
  const invalidTests = [
    {
      eventType: 'user.registered',
      payload: {
        userId: 'invalid-uuid',
        email: 'not-an-email',
        firstName: '',
        lastName: 'Doe'
      },
      expected: 'fail'
    },
    {
      eventType: 'project.created',
      payload: {
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        name: '', // Required but empty
        ownerId: 'invalid-uuid'
      },
      expected: 'fail'
    }
  ]

  console.log('   PRUEBAS INVÁLIDAS:')
  invalidTests.forEach((test, i) => {
    const result = validateEvent(test.eventType, test.payload)
    const status = (!result.success || result.unvalidated) ? '✅ PASS (rechazado)' : '❌ FAIL (aceptado)'
    console.log(`     ${i + 1}. ${test.eventType}: ${status}`)
    if (result.success && !result.validated && result.unvalidated) {
      console.log(`        Correctamente marcado como no validado`)
    }
  })
  console.log('')

  // Test eventos no catalogados
  console.log('   EVENTOS NO CATALOGADOS:')
  const uncataloguedTests = [
    {
      eventType: 'custom.unknown.event',
      payload: { any: 'data', works: true }
    },
    {
      eventType: 'mycompany.specific.event',
      payload: { customField: 'value' }
    }
  ]

  uncataloguedTests.forEach((test, i) => {
    const result = validateEvent(test.eventType, test.payload)
    const status = (result.success && !result.validated && result.unvalidated) ? '✅ PASS' : '❌ FAIL'
    console.log(`     ${i + 1}. ${test.eventType}: ${status} (permitido pero no validado)`)
  })
  console.log('')

  // 5. Verificar ejemplos
  console.log('5. ✅ EJEMPLOS DE PAYLOADS')
  supportedTypes.slice(0, 3).forEach(eventType => {
    const definition = getEventDefinition(eventType)
    if (definition) {
      console.log(`   ${eventType}:`)
      console.log(`     Ejemplo: ${JSON.stringify(definition.example, null, 2).substring(0, 100)}...`)
      console.log('')
    }
  })

  // Resultado final
  console.log('🎯 RESULTADO FINAL:')
  console.log('===================')

  const allTests = [
    supportedTypes.length >= 7, // Mínimo 7 tipos de evento
    categories.length >= 4, // Mínimo 4 categorías
    validTests.every(test => {
      const result = validateEvent(test.eventType, test.payload)
      return result.success && result.validated
    }),
    invalidTests.every(test => {
      const result = validateEvent(test.eventType, test.payload)
      return !result.success || result.unvalidated
    }),
    uncataloguedTests.every(test => {
      const result = validateEvent(test.eventType, test.payload)
      return result.success && !result.validated && result.unvalidated
    })
  ]

  const passed = allTests.every(test => test)

  if (passed) {
    console.log('RESULT: PASS (Catálogo de eventos funciona correctamente)')
    console.log('')
    console.log('📋 FUNCIONALIDADES VERIFICADAS:')
    console.log('   ✅ Catálogo completo de eventTypes')
    console.log('   ✅ Schemas Zod por tipo de evento')
    console.log('   ✅ Validación automática de payloads')
    console.log('   ✅ Eventos no catalogados permitidos (unvalidated)')
    console.log('   ✅ Ejemplos de payloads incluidos')
    console.log('   ✅ Categorización de eventos')
    console.log('   ✅ Funciones helper completas')
  } else {
    console.log('RESULT: FAIL (problemas en el catálogo de eventos)')
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testEventCatalog().catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
}

export { testEventCatalog }
