/**
 * ORGANIZATION ROLE-BASED ACCESS CONTROL (RBAC)
 *
 * Helpers for checking organization-level permissions
 */

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export interface OrgContext {
  userId: string
  orgId: string
  orgRole: OrgRole
}

// Role hierarchy (higher roles include lower role permissions)
const ROLE_HIERARCHY: Record<OrgRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1
}

// Permission mappings by organization role
export const ORG_PERMISSIONS = {
  // Settings management
  'settings:write': ['OWNER', 'ADMIN'],
  'settings:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],

  // Member management
  'members:invite': ['OWNER'],
  'members:remove': ['OWNER'],
  'members:change_role': ['OWNER'],
  'members:view': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],

  // Workflow management
  'workflows:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'workflows:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'workflows:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'workflows:delete': ['OWNER', 'ADMIN'],
  'workflows:trigger': ['OWNER', 'ADMIN', 'MEMBER'],

  // Project management
  'projects:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'projects:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'projects:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'projects:delete': ['OWNER', 'ADMIN'],

  // Client management
  'clients:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'clients:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'clients:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'clients:delete': ['OWNER', 'ADMIN'],

  // API Keys management
  'api-keys:create': ['OWNER', 'ADMIN'],
  'api-keys:read': ['OWNER', 'ADMIN'],
  'api-keys:revoke': ['OWNER', 'ADMIN']
} as const

export type OrgPermission = keyof typeof ORG_PERMISSIONS

/**
 * Check if user has a specific organization role
 */
export function hasOrgRole(ctx: OrgContext, requiredRole: OrgRole): boolean {
  return ctx.orgRole === requiredRole
}

/**
 * Check if user has any of the specified organization roles
 */
export function hasAnyOrgRole(ctx: OrgContext, requiredRoles: OrgRole[]): boolean {
  return requiredRoles.includes(ctx.orgRole)
}

/**
 * Check if user has a specific permission in the organization
 */
export function hasOrgPermission(ctx: OrgContext, permission: OrgPermission): boolean {
  const allowedRoles = ORG_PERMISSIONS[permission]
  return allowedRoles.includes(ctx.orgRole)
}

/**
 * Check if user has all specified permissions in the organization
 */
export function hasAllOrgPermissions(ctx: OrgContext, permissions: OrgPermission[]): boolean {
  return permissions.every(permission => hasOrgPermission(ctx, permission))
}

/**
 * Check if user has at least one of the specified permissions
 */
export function hasAnyOrgPermission(ctx: OrgContext, permissions: OrgPermission[]): boolean {
  return permissions.some(permission => hasOrgPermission(ctx, permission))
}

/**
 * Check if user's role is at or above the required role in hierarchy
 */
export function hasOrgRoleLevel(ctx: OrgContext, minimumRole: OrgRole): boolean {
  const userLevel = ROLE_HIERARCHY[ctx.orgRole]
  const requiredLevel = ROLE_HIERARCHY[minimumRole]
  return userLevel >= requiredLevel
}

/**
 * Get all permissions for a specific role
 */
export function getOrgRolePermissions(role: OrgRole): OrgPermission[] {
  return Object.entries(ORG_PERMISSIONS)
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([permission]) => permission as OrgPermission)
}

/**
 * Validate organization context exists and has required role
 */
export function validateOrgAccess(
  ctx: OrgContext | null,
  requiredRoles: OrgRole[],
  action: string = 'perform this action'
): { success: true } | { success: false, error: string, statusCode: number } {
  if (!ctx) {
    return {
      success: false,
      error: 'Organization context required',
      statusCode: 400
    }
  }

  if (!hasAnyOrgRole(ctx, requiredRoles)) {
    return {
      success: false,
      error: `Insufficient organization permissions. Required roles: ${requiredRoles.join(', ')}. Your role: ${ctx.orgRole}`,
      statusCode: 403
    }
  }

  return { success: true }
}

/**
 * Validate organization context exists and has required permission
 */
export function validateOrgPermission(
  ctx: OrgContext | null,
  permission: OrgPermission,
  action: string = 'perform this action'
): { success: true } | { success: false, error: string, statusCode: number } {
  if (!ctx) {
    return {
      success: false,
      error: 'Organization context required',
      statusCode: 400
    }
  }

  if (!hasOrgPermission(ctx, permission)) {
    const allowedRoles = ORG_PERMISSIONS[permission]
    return {
      success: false,
      error: `Permission denied: ${permission}. Allowed roles: ${allowedRoles.join(', ')}. Your role: ${ctx.orgRole}`,
      statusCode: 403
    }
  }

  return { success: true }
}

/**
 * Type guard to check if value is a valid OrgRole
 */
export function isValidOrgRole(role: string): role is OrgRole {
  return ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(role)
}

/**
 * Get role display name with optional icon
 */
export function getOrgRoleDisplay(role: OrgRole): { name: string, color: string } {
  const roleConfig = {
    OWNER: { name: 'Owner', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
    ADMIN: { name: 'Admin', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
    MEMBER: { name: 'Member', color: 'text-slate-400 bg-slate-500/20 border-slate-500/30' },
    VIEWER: { name: 'Viewer', color: 'text-gray-400 bg-gray-500/20 border-gray-500/30' }
  }

  return roleConfig[role]
}
