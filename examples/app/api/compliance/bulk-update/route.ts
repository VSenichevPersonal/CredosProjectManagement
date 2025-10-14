import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"
import { AuditLogService } from "@/services/audit-log-service"
import { NotificationService } from "@/lib/services/notification-service"

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const { complianceIds, updates } = await request.json()

    if (!Array.isArray(complianceIds) || complianceIds.length === 0) {
      return NextResponse.json({ error: "complianceIds is required and must be a non-empty array" }, { status: 400 })
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "updates object is required" }, { status: 400 })
    }

    const db = new SupabaseDatabaseProvider(true)
    const auditService = new AuditLogService(db)

    let updatedCount = 0
    const errors: string[] = []
    const affectedUserIds = new Set<string>()

    for (const id of complianceIds) {
      try {
        const oldRecord = await db.compliance.findById(id)
        if (!oldRecord) {
          errors.push(`Compliance record ${id} not found`)
          continue
        }

        const updated = await db.compliance.update(id, updates)

        if (updated.assignedTo) {
          affectedUserIds.add(updated.assignedTo)
        }

        // Log update
        await auditService.logAction({
          userId: ctx.user.id,
          action: "update",
          entityType: "compliance_record",
          entityId: id,
          changes: { before: oldRecord, after: updated },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        })

        updatedCount++
      } catch (error) {
        errors.push(`Failed to update ${id}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    if (affectedUserIds.size > 0) {
      try {
        await NotificationService.notifyBulkOperationCompleted({
          userIds: Array.from(affectedUserIds),
          operationType: "обновление",
          affectedCount: updatedCount,
          entityType: "записей о соответствии",
        })
      } catch (error) {
        console.error("[v0] Failed to send bulk operation notification:", error)
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Updated ${updatedCount} of ${complianceIds.length} compliance records`,
    })
  } catch (error: any) {
    console.error("[v0] Failed to bulk update compliance records:", error)
    return NextResponse.json({ error: error.message || "Failed to update compliance records" }, { status: 500 })
  }
}
