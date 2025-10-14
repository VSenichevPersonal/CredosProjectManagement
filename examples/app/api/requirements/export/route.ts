/**
 * API Route: Export requirements to Excel
 * 
 * GET /api/requirements/export
 * Query params:
 * - category (optional) - filter by category
 * - criticality (optional) - filter by criticality
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

    console.log("[API] Requirements export: Starting", { userId: user.id, tenantId: user.tenantId })

    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const criticality = searchParams.get("criticality")
    const status = searchParams.get("status")

    // Build query
    let query = supabase
      .from("requirements")
      .select(`
        *,
        regulatory_framework:regulatory_frameworks(id, name, code),
        category:categories(id, name),
        created_by_user:users!requirements_created_by_fkey(id, name, email)
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (user.tenantId) {
      query = query.eq("tenant_id", user.tenantId)
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (criticality) {
      query = query.eq("criticality", criticality)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: requirements, error } = await query

    if (error) {
      console.error("[API] Requirements export: Query error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API] Requirements export: Requirements loaded", { count: requirements?.length || 0 })

    // Get compliance stats for each requirement
    const { data: complianceRecords } = await supabase
      .from("compliance_records")
      .select("requirement_id, status")
      .eq("tenant_id", user.tenantId || "")

    // Calculate stats
    const complianceStats = (complianceRecords || []).reduce((acc: any, record: any) => {
      if (!acc[record.requirement_id]) {
        acc[record.requirement_id] = { total: 0, compliant: 0, in_progress: 0, non_compliant: 0 }
      }
      acc[record.requirement_id].total++
      if (record.status === "compliant") acc[record.requirement_id].compliant++
      if (record.status === "in_progress") acc[record.requirement_id].in_progress++
      if (record.status === "non_compliant") acc[record.requirement_id].non_compliant++
      return acc
    }, {})

    // Transform data for Excel
    const excelData = (requirements || []).map((req: any) => {
      const stats = complianceStats[req.id] || { total: 0, compliant: 0, in_progress: 0, non_compliant: 0 }
      const completionRate = stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0

      return {
        "ID": req.id,
        "Код": req.code || "—",
        "Название": req.title || "—",
        "Описание": req.description || "—",
        "Нормативная база": req.regulatory_framework?.name || "—",
        "Категория": req.category?.name || req.category || "—",
        "Критичность": translateCriticality(req.criticality),
        "Статус": translateStatus(req.status),
        "Режим мер": translateMeasureMode(req.measure_mode),
        "Всего назначений": stats.total,
        "Выполнено": stats.compliant,
        "В процессе": stats.in_progress,
        "Не выполнено": stats.non_compliant,
        "% выполнения": `${completionRate}%`,
        "Создано": req.created_by_user?.name || req.created_by_user?.email || "—",
        "Дата создания": formatDate(req.created_at),
      }
    })

    // Create workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    ws['!cols'] = [
      { wch: 36 }, // ID
      { wch: 15 }, // Код
      { wch: 50 }, // Название
      { wch: 60 }, // Описание
      { wch: 30 }, // Нормативная база
      { wch: 20 }, // Категория
      { wch: 12 }, // Критичность
      { wch: 12 }, // Статус
      { wch: 12 }, // Режим мер
      { wch: 12 }, // Всего назначений
      { wch: 10 }, // Выполнено
      { wch: 12 }, // В процессе
      { wch: 12 }, // Не выполнено
      { wch: 12 }, // % выполнения
      { wch: 25 }, // Создано
      { wch: 18 }, // Дата создания
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Требования")

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    // Return file
    const filename = `requirements_${new Date().toISOString().split('T')[0]}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("[API] Requirements export: Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper functions
function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "draft": "Черновик",
    "active": "Активно",
    "archived": "Архивировано",
    "deprecated": "Устарело",
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

function translateMeasureMode(mode: string): string {
  const modeMap: Record<string, string> = {
    "strict": "Жёсткий",
    "flexible": "Гибкий",
  }
  return modeMap[mode] || mode
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

