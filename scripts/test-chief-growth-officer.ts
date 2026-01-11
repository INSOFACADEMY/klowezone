#!/usr/bin/env tsx

/**
 * Script de prueba para el Chief Growth Officer
 * Demuestra cómo el agente analiza métricas y propone campañas
 * Uso: npm run tsx scripts/test-chief-growth-officer.ts
 */

import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env.local' })

// Simulación de funciones (en producción vendrían de los módulos reales)
async function getCampaignROIMetrics() {
  console.log('📊 Analizando métricas de ROI existentes...')

  // Simular datos de campañas anteriores
  return {
    success: true,
    data: {
      totalCampaigns: 3,
      totalInvestment: 1250.00,
      totalRevenue: 3800.00,
      totalLeads: 45,
      overallROI: 204,
      campaigns: [
        {
          campaignId: '123456789',
          name: 'Campaña Verano 2024',
          spend: 500,
          leadsCount: 20,
          revenueGenerated: 1800,
          roi: 260
        },
        {
          campaignId: '987654321',
          name: 'Promoción Enero',
          spend: 400,
          leadsCount: 15,
          revenueGenerated: 1200,
          roi: 200
        },
        {
          campaignId: '555666777',
          name: 'Lead Magnet Tech',
          spend: 350,
          leadsCount: 10,
          revenueGenerated: 800,
          roi: 128
        }
      ]
    }
  }
}

async function generateAdImage(adText: string, campaignType: string) {
  console.log(`🖼️ Generando imagen para campaña tipo ${campaignType}...`)

  const prompts = {
    pain: `Crea una imagen dramática de un empresario estresado rodeado de papeles volando, con un reloj que marca tiempo perdido. Incluye elementos de automatización emergiendo como solución.`,
    aspiration: `Imagen inspiradora de un CEO confiado en oficina premium, con gráficos de crecimiento global y equipos internacionales colaborando.`,
    curiosity: `Imagen disruptiva con gráficos descendentes de costos, flechas rompiendo cadenas y elementos futuristas que sugieren innovación tecnológica.`
  }

  return {
    success: true,
    imageUrl: `https://api.dalle.mock/image/${Date.now()}_${campaignType}`,
    prompt: prompts[campaignType as keyof typeof prompts],
    message: `Imagen generada para variante ${campaignType}`
  }
}

async function demonstrateChiefGrowthOfficer() {
  console.log('👔 === CHIEF GROWTH OFFICER DEMO ===\n')

  // FASE 1: Análisis de métricas existentes
  console.log('🎯 FASE 1: Análisis de Performance Actual\n')

  const metrics = await getCampaignROIMetrics()

  if (metrics.success) {
    const data = metrics.data
    console.log(`📈 MÉTRICAS CONSOLIDADAS:`)
    console.log(`   💰 Inversión Total: $${data.totalInvestment}`)
    console.log(`   💸 Revenue Generado: $${data.totalRevenue}`)
    console.log(`   👥 Leads Totales: ${data.totalLeads}`)
    console.log(`   📊 ROI General: ${data.overallROI}%\n`)

    console.log(`📋 ANÁLISIS POR CAMPAÑA:`)
    data.campaigns.forEach((campaign, index) => {
      console.log(`   ${index + 1}. "${campaign.name}"`)
      console.log(`      💰 Gasto: $${campaign.spend}`)
      console.log(`      👥 Leads: ${campaign.leadsCount}`)
      console.log(`      💸 Revenue: $${campaign.revenueGenerated}`)
      console.log(`      📈 ROI: ${campaign.roi}%`)
      console.log('')
    })

    // Identificar la campaña con mejor performance
    const bestCampaign = data.campaigns.reduce((best, current) =>
      current.roi > best.roi ? current : best
    )

    console.log(`🎯 CONCLUSIÓN: La campaña "${bestCampaign.name}" tiene el mejor ROI (${bestCampaign.roi}%)`)
    console.log(`   Recomendación: Escalar esta estrategia.\n`)
  }

  // FASE 2: Propuesta de nuevas campañas
  console.log('🎯 FASE 2: Generación de Nuevas Campañas\n')

  console.log('🤖 Como Chief Growth Officer, te propongo 3 variantes de campaña:\n')

  const campaignVariants = [
    {
      type: 'pain',
      name: 'VARIANTE A: DOLOR (Problem/Solution)',
      description: 'Enfocada en el tiempo perdido sin automatización',
      adText: '¿Cuántas horas al día pierdes en tareas repetitivas que un sistema inteligente podría automatizar en segundos?',
      cta: 'Recupera tu tiempo, automatiza tu negocio'
    },
    {
      type: 'aspiration',
      name: 'VARIANTE B: DESEO/STATUS (Aspiration)',
      description: 'Enfocada en prestigio y crecimiento exponencial',
      adText: 'Únete a las empresas que lideran la transformación digital global. Klowezone: donde el crecimiento no tiene límites.',
      cta: 'Conviértete en referente internacional'
    },
    {
      type: 'curiosity',
      name: 'VARIANTE C: CURIOSIDAD (Curiosity Gap)',
      description: 'Enfocada en reducción disruptiva de costos',
      adText: '¿Sabías que podrías reducir tu costo por clic en un 70% con estrategias de growth hacking probadas?',
      cta: 'Descubre el secreto del marketing de bajo costo'
    }
  ]

  for (const variant of campaignVariants) {
    console.log(`🎭 ${variant.name}`)
    console.log(`   📝 Descripción: ${variant.description}`)
    console.log(`   💬 Texto: "${variant.adText}"`)
    console.log(`   🎯 CTA: "${variant.cta}"`)

    // Generar imagen para la variante
    const imageResult = await generateAdImage(variant.adText, variant.type)
    if (imageResult.success) {
      console.log(`   🖼️ Imagen generada: ${imageResult.imageUrl}`)
    }

    console.log('')
  }

  // FASE 3: Recomendación final
  console.log('🎯 FASE 3: Recomendación Estratégica\n')

  console.log('📊 ANÁLISIS DATA-DRIVEN:')
  console.log('   - Campañas de "aspiración" han generado 260% ROI (mejor performance)')
  console.log('   - Tu público responde mejor a mensajes de prestigio (45% más conversión)')
  console.log('   - Inversión recomendada: $750 (basado en 200% ROI proyectado)')
  console.log('   - CAC objetivo: $25 por lead cualificado')
  console.log('')

  console.log('🚀 RECOMENDACIÓN FINAL:')
  console.log('   ✅ Elige la VARIANTE B (Deseo/Status) para maximizar ROI')
  console.log('   ✅ Presupuesto inicial: $500')
  console.log('   ✅ Público objetivo: Dueños de negocio 35-55 años')
  console.log('   ✅ Duración: 14 días para testing A/B')
  console.log('')

  console.log('🎉 El Chief Growth Officer está listo para ejecutar esta estrategia.')
  console.log('   Solo di "Crear campaña con Variante B" y la pondremos en marcha automáticamente.')
}

// Ejecutar la demostración
if (require.main === module) {
  demonstrateChiefGrowthOfficer().catch((error) => {
    console.error('❌ Error en la demostración:', error)
    process.exit(1)
  })
}

export { demonstrateChiefGrowthOfficer }












