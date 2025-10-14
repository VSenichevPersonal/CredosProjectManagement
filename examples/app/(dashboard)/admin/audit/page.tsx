"use client"

import { useState, useEffect } from "react"
import { AuditLogTable } from "@/components/audit/audit-log-table"

interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  changes: any
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: { name: string; email: string; organization_id?: string }
}

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch("/api/audit")
      const data = await response.json()
      setAuditLogs(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AuditLogTable (via UniversalDataTable) now handles all UI */}
      <AuditLogTable logs={auditLogs} />
    </div>
  )
}
