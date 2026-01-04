'use server'

import { getDashboardStats } from '@/lib/dashboard-service'

export async function fetchDashboardStats() {
  try {
    return await getDashboardStats()
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
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

