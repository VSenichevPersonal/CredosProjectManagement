import type { DatabaseProvider } from "@/providers/database-provider"

export interface AuditLogEntry {
  id?: string
  tenantId?: string
  userId: string
  action: "create" | "update" | "delete" | "bulk_create" | "bulk_update" | "bulk_delete"
  entityType: string
  entityId: string
  changes: any
  ipAddress?: string
  userAgent?: string
  createdAt?: Date
}

export class AuditLogService {
  constructor(private db: DatabaseProvider) {}

  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const supabase = await import("@/lib/supabase/server").then((m) => m.createServerClient())

      await supabase.from("audit_log").insert({
        user_id: entry.userId,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        changes: entry.changes,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
      })
    } catch (error) {
      console.error("[v0] Failed to log audit action:", error)
    }
  }

  async getAuditLog(filters?: {
    entityType?: string
    entityId?: string
    userId?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<AuditLogEntry[]> {
    try {
      const supabase = await import("@/lib/supabase/server").then((m) => m.createServerClient())

      let query = supabase.from("audit_log").select("*")

      if (filters?.entityType) {
        query = query.eq("entity_type", filters.entityType)
      }
      if (filters?.entityId) {
        query = query.eq("entity_id", filters.entityId)
      }
      if (filters?.userId) {
        query = query.eq("user_id", filters.userId)
      }
      if (filters?.action) {
        query = query.eq("action", filters.action)
      }
      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString())
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString())
      }

      query = query.order("created_at", { ascending: false })

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Failed to fetch audit log:", error)
        return []
      }

      return (
        data?.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          userId: row.user_id,
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          changes: row.changes,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          createdAt: new Date(row.created_at),
        })) || []
      )
    } catch (error) {
      console.error("[v0] Failed to get audit log:", error)
      return []
    }
  }

  async rollbackOperation(auditLogId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await import("@/lib/supabase/server").then((m) => m.createServerClient())

      const { data: auditEntry, error: fetchError } = await supabase
        .from("audit_log")
        .select("*")
        .eq("id", auditLogId)
        .single()

      if (fetchError || !auditEntry) {
        console.error("[v0] Audit entry not found:", fetchError)
        return false
      }

      const changes = auditEntry.changes

      switch (auditEntry.action) {
        case "create":
          await this.rollbackCreate(auditEntry.entity_type, auditEntry.entity_id, userId)
          break

        case "update":
          if (changes.before) {
            await this.rollbackUpdate(auditEntry.entity_type, auditEntry.entity_id, changes.before, userId)
          }
          break

        case "delete":
          if (changes.deleted) {
            await this.rollbackDelete(auditEntry.entity_type, changes.deleted, userId)
          }
          break

        default:
          console.error("[v0] Unsupported rollback action:", auditEntry.action)
          return false
      }

      await this.logAction({
        userId,
        action: "update",
        entityType: "audit_log",
        entityId: auditLogId,
        changes: { rollback: true, originalAction: auditEntry.action },
      })

      return true
    } catch (error) {
      console.error("[v0] Failed to rollback operation:", error)
      return false
    }
  }

  private async rollbackCreate(entityType: string, entityId: string, userId: string): Promise<void> {
    const tableName = this.getTableName(entityType)
    const supabase = await import("@/lib/supabase/server").then((m) => m.createServerClient())

    await supabase.from(tableName).delete().eq("id", entityId)

    await this.logAction({
      userId,
      action: "delete",
      entityType,
      entityId,
      changes: { rollback: true, reason: "Rollback of create operation" },
    })
  }

  private async rollbackUpdate(
    entityType: string,
    entityId: string,
    previousState: any,
    userId: string,
  ): Promise<void> {
    const tableName = this.getTableName(entityType)
    const supabase = await import("@/lib/supabase/server").then((m) => m.createServerClient())

    await supabase.from(tableName).update(previousState).eq("id", entityId)

    await this.logAction({
      userId,
      action: "update",
      entityType,
      entityId,
      changes: { rollback: true, restoredState: previousState },
    })
  }

  private async rollbackDelete(entityType: string, deletedData: any, userId: string): Promise<void> {
    const tableName = this.getTableName(entityType)
    const supabase = await import("@/lib/supabase/server").then((m) => m.createServerClient())

    await supabase.from(tableName).insert(deletedData)

    await this.logAction({
      userId,
      action: "create",
      entityType,
      entityId: deletedData.id,
      changes: { rollback: true, restoredData: deletedData },
    })
  }

  private getTableName(entityType: string): string {
    const tableMap: Record<string, string> = {
      compliance_record: "compliance_records",
      evidence: "evidence",
      requirement: "requirements",
      organization: "organizations",
      control: "controls",
      user: "users",
    }

    return tableMap[entityType] || entityType
  }
}
