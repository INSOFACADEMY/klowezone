import { defineConfig } from 'prisma/config'

export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed/index.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_sRaD56UxQnuy@ep-still-thunder-ahjjklc2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  }
})
