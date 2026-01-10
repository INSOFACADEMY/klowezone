/**
 * Debug Logging Utilities - Enterprise Edition
 *
 * Centralized debug logging system for development only.
 * Automatically disabled in production and build environments.
 *
 * Usage:
 * - debugLog('message', data) - General debug logging
 * - debugWarn('warning message') - Warning level debug
 * - debugError('error message') - Error level debug
 *
 * All logs are automatically suppressed in production builds.
 */

/* eslint-disable no-console */

/**
 * Debug log - Only logs in development environment
 */
export function debugLog(...args: any[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args)
  }
}

/**
 * Debug warning - Only logs in development environment
 */
export function debugWarn(...args: any[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args)
  }
}

/**
 * Debug error - Only logs in development environment
 */
export function debugError(...args: any[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args)
  }
}

/* eslint-enable no-console */
