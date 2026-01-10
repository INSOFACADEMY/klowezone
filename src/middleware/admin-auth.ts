import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/auth/adminSession";
import { isAdminRole } from "@/lib/roles";

interface UserWithRole {
  id: string
  email: string
  role: {
    name: string
    permissions: {
      name: string
    }[]
  }
}

interface AdminAuthResult {
  user: UserWithRole
  orgId: string
}

export async function requireAdminUser(request: NextRequest): Promise<AdminAuthResult | NextResponse> {
  // Try session-based auth first (new preferred method)
  const sessionData = await getAdminSessionFromRequest(request);

  if (sessionData) {
    // Get full user data with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      include: {
        role: { include: { permissions: { select: { name: true } } } },
      },
    }) as UserWithRole | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Double-check admin role (defense in depth)
    if (!isAdminRole(sessionData.roleName)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return {
      user,
      orgId: sessionData.orgId
    };
  }

  // Fallback to legacy JWT auth for backward compatibility
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.replace("Bearer ", "") || request.cookies.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      role: { include: { permissions: { select: { name: true } } } },
      organizationMemberships: {
        select: { organizationId: true },
        take: 1,
      },
    },
  }) as (UserWithRole & { organizationMemberships: { organizationId: string }[] }) | null;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const roleName = user.role?.name?.toLowerCase?.() ?? "";
  if (!isAdminRole(roleName)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const orgId = user.organizationMemberships?.[0]?.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "No active organization found" }, { status: 403 });
  }

  return {
    user,
    orgId
  };
}

export function hasPermission(user: UserWithRole, permission: string): boolean {
  return user.role.permissions.some(p => p.name === permission)
}

export function hasAnyPermission(user: UserWithRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission))
}

export function hasRole(user: UserWithRole, role: string): boolean {
  return user.role.name === role
}

export function hasAnyRole(user: UserWithRole, roles: string[]): boolean {
  return roles.includes(user.role.name)
}











