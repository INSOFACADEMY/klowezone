// prisma.config.ts
import { defineConfig } from 'prisma/config'
import { config as loadEnv, type DotenvConfigOptions } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

/**
 * Prisma CLI env loader (clean/quiet).
 * - Prefiere .env.local (dev) y cae a .env
 * - Evita logs ruidosos de dotenv@17.x con { quiet: true }
 *
 * Nota: Algunas versiones de @types no traen "quiet" todavía,
 * por eso extendemos el tipo de forma segura y tipada.
 */
type DotenvConfigOptionsWithQuiet = DotenvConfigOptions & {
  quiet?: boolean
}

function loadPrismaEnv() {
  const envLocalPath = resolve(process.cwd(), '.env.local')
  const envPath = resolve(process.cwd(), '.env')

  const pathToUse = existsSync(envLocalPath)
    ? envLocalPath
    : existsSync(envPath)
      ? envPath
      : null

  if (!pathToUse) return

  const opts: DotenvConfigOptionsWithQuiet = {
    path: pathToUse,
    override: false,
    quiet: true
  }

  loadEnv(opts)
}

loadPrismaEnv()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL || typeof DATABASE_URL !== 'string' || DATABASE_URL.trim().length === 0) {
  throw new Error(
    [
      'Missing DATABASE_URL for Prisma.',
      'Set it in .env.local (preferred) or .env.',
      'Example:',
      'DATABASE_URL="postgresql://postgres:password@localhost:5432/klowezone"'
    ].join('\n')
  )
}

export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed/index.ts'
  },
  datasource: {
    url: DATABASE_URL
  }
})
