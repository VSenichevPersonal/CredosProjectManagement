/**
 * Tenant Middleware for Multi-Tenant Architecture
 *
 * Extracts tenant information from authenticated user and creates
 * execution context for all operations.
 *
 * @module TenantMiddleware
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { ExecutionContext } from "@/lib/context/execution-context"
import { createExecutionContext } from "@/lib/context/execution-context"

/**
 * Gets the execution context for the current authenticated user
 *
 * This function should be called at the beginning of every API route
 * to establish the execution context for the request.
 *
 * @returns ExecutionContext or null if user is not authenticated
 */
export async function getExecutionContext(): Promise<ExecutionContext | null> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignore errors in middleware
          }
        },
      },
    },
  )

  // Get authenticated user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return null
  }

  // Get user from database with tenant and role information
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(`
      id,
      email,
      name,
      tenant_id,
      organization_id,
      role_id,
      is_active,
      roles (
        id,
        code,
        name
      )
    `)
    .eq("id", authUser.id)
    .single()

  if (userError || !user) {
    console.error("[TenantMiddleware] Failed to load user:", userError)
    return null
  }

  // Get user permissions
  const { data: permissions, error: permissionsError } = await supabase
    .from("role_permissions")
    .select(`
      permissions (
        code
      )
    `)
    .eq("role_id", user.role_id)

  const permissionCodes = permissions?.map((p) => p.permissions.code) || []

  // Create execution context
  return createExecutionContext(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenant_id,
      organizationId: user.organization_id,
      roleId: user.role_id,
      role: user.roles,
      isActive: user.is_active,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    permissionCodes,
  )
}

/**
 * Requires authentication and returns execution context
 *
 * Throws an error if user is not authenticated.
 * Use this in API routes that require authentication.
 *
 * @returns ExecutionContext
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<ExecutionContext> {
  const context = await getExecutionContext()

  if (!context) {
    throw new Error("Unauthorized: User is not authenticated")
  }

  return context
}

/**
 * Requires specific permission and returns execution context
 *
 * Throws an error if user doesn't have the required permission.
 *
 * @param permission - Permission code required (e.g., 'requirements:read')
 * @returns ExecutionContext
 * @throws Error if user doesn't have permission
 */
export async function requirePermission(permission: string): Promise<ExecutionContext> {
  const context = await requireAuth()

  // Super admin has all permissions
  if (context.userRole === "super_admin") {
    return context
  }

  if (!context.permissions.includes(permission)) {
    throw new Error(`Forbidden: User does not have permission '${permission}'`)
  }

  return context
}
