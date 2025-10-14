import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"
import { AuditLogService } from "@/services/audit-log-service"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const { evidenceIds } = await request.json()

    if (!Array.isArray(evidenceIds) || evidenceIds.length === 0) {
      return NextResponse.json({ error: "evidenceIds is required and must be a non-empty array" }, { status: 400 })
    }

    const db = new SupabaseDatabaseProvider(true)
    const auditService = new AuditLogService(db)
    const supabase = await createServerClient()

    let deletedCount = 0
    const errors: string[] = []

    for (const id of evidenceIds) {
      try {
        const evidence = await db.evidence.findById(id)
        if (!evidence) {
          errors.push(`Evidence ${id} not found`)
          continue
        }

        // Delete file from storage if exists
        if (evidence.storagePath) {
          const { error: storageError } = await supabase.storage.from("evidence-files").remove([evidence.storagePath])

          if (storageError) {
            console.error(`[v0] Failed to delete file from storage:`, storageError)
          }
        }

        // Log deletion
        await auditService.logAction({
          userId: ctx.user.id,
          action: "delete",
          entityType: "evidence",
          entityId: id,
          changes: { deleted: evidence },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        })

        // Delete from database
        await db.evidence.delete(id)
        deletedCount++
      } catch (error) {
        errors.push(`Failed to delete ${id}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Deleted ${deletedCount} of ${evidenceIds.length} evidence records`,
    })
  } catch (error: any) {
    console.error("[v0] Failed to bulk delete evidence:", error)
    return NextResponse.json({ error: error.message || "Failed to delete evidence" }, { status: 500 })
  }
}
