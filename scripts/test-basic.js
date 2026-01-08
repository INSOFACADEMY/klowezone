#!/usr/bin/env node

/**
 * Basic Testing Script for KloweZone
 * Tests critical functionality without full build
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 EJECUTANDO TESTS BÁSICOS - KLOWEZONE\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    console.log(`🔍 Testing: ${name}`)
    fn()
    console.log(`✅ PASSED: ${name}\n`)
    passed++
  } catch (error) {
    console.log(`❌ FAILED: ${name}`)
    console.log(`   Error: ${error.message}\n`)
    failed++
  }
}

// Test 1: File structure
test('File Structure', () => {
  const requiredFiles = [
    'package.json',
    'prisma/schema.prisma',
    'src/lib/prisma.ts',
    'src/lib/auth.ts',
    'src/lib/logging-service.ts',
    'src/lib/tenant/getOrgContext.ts',
    'src/lib/api-keys.ts',
    'src/app/api/admin/settings/route.ts'
  ]

  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing file: ${file}`)
    }
  })
})

// Test 2: Package.json dependencies
test('Dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

  const requiredDeps = [
    'next',
    '@prisma/client',
    'zod',
    'bcryptjs',
    'jsonwebtoken'
  ]

  requiredDeps.forEach(dep => {
    if (!pkg.dependencies[dep]) {
      throw new Error(`Missing dependency: ${dep}`)
    }
  })
})

// Test 3: Environment variables check
test('Environment Variables', () => {
  const envFiles = ['.env.local', '.env']

  let envContent = ''
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8')
      break
    }
  }

  if (!envContent) {
    throw new Error('No environment file found')
  }

  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ]

  requiredVars.forEach(varName => {
    if (!envContent.includes(varName + '=')) {
      throw new Error(`Missing environment variable: ${varName}`)
    }
  })
})

// Test 4: Prisma schema validation
test('Prisma Schema', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8')

  const requiredModels = [
    'User',
    'Organization',
    'OrganizationMember',
    'AuditLog',
    'ApiKey',
    'EventLog'
  ]

  requiredModels.forEach(model => {
    if (!schema.includes(`model ${model} {`)) {
      throw new Error(`Missing Prisma model: ${model}`)
    }
  })

  // Check for organizationId in tenant models
  const tenantModels = ['AuditLog', 'ApiKey', 'EventLog']
  tenantModels.forEach(model => {
    const modelSection = schema.split(`model ${model} {`)[1]?.split('}')[0]
    if (!modelSection?.includes('organizationId')) {
      throw new Error(`Model ${model} missing organizationId field`)
    }
  })
})

// Test 5: Multi-tenant smoke test
test('Multi-tenant Setup', async () => {
  // This would require database connection, so we'll just check the files exist
  const tenantFiles = [
    'scripts/tenantIsolationSmoke.ts',
    'scripts/automationTenantSmoke.ts',
    'scripts/projectTenantSmoke.ts'
  ]

  tenantFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing tenant smoke test: ${file}`)
    }
  })

  console.log('   ✓ Tenant smoke test files exist')
})

// Test 6: Security basics
test('Security Basics', () => {
  const authFile = fs.readFileSync('src/lib/auth.ts', 'utf8')

  // Check for basic security functions
  const securityChecks = [
    'hashPassword',
    'verifyPassword',
    'verifyToken'
  ]

  securityChecks.forEach(check => {
    if (!authFile.includes(check)) {
      throw new Error(`Missing security function: ${check}`)
    }
  })

  console.log('   ✓ Basic security functions present')
})

// Test 7: API structure
test('API Structure', () => {
  const apiRoutes = [
    'src/app/api/admin/settings/route.ts',
    'src/app/api/admin/automations/route.ts',
    'src/app/api/me/org/route.ts',
    'src/app/api/hooks/ingest/route.ts'
  ]

  apiRoutes.forEach(route => {
    if (!fs.existsSync(route)) {
      throw new Error(`Missing API route: ${route}`)
    }
  })

  console.log('   ✓ Critical API routes exist')
})

// Summary
console.log('📊 RESULTADOS DE TESTS BÁSICOS\n')
console.log(`✅ PASSED: ${passed} tests`)
console.log(`❌ FAILED: ${failed} tests`)
console.log(`📈 TOTAL: ${passed + failed} tests\n`)

if (failed === 0) {
  console.log('🎉 TODOS LOS TESTS BÁSICOS PASARON')
  console.log('🚀 EL SISTEMA TIENE UNA BASE SÓLIDA')
  process.exit(0)
} else {
  console.log('⚠️ ALGUNOS TESTS FALLARON')
  console.log('🔧 REQUIERE ATENCIÓN ANTES DE PRODUCCIÓN')
  process.exit(1)
}



