#!/usr/bin/env tsx

import { config } from 'dotenv'
import { Pool } from 'pg'

// Load environment variables
config({ path: '.env.local' })

async function testDB() {
  console.log('🔍 Testing raw database connection...\n')

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.log('❌ No DATABASE_URL')
    return
  }

  const pool = new Pool({ connectionString })

  try {
    console.log('📡 Connecting...')
    const client = await pool.connect()

    console.log('🔍 Testing queries...')

    // Test basic query
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.split(' ')[0])

    // Check if tables exist
    const tables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    console.log('📋 Tables in database:')
    tables.rows.forEach(row => {
      console.log(`  • ${row.tablename}`)
    })

    // Check users table
    try {
      const users = await client.query('SELECT COUNT(*) as count FROM users')
      console.log(`👥 Users table exists with ${users.rows[0].count} records`)
    } catch (error) {
      console.log('❌ Users table does not exist or is not accessible')
    }

    client.release()
    console.log('✅ Database test completed successfully!')

  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await pool.end()
  }
}

testDB()
