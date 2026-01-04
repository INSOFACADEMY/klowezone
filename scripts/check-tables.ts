#!/usr/bin/env tsx

import { config } from 'dotenv'
import { Pool } from 'pg'

config({ path: '.env.local' })

async function checkTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const result = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    console.log('📋 TABLAS EXISTENTES:')
    result.rows.forEach(row => {
      console.log(`  • ${row.tablename}`)
    })

    // Check specific tables
    const multiTenantTables = ['organizations', 'organization_members']
    const existing = result.rows.filter(r => multiTenantTables.includes(r.tablename))

    console.log('\n🏢 MULTI-TENANT STATUS:')
    multiTenantTables.forEach(table => {
      const exists = existing.some(r => r.tablename === table)
      console.log(`  • ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    pool.end()
  }
}

checkTables()
