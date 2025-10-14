"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface TrendChartProps {
  data: Array<{
    month: string
    completed: number
    inProgress: number
    notStarted: number
  }>
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тренд выполнения</CardTitle>
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
        <CardTitle>Тренд выполнения</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Выполнено" />
            <Line type="monotone" dataKey="inProgress" stroke="#3B82F6" strokeWidth={2} name="В работе" />
            <Line type="monotone" dataKey="notStarted" stroke="#94A3B8" strokeWidth={2} name="Не начато" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
