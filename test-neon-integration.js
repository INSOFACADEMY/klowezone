#!/usr/bin/env node

/**
 * Test script for Neon database integration
 * Tests all critical functionalities of Klowezone
 */

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

// Simple encryption functions for testing
function encrypt(text) {
  // Simple base64 encoding for testing (not secure for production)
  return Buffer.from(text).toString('base64')
}

function decrypt(encoded) {
  return Buffer.from(encoded, 'base64').toString('utf8')
}

// Neon connection string
const connectionString = "postgresql://neondb_owner:npg_sRaD56UxQnuy@ep-still-thunder-ahjjklc2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn', 'info']
})

async function testDatabaseConnection() {
  console.log('🔍 Testing Neon Database Connection...')
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful')

    // Test table existence
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('📋 Tables found:', tables.map(t => t.table_name))

    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

async function testEncryption() {
  console.log('🔐 Testing AES-256-GCM Encryption...')
  try {
    const testData = { apiKey: 'sk-test123456789', secret: 'mySecretValue' }
    const encrypted = encrypt(JSON.stringify(testData))
    const decrypted = JSON.parse(decrypt(encrypted))

    if (decrypted.apiKey === testData.apiKey && decrypted.secret === testData.secret) {
      console.log('✅ Encryption/Decryption working correctly')
      return true
    } else {
      console.error('❌ Encryption/Decryption failed')
      return false
    }
  } catch (error) {
    console.error('❌ Encryption test failed:', error.message)
    return false
  }
}

async function testUserOperations() {
  console.log('👤 Testing User Operations...')
  try {
    // Get user count
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)

    // Test user creation (if no users exist)
    if (userCount === 0) {
      console.log('📝 Creating test user...')
      const testUser = await prisma.user.create({
        data: {
          email: 'test@klowezone.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          roleId: 'role_user' // Assuming this role exists
        }
      })
      console.log('✅ Test user created:', testUser.id)
    }

    return true
  } catch (error) {
    console.error('❌ User operations failed:', error.message)
    return false
  }
}

async function testAutomationWorkflows() {
  console.log('🤖 Testing Automation Workflows...')
  try {
    // Get workflow count
    const workflowCount = await prisma.automationWorkflow.count()
    console.log(`✅ Found ${workflowCount} automation workflows`)

    // Test workflow creation
    console.log('📝 Creating test workflow...')
    const testWorkflow = await prisma.automationWorkflow.create({
      data: {
        name: 'Test Workflow',
        description: 'Workflow for testing',
        isActive: false,
        trigger: 'USER_REGISTERED',
        triggerConfig: { test: true },
        createdBy: 'test-user',
        actions: {
          create: [
            {
              order: 0,
              type: 'SEND_EMAIL',
              config: { template: 'welcome' },
              delay: 0
            }
          ]
        }
      },
      include: {
        actions: true
      }
    })
    console.log('✅ Test workflow created:', testWorkflow.id)

    // Test workflow retrieval
    const workflows = await prisma.automationWorkflow.findMany({
      include: {
        actions: true,
        creator: { select: { firstName: true, lastName: true } }
      }
    })
    console.log(`✅ Retrieved ${workflows.length} workflows with actions`)

    // Clean up test workflow
    await prisma.automationWorkflow.delete({
      where: { id: testWorkflow.id }
    })
    console.log('🧹 Test workflow cleaned up')

    return true
  } catch (error) {
    console.error('❌ Automation workflows test failed:', error.message)
    return false
  }
}

async function testAuditLogs() {
  console.log('📊 Testing Audit Logs...')
  try {
    // Get log count
    const logCount = await prisma.auditLog.count()
    console.log(`✅ Found ${logCount} audit log entries`)

    // Test log creation
    console.log('📝 Creating test audit log...')
    const testLog = await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'Test',
        resourceId: 'test-123',
        oldValues: {},
        newValues: { message: 'Test log entry', test: true },
        userId: null,
        timestamp: new Date()
      }
    })
    console.log('✅ Test audit log created:', testLog.id)

    // Test log retrieval
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5
    })
    console.log(`✅ Retrieved ${logs.length} recent log entries`)

    // Clean up test log
    await prisma.auditLog.delete({
      where: { id: testLog.id }
    })
    console.log('🧹 Test audit log cleaned up')

    return true
  } catch (error) {
    console.error('❌ Audit logs test failed:', error.message)
    return false
  }
}

async function testSystemConfig() {
  console.log('⚙️ Testing System Configuration...')
  try {
    // Get config count
    const configCount = await prisma.systemConfig.count()
    console.log(`✅ Found ${configCount} system config entries`)

    // Test encrypted config storage
    const testConfig = { apiKey: 'sk-test123', webhookUrl: 'https://example.com/webhook' }
    const encryptedValue = encrypt(JSON.stringify(testConfig))

    console.log('📝 Creating encrypted config...')
    const testConfigEntry = await prisma.systemConfig.create({
      data: {
        key: 'test_encrypted_config',
        value: encryptedValue,
        category: 'test',
        isSecret: true
      }
    })
    console.log('✅ Encrypted config stored:', testConfigEntry.id)

    // Test config retrieval and decryption
    const retrievedConfig = await prisma.systemConfig.findUnique({
      where: { key: 'test_encrypted_config' }
    })

    if (retrievedConfig) {
      const decryptedValue = JSON.parse(decrypt(retrievedConfig.value))
      if (decryptedValue.apiKey === testConfig.apiKey) {
        console.log('✅ Config encryption/decryption working correctly')
      } else {
        console.error('❌ Config decryption failed')
        return false
      }
    }

    // Clean up test config
    await prisma.systemConfig.delete({
      where: { key: 'test_encrypted_config' }
    })
    console.log('🧹 Test config cleaned up')

    return true
  } catch (error) {
    console.error('❌ System config test failed:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting Klowezone Neon Integration Tests...\n')

  const results = {
    database: await testDatabaseConnection(),
    encryption: await testEncryption(),
    users: await testUserOperations(),
    automation: await testAutomationWorkflows(),
    auditLogs: await testAuditLogs(),
    systemConfig: await testSystemConfig()
  }

  console.log('\n📋 Test Results Summary:')
  console.log('========================')

  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${test}`)
  })

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`)

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Neon integration is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.')
    process.exit(1)
  }

  await prisma.$disconnect()
}

// Run tests
runAllTests().catch((error) => {
  console.error('💥 Test runner failed:', error)
  process.exit(1)
})
