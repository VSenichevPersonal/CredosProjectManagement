"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, FileCheck, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ComplianceRecord {
  id: string
  requirement: {
    id: string
    code: string
    title: string
  }
  status: string
  assignedTo: string | null
  dueDate: string | null
  updatedAt: string
}

interface OrganizationComplianceTabProps {
  organizationId: string
}

export function OrganizationComplianceTab({ organizationId }: OrganizationComplianceTabProps) {
  const [records, setRecords] = useState<ComplianceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadComplianceRecords()
  }, [organizationId])

  const loadComplianceRecords = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/organizations/${organizationId}/compliance`)

      if (!response.ok) {
        throw new Error("Failed to load compliance records")
      }

      const data = await response.json()
      setRecords(data.data || [])
    } catch (error) {
      console.error("Failed to load compliance records:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить записи соответствия",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Ожидает", className: "bg-yellow-500" },
      in_progress: { label: "В процессе", className: "bg-blue-500" },
      compliant: { label: "Соответствует", className: "bg-green-500" },
      non_compliant: { label: "Не соответствует", className: "bg-red-500" },
      partial: { label: "Частично", className: "bg-orange-500" },
      not_applicable: { label: "Не применимо", className: "bg-gray-500" },
    }

    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Нет записей соответствия</h3>
        <p className="text-sm text-muted-foreground">
          Для этой организации еще не созданы записи соответствия требованиям
        </p>
      </div>
    )
  }

  const stats = {
    total: records.length,
    compliant: records.filter((r) => r.status === "compliant").length,
    inProgress: records.filter((r) => r.status === "in_progress").length,
    pending: records.filter((r) => r.status === "pending").length,
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего записей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Соответствует</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.compliant}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0}% от общего числа
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">В процессе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ожидает</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Записи соответствия</CardTitle>
          <CardDescription>Список записей соответствия требованиям для организации</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{record.requirement.code}</code>
                    {getStatusBadge(record.status)}
                  </div>
                  <p className="text-sm font-medium">{record.requirement.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Обновлено: {new Date(record.updatedAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.push(`/compliance/${record.id}`)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
