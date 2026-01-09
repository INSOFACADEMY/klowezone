'use server'

import { LoggingService } from '@/lib/logging-service'

// Infer the return type from LoggingService.getLogs()
type LogsResponse = Awaited<ReturnType<LoggingService['getLogs']>>

export async function getLogs(filters?: {
  level?: string
  category?: string
  userId?: string
  limit?: number
  offset?: number
}): Promise<LogsResponse> {
  try {
    const loggingService = LoggingService.getInstance()
    return await loggingService.getLogs(filters)
  } catch (error) {
    console.error('Error getting logs:', error)
    return { logs: [], total: 0 }
  }
}

export async function getLogStats() {
  try {
    const loggingService = LoggingService.getInstance()
    return await loggingService.getLogStats()
  } catch (error) {
    console.error('Error getting log stats:', error)
    return {
      total: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      byCategory: {}
    }
  }
}

export async function clearOldLogs(days: number = 30) {
  try {
    // Validate days parameter
    if (!Number.isInteger(days) || days < 7 || days > 365) {
      return { success: false, error: 'Days must be an integer between 7 and 365' }
    }

    const loggingService = LoggingService.getInstance()
    const result = await loggingService.clearOldLogs(days)
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} old log entries`
    }
  } catch (error) {
    console.error('Error clearing old logs:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to clear logs' }
  }
}










