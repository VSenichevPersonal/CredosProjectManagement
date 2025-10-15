"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react"
import { useState } from "react"

type SalaryFundEntry = {
  id: string
  period: string
  directionName: string
  plannedAmount: number
  actualAmount: number
  difference: number
  utilizationPercent: number
}

export default function SalaryFundPage() {
  const [data, setData] = useState<SalaryFundEntry[]>([
    {
      id: "1",
      period: "2024-01",
      directionName: "Информационная безопасность",
      plannedAmount: 500000,
      actualAmount: 480000,
      difference: 20000,
      utilizationPercent: 96
    },
    {
      id: "2",
      period: "2024-01",
      directionName: "Промышленная ИБ",
      plannedAmount: 300000,
      actualAmount: 320000,
      difference: -20000,
      utilizationPercent: 106.67
    }
  ])

  const columns: ColumnDefinition<SalaryFundEntry>[] = [
    { id: "period", label: "Период", key: "period", sortable: true },
    { id: "directionName", label: "Направление", key: "directionName", sortable: true },
    { 
      id: "plannedAmount", 
      label: "План (₽)", 
      key: "plannedAmount", 
      sortable: true, 
      render: (v) => v.toLocaleString('ru')
    },
    { 
      id: "actualAmount", 
      label: "Факт (₽)", 
      key: "actualAmount", 
      sortable: true, 
      render: (v) => v.toLocaleString('ru')
    },
    { 
      id: "difference", 
      label: "Разница (₽)", 
      key: "difference", 
      sortable: true, 
      render: (v) => (
        <span className={v >= 0 ? "text-green-600" : "text-red-600"}>
          {v >= 0 ? '+' : ''}{v.toLocaleString('ru')}
        </span>
      )
    },
    { 
      id: "utilizationPercent", 
      label: "Использование (%)", 
      key: "utilizationPercent", 
      sortable: true, 
      render: (v) => (
        <span className={v > 100 ? "text-red-600" : v > 90 ? "text-orange-600" : "text-green-600"}>
          {v.toFixed(1)}%
        </span>
      )
    },
  ]

  // Calculate totals
  const totalPlanned = data.reduce((sum, item) => sum + item.plannedAmount, 0)
  const totalActual = data.reduce((sum, item) => sum + item.actualAmount, 0)
  const totalDifference = totalPlanned - totalActual
  const avgUtilization = data.length > 0 
    ? data.reduce((sum, item) => sum + item.utilizationPercent, 0) / data.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Фонд заработной платы</h1>
        <p className="text-gray-600 mt-1">Планирование и контроль ФЗП по направлениям</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">План ФЗП</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlanned.toLocaleString('ru')} ₽</div>
            <p className="text-xs text-muted-foreground">Плановый ФЗП на период</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Факт ФЗП</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActual.toLocaleString('ru')} ₽</div>
            <p className="text-xs text-muted-foreground">Фактические выплаты</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Экономия/Перерасход</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalDifference >= 0 ? '+' : ''}{totalDifference.toLocaleString('ru')} ₽
            </div>
            <p className="text-xs text-muted-foreground">
              {totalDifference >= 0 ? 'Экономия бюджета' : 'Перерасход бюджета'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Средняя загрузка</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgUtilization > 100 ? 'text-red-600' : avgUtilization > 90 ? 'text-orange-600' : 'text-green-600'}`}>
              {avgUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Использование ФЗП</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <UniversalDataTable
        title="Детализация ФЗП по направлениям"
        description="Сравнение плановых и фактических показателей"
        icon={DollarSign}
        data={data}
        columns={columns}
        canExport
        exportFilename="salary-fund"
      />

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            О фонде заработной платы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Фонд заработной платы помогает планировать и контролировать расходы на персонал по направлениям. 
            Система автоматически сравнивает плановые и фактические показатели, выявляя отклонения и помогая 
            принимать управленческие решения.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

