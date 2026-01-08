/**
 * CENTRALIZED ROLE DEFINITIONS
 *
 * Constantes para roles y permisos del sistema
 * Usar estas constantes en lugar de arrays hardcodeados
 */

// Admin roles (pueden acceder al panel /admin)
export const ADMIN_ROLES = [
  'superadmin',
  'admin',
  'editor',
  'analyst',
  'support'
] as const

export type AdminRole = typeof ADMIN_ROLES[number]

// Organization roles (dentro de una org)
export const ORG_ROLES = [
  'owner',
  'admin',
  'member',
  'viewer'
] as const

export type OrgRole = typeof ORG_ROLES[number]

// Helper functions
export function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

export function isOrgRole(role: string): role is OrgRole {
  return ORG_ROLES.includes(role as OrgRole)
}

// Role hierarchies
export const ROLE_HIERARCHIES = {
  admin: {
    superadmin: 5,
    admin: 4,
    editor: 3,
    analyst: 2,
    support: 1
  },
  org: {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
  }
} as const

