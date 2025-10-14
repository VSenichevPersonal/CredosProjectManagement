/**
 * API Route: Export compliance records to Excel
 * 
 * GET /api/compliance/export
 * Query params:
 * - organization_id (optional) - filter by organization
 * - status (optional) - filter by status
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[API] Compliance export: Starting", { userId: user.id, tenantId: user.tenantId })

    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organization_id")
    const status = searchParams.get("status")

    // Build query
    let query = supabase
      .from("compliance_records")
      .select(`
        *,
        requirement:requirements(id, code, title, description, criticality),
        organization:organizations(id, name),
        assigned_to_user:users!compliance_records_assigned_to_fkey(id, name, email)
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (user.tenantId) {
      query = query.eq("tenant_id", user.tenantId)
    }

    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    // If user has organization, filter by accessible organizations
    if (user.organizationId) {
      const accessibleOrgs = [user.organizationId, ...(user.subordinateOrganizationIds || [])]
      query = query.in("organization_id", accessibleOrgs)
    }

    const { data: complianceRecords, error } = await query

    if (error) {
      console.error("[API] Compliance export: Query error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API] Compliance export: Records loaded", { count: complianceRecords?.length || 0 })

    // Transform data for Excel
    const excelData = (complianceRecords || []).map((record: any) => ({
      "ID": record.id,
      "Организация": record.organization?.name || "—",
      "Код требования": record.requirement?.code || "—",
      "Требование": record.requirement?.title || "—",
      "Критичность": translateCriticality(record.requirement?.criticality),
      "Статус": translateStatus(record.status),
      "Ответственный": record.assigned_to_user?.name || record.assigned_to_user?.email || "—",
      "Дата создания": formatDate(record.created_at),
      "Дата обновления": formatDate(record.updated_at),
      "Дата завершения": record.completed_at ? formatDate(record.completed_at) : "—",
      "Комментарии": record.comments || "—",
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    ws['!cols'] = [
      { wch: 36 }, // ID
      { wch: 30 }, // Организация
      { wch: 15 }, // Код требования
      { wch: 50 }, // Требование
      { wch: 12 }, // Критичность
      { wch: 15 }, // Статус
      { wch: 25 }, // Ответственный
      { wch: 18 }, // Дата создания
      { wch: 18 }, // Дата обновления
      { wch: 18 }, // Дата завершения
      { wch: 40 }, // Комментарии
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Записи соответствия")

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    // Return file
    const filename = `compliance_records_${new Date().toISOString().split('T')[0]}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("[API] Compliance export: Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper functions
function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "not_started": "Не начато",
    "in_progress": "В процессе",
    "compliant": "Выполнено",
    "non_compliant": "Не выполнено",
    "partial": "Частично",
    "not_applicable": "Не применимо",
  }
  return statusMap[status] || status
}

function translateCriticality(criticality: string): string {
  const criticalityMap: Record<string, string> = {
    "critical": "Критическая",
    "high": "Высокая",
    "medium": "Средняя",
    "low": "Низкая",
  }
  return criticalityMap[criticality] || criticality
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

