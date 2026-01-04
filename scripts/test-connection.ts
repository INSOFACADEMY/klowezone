#!/usr/bin/env tsx

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load environment variables
config({ path: '.env.local' })

async function testConnection() {
  console.log('🔍 Testing database connection...\n')

  const connectionString = process.env.DATABASE_URL
  console.log('DATABASE_URL:', connectionString ? '✅ Present' : '❌ Missing')

  if (!connectionString) {
    console.log('❌ No DATABASE_URL found')
    return
  }

  try {
    console.log('🔧 Creating connection...')
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    const prisma = new PrismaClient({
      adapter,
      log: ['error']
    })

    console.log('📡 Testing connection...')
    await prisma.$connect()

    console.log('✅ Database connection successful!')

    // Test simple query
    const userCount = await prisma.user.count()
    console.log(`👥 Users in database: ${userCount}`)

    await prisma.$disconnect()
    console.log('✅ Connection closed successfully')

  } catch (error) {
    console.error('❌ Connection failed:', error)
  }
}

testConnection()