'use server'

import { getUsers, updateUserStatus } from '@/lib/dashboard-service'
import { prisma } from '@/lib/prisma'

export async function fetchUsers(page: number = 1, limit: number = 10) {
  try {
    return await getUsers(page, limit)
  } catch (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0, page: 1, totalPages: 0 }
  }
}

export async function updateUserStatusAction(userId: string, isActive: boolean) {
  try {
    return await updateUserStatus(userId, isActive)
  } catch (error) {
    console.error('Error updating user status:', error)
    throw error
  }
}

export async function updateUserRole(userId: string, roleId: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: { role: true }
    })
    return user
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

export async function getUserDetails(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        projectsAsClient: {
          take: 5,
          orderBy: { created_at: 'desc' }
        }
      }
    })
    return user
  } catch (error) {
    console.error('Error fetching user details:', error)
    return null
  }
}
