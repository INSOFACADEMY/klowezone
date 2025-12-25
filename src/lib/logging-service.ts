import { prisma } from './prisma'

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG'
  message: string
  userId?: string
  userEmail?: string
  category: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  requestId?: string
  stackTrace?: string
}

export class LoggingService {
  private static instance: LoggingService

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService()
    }
    return LoggingService.instance
  }

  /**
   * Log an error (500 status codes and application errors)
   */
  async logError(
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      level: 'ERROR',
      message,
      category: 'Application',
      metadata: {
        ...metadata,
        error: error?.message,
        stack: error?.stack
      },
      stackTrace: error?.stack,
      ipAddress: this.extractIpAddress(request),
      userAgent: request?.headers?.get('user-agent') || undefined
    })
  }

  /**
   * Log a warning
   */
  async logWarning(
    message: string,
    category: string = 'System',
    metadata?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      level: 'WARNING',
      message,
      category,
      metadata,
      ipAddress: this.extractIpAddress(request),
      userAgent: request?.headers?.get('user-agent') || undefined
    })
  }

  /**
   * Log info
   */
  async logInfo(
    message: string,
    category: string = 'System',
    metadata?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      level: 'INFO',
      message,
      category,
      metadata,
      ipAddress: this.extractIpAddress(request),
      userAgent: request?.headers?.get('user-agent') || undefined
    })
  }

  /**
   * Log security events
   */
  async logSecurity(
    message: string,
    userId?: string,
    metadata?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      level: 'WARNING',
      message,
      category: 'Security',
      userId,
      metadata,
      ipAddress: this.extractIpAddress(request),
      userAgent: request?.headers?.get('user-agent') || undefined
    })
  }

  /**
   * Generic logging method
   */
  private async log(entry: Partial<LogEntry>): Promise<void> {
    try {
      // In development, also log to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${entry.level}] ${entry.category}: ${entry.message}`, entry.metadata)
      }

      // Store in database
      await prisma.auditLog.create({
        data: {
          resource: entry.category || 'System',
          action: entry.level || 'INFO',
          resourceId: entry.userId || null,
          oldValues: {},
          newValues: {
            message: entry.message,
            metadata: entry.metadata || {},
            stackTrace: entry.stackTrace,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            requestId: entry.requestId
          },
          userId: entry.userId || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          timestamp: entry.timestamp || new Date()
        }
      })
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to log to database:', error)
    }
  }

  /**
   * Get logs with filtering and pagination
   */
  async getLogs(options: {
    level?: string
    category?: string
    userId?: string
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
  } = {}): Promise<{ logs: LogEntry[], total: number }> {
    const {
      level,
      category,
      userId,
      limit = 50,
      offset = 0,
      startDate,
      endDate
    } = options

    const where: any = {}

    if (level) {
      where.action = level
    }

    if (category) {
      where.resource = category
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = startDate
      if (endDate) where.timestamp.lte = endDate
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { email: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.auditLog.count({ where })
    ])

    // Transform to LogEntry format
    const transformedLogs: LogEntry[] = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.action as LogEntry['level'],
      message: log.newValues?.message || 'No message',
      userId: log.userId || undefined,
      userEmail: log.user?.email || undefined,
      category: log.resource,
      metadata: log.newValues?.metadata || {},
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      stackTrace: log.newValues?.stackTrace || undefined
    }))

    return { logs: transformedLogs, total }
  }

  /**
   * Get log statistics
   */
  async getLogStats(): Promise<{
    total: number
    errors: number
    warnings: number
    info: number
    byCategory: Record<string, number>
  }> {
    const [total, errors, warnings, info, categoryStats] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { action: 'ERROR' } }),
      prisma.auditLog.count({ where: { action: 'WARNING' } }),
      prisma.auditLog.count({ where: { action: 'INFO' } }),
      prisma.auditLog.groupBy({
        by: ['resource'],
        _count: { resource: true }
      })
    ])

    const byCategory: Record<string, number> = {}
    categoryStats.forEach(stat => {
      byCategory[stat.resource] = stat._count.resource
    })

    return {
      total,
      errors,
      warnings,
      info,
      byCategory
    }
  }

  private extractIpAddress(request?: Request): string | undefined {
    if (!request) return undefined

    // Try to get IP from various headers
    const forwarded = request.headers?.get('x-forwarded-for')
    const realIp = request.headers?.get('x-real-ip')
    const cfConnectingIp = request.headers?.get('cf-connecting-ip')

    return forwarded?.split(',')[0] || realIp || cfConnectingIp || undefined
  }
}

// Global instance
export const logger = LoggingService.getInstance()

// Convenience functions
export const logError = logger.logError.bind(logger)
export const logWarning = logger.logWarning.bind(logger)
export const logInfo = logger.logInfo.bind(logger)
export const logSecurity = logger.logSecurity.bind(logger)
