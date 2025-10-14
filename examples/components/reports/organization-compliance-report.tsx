"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, Loader2 } from "lucide-react"
import type { OrganizationComplianceReportType } from "@/types/domain/report"

interface Props {
  organizations: Array<{ id: string; name: string }>
}

export function OrganizationComplianceReport({ organizations }: Props) {
  const [selectedOrg, setSelectedOrg] = useState<string>("")
  const [report, setReport] = useState<OrganizationComplianceReportType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async () => {
    if (!selectedOrg) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reports/organization-compliance?organizationId=${selectedOrg}`)

      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      const data = await response.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    // TODO: Implement Excel export
    console.log("Export to Excel")
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Отчет по требованиям кибербезопасности</h2>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Выберите организацию</label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите организацию" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateReport} disabled={!selectedOrg || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Сгенерировать отчет
              </>
            )}
          </Button>
        </div>

        {error && <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      </Card>

      {report && (
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold">{report.organization.name}</h3>
              <p className="text-sm text-muted-foreground">
                Тип: {report.organization.type_name} • Сгенерирован:{" "}
                {new Date(report.generatedAt).toLocaleString("ru-RU")}
              </p>
            </div>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт в Excel
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">№</TableHead>
                  <TableHead>Требования по кибербезопасности</TableHead>
                  <TableHead className="w-32">Ответ</TableHead>
                  <TableHead>Комментарии</TableHead>
                  <TableHead>Статьи законодательства</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.requirements.map((row) => (
                  <TableRow key={row.requirement.id}>
                    <TableCell className="font-medium">{row.number}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.requirement.title}</div>
                      {row.requirement.description && (
                        <div className="text-sm text-muted-foreground mt-1">{row.requirement.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          row.compliance.answer === "Да"
                            ? "bg-green-100 text-green-800"
                            : row.compliance.answer === "Неприменимо"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.compliance.answer}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.compliance.notes && <div className="text-sm">{row.compliance.notes}</div>}
                      {row.evidence.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Доказательства: {row.evidence.map((e) => e.title).join(", ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.legalReferences.length > 0 ? (
                        <div className="text-sm space-y-1">
                          {row.legalReferences.map((ref) => (
                            <div key={ref.id} className={ref.is_primary ? "font-medium" : ""}>
                              {ref.full_reference}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
