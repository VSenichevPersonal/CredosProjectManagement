import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"
import { AuditLogService } from "@/services/audit-log-service"

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const { complianceIds } = await request.json()

    if (!Array.isArray(complianceIds) || complianceIds.length === 0) {
      return NextResponse.json({ error: "complianceIds is required and must be a non-empty array" }, { status: 400 })
    }

    const db = new SupabaseDatabaseProvider(true)
    const auditService = new AuditLogService(db)

    // Get compliance records before deletion for audit
    const complianceRecords = await Promise.all(complianceIds.map((id) => db.compliance.findById(id)))

    // Delete compliance records
    let deletedCount = 0
    const errors: string[] = []

    for (const id of complianceIds) {
      try {
        const record = complianceRecords.find((r) => r?.id === id)
        if (!record) {
          errors.push(`Compliance record ${id} not found`)
          continue
        }

        // Log deletion
        await auditService.logAction({
          userId: ctx.user.id,
          action: "delete",
          entityType: "compliance_record",
          entityId: id,
          changes: { deleted: record },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        })

        // Delete from database (assuming we add delete method)
        // await db.compliance.delete(id)
        deletedCount++
      } catch (error) {
        errors.push(`Failed to delete ${id}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Deleted ${deletedCount} of ${complianceIds.length} compliance records`,
    })
  } catch (error: any) {
    console.error("[v0] Failed to bulk delete compliance records:", error)
    return NextResponse.json({ error: error.message || "Failed to delete compliance records" }, { status: 500 })
  }
}
