import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

/**
 * Script para probar el endpoint del reporte semanal
 */
async function testWeeklyReport() {
  console.log('🧪 Probando endpoint del reporte semanal Profit-First...')

  try {
    // Hacer la petición al endpoint (necesita API key válida)
    const API_KEY = process.env.TEST_API_KEY || 'your-test-api-key-here'

    const response = await fetch('http://localhost:3000/api/cron/weekly-growth-report', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    console.log('\n📊 Resultado del Reporte Semanal:')
    console.log('=' .repeat(50))

    if (data.success && data.report) {
      const report = data.report

      console.log(`📅 Semana: ${new Date(report.weekStart).toLocaleDateString()} - ${new Date(report.weekEnd).toLocaleDateString()}`)
      console.log(`💰 Revenue Total: $${report.totalRevenue.toFixed(2)}`)
      console.log(`📈 Gasto Total: $${report.totalSpend.toFixed(2)}`)
      console.log(`🎯 Leads Totales: ${report.totalLeads}`)
      console.log(`📊 ROI General: ${report.overallROI.toFixed(1)}%`)

      if (report.starCampaign) {
        console.log(`\n⭐ CAMPAÑA ESTRELLA:`)
        console.log(`   Nombre: ${report.starCampaign.name}`)
        console.log(`   ROI: ${report.starCampaign.roi.toFixed(1)}%`)
        console.log(`   Revenue: $${report.starCampaign.revenue.toFixed(2)}`)
      }

      if (report.blackHoleCampaign) {
        console.log(`\n🕳️ AGUJERO NEGRO:`)
        console.log(`   Nombre: ${report.blackHoleCampaign.name}`)
        console.log(`   Gasto: $${report.blackHoleCampaign.spend.toFixed(2)}`)
        console.log(`   Revenue: $0.00`)
      }

      console.log(`\n🎯 ANÁLISIS CGO:`)
      console.log(report.cgoAnalysis)

      console.log(`\n🚀 RECOMENDACIONES:`)
      report.recommendations.forEach((rec: string, index: number) => {
        console.log(`   ${index + 1}. ${rec}`)
      })

      console.log(`\n💰 DISTRIBUCIÓN PROFIT-FIRST:`)
      const pf = report.profitFirst
      console.log(`   Revenue Bruto: $${pf.grossRevenue.toFixed(2)}`)
      console.log(`   Profit First (50%): $${pf.profitFirstAllocation.toFixed(2)}`)
      console.log(`   → Compensación Owner (30%): $${pf.ownerComp.toFixed(2)}`)
      console.log(`   → Distribución Utilidades (20%): $${pf.profitDistribution.toFixed(2)}`)
      console.log(`   → Impuestos Owner (30%): $${pf.ownerTax.toFixed(2)}`)
      console.log(`   → Reserva Utilidades (20%): $${pf.profitReserve.toFixed(2)}`)

      console.log(`\n📋 DESGLOSE DE CAMPAÑAS:`)
      report.campaignBreakdown.forEach((campaign: any) => {
        console.log(`   ${campaign.name}: $${campaign.spend.toFixed(2)} gasto, ${campaign.leads} leads, $${campaign.revenue.toFixed(2)} revenue, ${campaign.roi.toFixed(1)}% ROI`)
      })

    } else {
      console.log('❌ Error en la respuesta:', data.error)
    }

    console.log('\n✅ Prueba completada exitosamente!')

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
    console.log('\n💡 Asegúrate de que:')
    console.log('   1. El servidor esté corriendo en http://localhost:3000')
    console.log('   2. Las variables de entorno estén configuradas')
    console.log('   3. La base de datos esté conectada')
  }
}

// Ejecutar la prueba
testWeeklyReport().catch(console.error)







