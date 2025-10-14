"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react"

interface ReportGeneratorProps {
  organizations?: Array<{ id: string; name: string }>
}

export function ReportGenerator({ organizations = [] }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<string>("compliance-summary")
  const [organizationId, setOrganizationId] = useState<string>("all")
  const [regulator, setRegulator] = useState<string>("all")

  const handleGenerateReport = async (format: "json" | "csv") => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (organizationId !== "all") params.append("organizationId", organizationId)
      if (regulator !== "all") params.append("regulator", regulator)
      if (format === "csv") params.append("format", "csv")

      const endpoint =
        reportType === "executive-summary" ? "/api/reports/executive-summary" : "/api/reports/compliance-summary"

      const response = await fetch(`${endpoint}?${params.toString()}`)

      if (!response.ok) throw new Error("Failed to generate report")

      if (format === "csv") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("[v0] Failed to generate report:", error)
      alert("Не удалось сгенерировать отчет")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Генератор отчетов</h3>
          <p className="text-sm text-muted-foreground">
            Создайте детальные отчеты по комплаенсу для регуляторов и руководства
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col gap-2">
            <Label>Тип отчета</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compliance-summary">Детальный отчет по комплаенсу</SelectItem>
                <SelectItem value="executive-summary">Executive Summary (для руководства)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "compliance-summary" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Организация</Label>
                <Select value={organizationId} onValueChange={setOrganizationId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все организации</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Регулятор</Label>
                <Select value={regulator} onValueChange={setRegulator}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все регуляторы</SelectItem>
                    <SelectItem value="ФСТЭК">ФСТЭК</SelectItem>
                    <SelectItem value="Роскомнадзор">Роскомнадзор</SelectItem>
                    <SelectItem value="ФСБ">ФСБ</SelectItem>
                    <SelectItem value="Минцифры">Минцифры</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={() => handleGenerateReport("json")} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Скачать JSON
          </Button>
          <Button onClick={() => handleGenerateReport("csv")} disabled={loading} variant="outline" className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Скачать Excel (CSV)
          </Button>
        </div>
      </div>
    </Card>
  )
}
