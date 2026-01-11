import { defineConfig } from 'prisma/config'
import { loadEnv, validateRequiredEnv } from './prisma/loadEnv'

// Load environment variables silently (enterprise loader)
loadEnv()

// Validate required environment variables
validateRequiredEnv()

export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed/index.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
})