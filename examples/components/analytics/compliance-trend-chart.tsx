"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ComplianceTrendChartProps {
  trendData: Array<{
    month: string
    completed: number
    inProgress: number
    notStarted: number
  }>
}

export function ComplianceTrendChart({ trendData }: ComplianceTrendChartProps) {
  if (!trendData || trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Динамика выполнения требований</CardTitle>
          <CardDescription>Изменение статусов выполнения за последние 6 месяцев</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Нет данных для отображения
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Динамика выполнения требований</CardTitle>
        <CardDescription>Изменение статусов выполнения за последние 6 месяцев</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="completed" stroke="#22aa7d" strokeWidth={2} name="Выполнено" />
            <Line type="monotone" dataKey="inProgress" stroke="#0095b1" strokeWidth={2} name="В работе" />
            <Line type="monotone" dataKey="notStarted" stroke="#94a3b8" strokeWidth={2} name="Не начато" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
