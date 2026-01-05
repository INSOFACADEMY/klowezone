'use server'

import { LoggingService } from '@/lib/logging-service'

export async function getLogs(filters?: {
  level?: string
  category?: string
  userId?: string
  limit?: number
  offset?: number
}) {
  try {
    const loggingService = LoggingService.getInstance()
    return await loggingService.getLogs(filters)
  } catch (error) {
    console.error('Error getting logs:', error)
    return []
  }
}

export async function getLogStats() {
  try {
    const loggingService = LoggingService.getInstance()
    return await loggingService.getStats()
  } catch (error) {
    console.error('Error getting log stats:', error)
    return {
      total: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      debug: 0
    }
  }
}

export async function clearOldLogs(days: number = 30) {
  try {
    const loggingService = LoggingService.getInstance()
    await loggingService.clearOldLogs(days)
    return { success: true }
  } catch (error) {
    console.error('Error clearing old logs:', error)
    return { success: false, error: 'Failed to clear logs' }
  }
}





