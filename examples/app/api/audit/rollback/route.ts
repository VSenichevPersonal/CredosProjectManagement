import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { AuditLogService } from "@/services/audit-log-service"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const { auditLogId } = await request.json()

    if (!auditLogId) {
      return NextResponse.json({ error: "auditLogId is required" }, { status: 400 })
    }

    const db = new SupabaseDatabaseProvider(true)
    const auditService = new AuditLogService(db)

    const success = await auditService.rollbackOperation(auditLogId, ctx.user.id)

    if (!success) {
      return NextResponse.json({ error: "Failed to rollback operation" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Operation rolled back successfully" })
  } catch (error: any) {
    console.error("[v0] Failed to rollback operation:", error)
    return NextResponse.json({ error: error.message || "Failed to rollback operation" }, { status: 500 })
  }
}
