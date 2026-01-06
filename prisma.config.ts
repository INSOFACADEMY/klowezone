import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Load environment variables for Prisma CLI
// Try .env.local first, fallback to .env
const envLocalPath = resolve('.env.local')
const envPath = resolve('.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath })
} else if (existsSync(envPath)) {
  config({ path: envPath })
}

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set')
  console.error('')
  console.error('📝 SOLUTION:')
  console.error('1. Create .env.local file in the project root')
  console.error('2. Add your database connection string:')
  console.error('   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"')
  console.error('')
  console.error('For Neon serverless PostgreSQL:')
  console.error('DATABASE_URL="postgresql://user:password@host/database?sslmode=require"')
  console.error('')
  console.error('For local PostgreSQL:')
  console.error('DATABASE_URL="postgresql://postgres:password@localhost:5432/klowezone"')
  console.error('')
  process.exit(1)
}

export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed/index.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
})