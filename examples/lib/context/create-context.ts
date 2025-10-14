/**
 * @intent: Factory function to create execution context
 * @llm-note: Call this at the start of every API route
 * @architecture: This is the entry point for all request processing
 */

import type { ExecutionContext } from "./execution-context"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"
import { createLogger } from "@/lib/utils/logger"
import { AccessControlService } from "@/lib/services/access-control-service"
import { AuditService } from "@/lib/services/audit-service"
import { ApplicabilityService } from "@/services/applicability-service"
import { getCurrentUser } from "@/lib/auth/get-user"
import { generateRequestId } from "@/lib/utils/request-id"
import { createServerClient } from "@/lib/supabase/server"

/**
 * @intent: Create execution context from request
 * @precondition: Request object with optional auth headers
 * @postcondition: Fully initialized execution context
 * @side-effects: Logs context creation
 */
export async function createExecutionContext(request: Request): Promise<ExecutionContext> {
  const requestId = generateRequestId()
  const timestamp = new Date()

  console.log("[v0] [createExecutionContext] Starting context creation", { requestId })

  // Extract user from request (Supabase Auth)
  const user = await getCurrentUser()

  console.log("[v0] [createExecutionContext] User fetched", {
    userId: user?.id,
    role: user?.role,
    tenantId: user?.tenantId,
    organizationId: user?.organizationId,
  })

  if (!user?.tenantId) {
    console.error("[v0] [createExecutionContext] User has no tenantId", {
      userId: user?.id,
      role: user?.role,
      user: JSON.stringify(user),
    })
    throw new Error("User must have a tenantId to perform database operations")
  }

  const supabase = await createServerClient()

  const db = new SupabaseDatabaseProvider(supabase, user.tenantId)

  // Create logger with request context
  const logger = createLogger({
    requestId,
    userId: user?.id,
    organizationId: user?.organizationId,
  })

  const getSubordinateOrganizations = async (): Promise<string[]> => {
    if (!user?.organizationId) {
      return []
    }

    const { data: subordinateOrgs, error } = await supabase.rpc("get_subordinate_organizations", {
      org_id: user.organizationId,
    })

    if (error) {
      logger.error("[v0] Failed to get subordinate organizations", { error })
      return [user.organizationId]
    }

    return subordinateOrgs?.map((org: any) => org.id) || [user.organizationId]
  }

  // Create execution context
  const ctx: ExecutionContext = {
    user,
    organizationId: user?.organizationId,
    tenantId: user.tenantId, // Guaranteed to be defined now
    db,
    logger,
    audit: new AuditService(db, logger),
    access: new AccessControlService(user, db, logger),
    applicability: new ApplicabilityService(db),
    requestId,
    timestamp,
    request,
    getSubordinateOrganizations,
  }

  // Log context creation
  logger.debug("[v0] Execution context created", {
    requestId,
    userId: user?.id,
    role: user?.role,
    organizationId: user?.organizationId,
    tenantId: user.tenantId,
  })

  return ctx
}

/**
 * @intent: Convenience alias for createExecutionContext
 * @note: Can be called without request parameter in API routes (Next.js provides it automatically)
 */
export async function createContext(): Promise<ExecutionContext> {
  // In Next.js API routes, we can create a dummy request since getCurrentUser() doesn't need it
  const dummyRequest = new Request("http://localhost")
  return createExecutionContext(dummyRequest)
}
