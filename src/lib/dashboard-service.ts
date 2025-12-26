import { prisma } from './prisma'

// ========================================
// DASHBOARD SERVICE - Real Data Functions
// ========================================

export interface DashboardStats {
  totalUsers: number
  totalPosts: number
  totalRevenue: number
  activeProjects: number
  totalClients: number
  systemHealth: number
  recentActivity: ActivityItem[]
  topProjects: ProjectItem[]
}

export interface ActivityItem {
  id: string
  type: 'user' | 'project' | 'system'
  message: string
  timestamp: Date
  user?: string
}

export interface ProjectItem {
  id: string
  name: string
  client: string
  status: string
  progress: number
  dueDate: Date
}

// ========================================
// DASHBOARD STATISTICS FUNCTIONS
// ========================================

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get user count
    const totalUsers = await prisma.user.count({
      where: { isActive: true }
    })

    // Get client count
    const totalClients = await prisma.user.count({
      where: {
        isActive: true,
        role: {
          name: 'CLIENT'
        }
      }
    })

    // Get project count
    const activeProjects = await prisma.project.count({
      where: {
        status: {
          in: ['ACTIVE', 'IN_PROGRESS', 'ON_HOLD']
        }
      }
    })

    // Get total revenue from invoices/payments
    const totalRevenue = await prisma.financialTransaction.aggregate({
      _sum: {
        amount: true
      },
      where: {
        type: 'INCOME',
        status: 'COMPLETED'
      }
    })

    // Get recent activity
    const recentActivity = await getRecentActivity()

    // Get top projects
    const topProjects = await getTopProjects()

    // Calculate system health
    const systemHealth = await calculateSystemHealth()

    return {
      totalUsers,
      totalPosts: 0, // TODO: Implement when blog system is ready
      totalRevenue: totalRevenue._sum.amount || 0,
      activeProjects,
      totalClients,
      systemHealth,
      recentActivity,
      topProjects
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)

    // Return fallback data if database is not available
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalRevenue: 0,
      activeProjects: 0,
      totalClients: 0,
      systemHealth: 0,
      recentActivity: [],
      topProjects: []
    }
  }
}

export async function getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
  try {
    // Get recent audit logs
    const auditLogs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    return auditLogs.map(log => ({
      id: log.id,
      type: mapActionToType(log.action),
      message: generateActivityMessage(log),
      timestamp: log.createdAt,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'
    }))
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

export async function getTopProjects(limit: number = 5): Promise<ProjectItem[]> {
  try {
    const projects = await prisma.project.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      client: project.client ? `${project.client.firstName} ${project.client.lastName}` : 'Unknown',
      status: project.status,
      progress: calculateProjectProgress(project),
      dueDate: project.endDate || new Date()
    }))
  } catch (error) {
    console.error('Error fetching top projects:', error)
    return []
  }
}

export async function calculateSystemHealth(): Promise<number> {
  try {
    // Check various system components
    const checks = await Promise.allSettled([
      // Database connectivity
      prisma.user.count().then(() => true).catch(() => false),

      // Recent user activity (users active in last 7 days)
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }).then(count => count > 0).catch(() => false),

      // Active projects
      prisma.project.count({
        where: { status: 'ACTIVE' }
      }).then(count => count > 0).catch(() => false)
    ])

    const passedChecks = checks.filter(result =>
      result.status === 'fulfilled' && result.value === true
    ).length

    // Return percentage based on passed checks
    return Math.round((passedChecks / checks.length) * 100)
  } catch (error) {
    console.error('Error calculating system health:', error)
    return 0
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function mapActionToType(action: string): 'user' | 'project' | 'system' {
  if (action.includes('USER') || action.includes('LOGIN')) return 'user'
  if (action.includes('PROJECT')) return 'project'
  return 'system'
}

function generateActivityMessage(log: any): string {
  const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'

  switch (log.action) {
    case 'USER_LOGIN':
      return `${userName} inició sesión`
    case 'USER_CREATED':
      return `${userName} creó una nueva cuenta`
    case 'PROJECT_CREATED':
      return `${userName} creó un nuevo proyecto`
    case 'PROJECT_UPDATED':
      return `${userName} actualizó un proyecto`
    default:
      return `${userName} realizó la acción: ${log.action}`
  }
}

function calculateProjectProgress(project: any): number {
  // This is a simplified progress calculation
  // In a real implementation, you'd calculate based on tasks completed
  const statusWeights = {
    'PLANNING': 10,
    'ACTIVE': 30,
    'IN_PROGRESS': 60,
    'REVIEW': 80,
    'COMPLETED': 100
  }

  return statusWeights[project.status as keyof typeof statusWeights] || 0
}

// ========================================
// USER MANAGEMENT FUNCTIONS
// ========================================

export async function getUsers(page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          role: true
        }
      }),
      prisma.user.count()
    ])

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0, page: 1, totalPages: 0 }
  }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: { role: true }
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    throw error
  }
}

// ========================================
// PROJECT MANAGEMENT FUNCTIONS
// ========================================

export async function getProjects(page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          client: {
            select: { firstName: true, lastName: true }
          },
          tasks: {
            select: { status: true }
          }
        }
      }),
      prisma.project.count()
    ])

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { projects: [], total: 0, page: 1, totalPages: 0 }
  }
}

export async function updateProjectStatus(projectId: string, status: string) {
  try {
    return await prisma.project.update({
      where: { id: projectId },
      data: { status }
    })
  } catch (error) {
    console.error('Error updating project status:', error)
    throw error
  }
}

// ========================================
// SYSTEM CONFIGURATION FUNCTIONS
// ========================================

export async function getSystemConfig() {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    // Decrypt sensitive values
    const decryptedConfigs = configs.map(config => ({
      ...config,
      value: config.isSecret ? decryptValue(config.value) : config.value
    }))

    return decryptedConfigs
  } catch (error) {
    console.error('Error fetching system config:', error)
    return []
  }
}

export async function updateSystemConfig(key: string, value: string, isSecret: boolean = false) {
  try {
    const encryptedValue = isSecret ? encryptValue(value) : value

    return await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value: encryptedValue,
        isSecret,
        updatedAt: new Date()
      },
      create: {
        key,
        value: encryptedValue,
        isSecret
      }
    })
  } catch (error) {
    console.error('Error updating system config:', error)
    throw error
  }
}

// ========================================
// ENCRYPTION HELPERS (PLACEHOLDER)
// ========================================

function encryptValue(value: string): string {
  // TODO: Implement proper encryption using the encryption service
  return `encrypted:${value}`
}

function decryptValue(encryptedValue: string): string {
  // TODO: Implement proper decryption using the encryption service
  if (encryptedValue.startsWith('encrypted:')) {
    return encryptedValue.replace('encrypted:', '')
  }
  return encryptedValue
}




