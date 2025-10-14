"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ComplianceTable } from "@/components/compliance/compliance-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { ComplianceRecord } from "@/types/domain/compliance"

export function MyComplianceRecordsClient() {
  const router = useRouter()
  const [records, setRecords] = useState<ComplianceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRecords()
  }, [page, statusFilter, search])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      if (search) {
        params.append("search", search)
      }

      const response = await fetch(`/api/my-compliance-records?${params}`)
      if (!response.ok) throw new Error("Failed to fetch records")

      const data = await response.json()
      setRecords(data.items || [])
      setTotalPages(Math.ceil((data.total || 0) / 20))
    } catch (error) {
      console.error("[v0] Failed to fetch my compliance records:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (record: ComplianceRecord) => {
    router.push(`/compliance/${record.id}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по требованиям..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="pending_review">На проверке</SelectItem>
            <SelectItem value="approved">Одобрено</SelectItem>
            <SelectItem value="rejected">Отклонено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium">Нет записей соответствия</p>
          <p className="text-sm text-muted-foreground mt-2">На вас не назначено ни одной записи соответствия</p>
        </div>
      ) : (
        <>
          <ComplianceTable data={records} onRowClick={handleRowClick} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Назад
              </button>
              <span className="text-sm text-muted-foreground">
                Страница {page} из {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
