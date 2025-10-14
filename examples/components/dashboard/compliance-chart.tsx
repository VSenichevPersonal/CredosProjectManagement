"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface ComplianceChartProps {
  completed: number
  inProgress: number
  overdue: number
  notStarted: number
}

export function ComplianceChart({ completed, inProgress, overdue, notStarted }: ComplianceChartProps) {
  const data = [
    { name: "Не начато", value: notStarted, color: "#94A3B8" },
    { name: "В работе", value: inProgress, color: "#3B82F6" },
    { name: "Выполнено", value: completed, color: "#10B981" },
    { name: "Просрочено", value: overdue, color: "#EF4444" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Распределение по статусам</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
