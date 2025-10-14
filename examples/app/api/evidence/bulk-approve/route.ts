import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"
import { AuditLogService } from "@/services/audit-log-service"
import { NotificationService } from "@/lib/services/notification-service"

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const { evidenceIds, reviewNotes } = await request.json()

    if (!Array.isArray(evidenceIds) || evidenceIds.length === 0) {
      return NextResponse.json({ error: "evidenceIds is required and must be a non-empty array" }, { status: 400 })
    }

    const db = new SupabaseDatabaseProvider(true)
    const auditService = new AuditLogService(db)

    let approvedCount = 0
    const errors: string[] = []
    const uploaderNotifications: Map<string, { count: number; titles: string[] }> = new Map()

    for (const id of evidenceIds) {
      try {
        const oldEvidence = await db.evidence.findById(id)
        if (!oldEvidence) {
          errors.push(`Evidence ${id} not found`)
          continue
        }

        const updated = await db.evidence.update(id, {
          status: "approved",
          reviewNotes,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        })

        if (oldEvidence.uploadedBy) {
          const existing = uploaderNotifications.get(oldEvidence.uploadedBy) || { count: 0, titles: [] }
          existing.count++
          if (oldEvidence.title) {
            existing.titles.push(oldEvidence.title)
          }
          uploaderNotifications.set(oldEvidence.uploadedBy, existing)
        }

        // Log approval
        await auditService.logAction({
          userId: ctx.user.id,
          action: "update",
          entityType: "evidence",
          entityId: id,
          changes: { before: { status: oldEvidence.status }, after: { status: "approved" } },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        })

        approvedCount++
      } catch (error) {
        errors.push(`Failed to approve ${id}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    for (const [uploaderId, info] of uploaderNotifications.entries()) {
      try {
        await NotificationService.create({
          userId: uploaderId,
          type: "evidence_approved",
          title: "Доказательства утверждены",
          message: `Утверждено ${info.count} доказательств${info.titles.length > 0 ? `: ${info.titles.slice(0, 3).join(", ")}${info.titles.length > 3 ? "..." : ""}` : ""}`,
        })
      } catch (error) {
        console.error("[v0] Failed to send evidence approval notification:", error)
      }
    }

    return NextResponse.json({
      success: true,
      approved: approvedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Approved ${approvedCount} of ${evidenceIds.length} evidence records`,
    })
  } catch (error: any) {
    console.error("[v0] Failed to bulk approve evidence:", error)
    return NextResponse.json({ error: error.message || "Failed to approve evidence" }, { status: 500 })
  }
}
