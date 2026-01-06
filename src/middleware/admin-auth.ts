import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function requireAdminUser(request: NextRequest) {
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
    },
  }) as UserWithRole | null;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const adminRoles = ["superadmin", "admin", "editor", "analyst", "support"];
  const roleName = user.role?.name?.toLowerCase?.() ?? "";
  if (!adminRoles.includes(roleName)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  return { user };
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











