/**
 * Enterprise Environment Loader
 *
 * Centralized, silent-by-default environment variable loading for Prisma and server-side code.
 * Prevents dotenv spam during builds and CI/CD while maintaining full functionality in development.
 *
 * Behavior:
 * - Production/CI/Build: Completely silent
 * - Development: Silent by default, verbose only with DOTENV_VERBOSE=true
 * - Loads .env.local first, then .env (standard Next.js behavior)
 * - No duplicate loading - checks if DATABASE_URL already exists
 */

import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

/**
 * Enterprise environment loader with conditional verbosity
 */
export function loadEnv(): void {
  // Skip if DATABASE_URL is already loaded (prevents duplicate loading)
  if (process.env.DATABASE_URL) {
    return
  }

  // Determine if verbose logging should be enabled
  const isVerbose = process.env.DOTENV_VERBOSE === 'true'
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const isCI = process.env.CI === 'true'

  // Silent by default in production, CI, and builds
  // Only verbose in development with explicit flag
  const shouldLog = isVerbose && isDevelopment && !isCI

  // Load environment files silently (suppress dotenv logs)
  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error

  // Suppress dotenv logs during loading
  if (!shouldLog) {
    console.log = () => {}
    console.warn = () => {}
    console.error = () => {}
  }

  try {
    // Load environment files in standard Next.js order
    const envLocalPath = resolve('.env.local')
    const envPath = resolve('.env')

    // Try .env.local first (highest priority)
    if (existsSync(envLocalPath)) {
      config({ path: envLocalPath })
    }
    // Fallback to .env
    else if (existsSync(envPath)) {
      config({ path: envPath })
    }
  } finally {
    // Restore console functions
    if (!shouldLog) {
      console.log = originalConsoleLog
      console.warn = originalConsoleWarn
      console.error = originalConsoleError
    }
  }

  // Log only if explicitly requested and in development
  if (shouldLog) {
    console.log(`[Enterprise Env Loader] Environment loaded silently`)
  }
}

/**
 * Validate required environment variables
 * Call this after loadEnv() to ensure critical vars are present
 */
export function validateRequiredEnv(): void {
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
}
