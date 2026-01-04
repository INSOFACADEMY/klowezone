#!/usr/bin/env tsx

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load environment variables
config({ path: '.env.local' })

async function simpleBackfill() {
  console.log('🚀 Simple backfill test...\n')

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('❌ DATABASE_URL not set')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  const prisma = new PrismaClient({
    adapter,
    log: ['error']
  })

  try {
    console.log('🔍 Testing basic query...')
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users`)

    console.log('🏢 Checking organizations...')
    const orgCount = await prisma.organization.count()
    console.log(`✅ Found ${orgCount} organizations`)

    if (orgCount === 0) {
      console.log('📝 Creating default organization...')
      const org = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          description: 'Created by backfill',
          isActive: true
        }
      })
      console.log(`✅ Created org: ${org.id}`)
    }

    console.log('🎉 Simple backfill completed!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simpleBackfill()
