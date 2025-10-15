"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import { TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react"

type ProjectProfitability = {
  projectId: string
  projectName: string
  revenue: number
  salaryCost: number
  extraCost: number
  totalCost: number
  margin: number
  marginPercent: number
  roi: number
}

export default function ProfitabilityDashboard() {
  // Mock data
  const data: ProjectProfitability[] = [
    {
      projectId: "1",
      projectName: "Проект А",
      revenue: 1000000,
      salaryCost: 600000,
      extraCost: 50000,
      totalCost: 650000,
      margin: 350000,
      marginPercent: 35,
      roi: 53.85
    }
  ]

  const columns: ColumnDefinition<ProjectProfitability>[] = [
    { id: "projectName", label: "Проект", key: "projectName", sortable: true },
    { id: "revenue", label: "Доходы (₽)", key: "revenue", sortable: true, render: (v) => v.toLocaleString('ru') },
    { id: "salaryCost", label: "ЗП (₽)", key: "salaryCost", sortable: true, render: (v) => v.toLocaleString('ru') },
    { id: "totalCost", label: "Всего затрат (₽)", key: "totalCost", sortable: true, render: (v) => v.toLocaleString('ru') },
    { id: "margin", label: "Маржа (₽)", key: "margin", sortable: true, render: (v) => <span className={v >= 0 ? "text-green-600" : "text-red-600"}>{v.toLocaleString('ru')}</span> },
    { id: "marginPercent", label: "Маржинальность (%)", key: "marginPercent", sortable: true, render: (v) => `${v.toFixed(1)}%` },
    { id: "roi", label: "ROI (%)", key: "roi", sortable: true, render: (v) => `${v.toFixed(1)}%` },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 000 000 ₽</div>
            <p className="text-xs text-muted-foreground">+20.1% от прошлого месяца</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Затраты на ЗП</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">600 000 ₽</div>
            <p className="text-xs text-muted-foreground">+10% от прошлого месяца</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Маржа</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">350 000 ₽</div>
            <p className="text-xs text-muted-foreground">35% маржинальность</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">53.8%</div>
            <p className="text-xs text-muted-foreground">Рентабельность инвестиций</p>
          </CardContent>
        </Card>
      </div>

      <UniversalDataTable
        title="Рентабельность проектов"
        description="Финансовые показатели по проектам"
        icon={BarChart3}
        data={data}
        columns={columns}
        canExport
        exportFilename="profitability"
      />
    </div>
  )
}

