#!/usr/bin/env node

/**
 * Simple test for Neon database connectivity
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  try {
    console.log('🔍 Testing Neon connection...')

    // Import the existing Prisma client from the project
    const { prisma } = await import('./src/lib/prisma.ts')

    // Test basic connectivity
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`
    console.log('✅ Connection successful:', result)

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'roles', 'automation_workflows', 'audit_logs', 'system_config')
      ORDER BY table_name
    `

    console.log('📋 Critical tables found:', tables.map(t => t.table_name))

    // Test basic queries
    const userCount = await prisma.user.count()
    const workflowCount = await prisma.automationWorkflow.count()
    const logCount = await prisma.auditLog.count()

    console.log(`📊 Data counts:
  - Users: ${userCount}
  - Workflows: ${workflowCount}
  - Audit Logs: ${logCount}`)

    await prisma.$disconnect()
    console.log('✅ All tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testConnection()
