"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface OrganizationComparisonChartProps {
  organizations: any[]
  compliance: any[]
}

export function OrganizationComparisonChart({ organizations, compliance }: OrganizationComparisonChartProps) {
  const comparisonData = organizations.slice(0, 10).map((org) => {
    const orgCompliance = compliance.filter((c) => c.organization_id === org.id)
    const completed = orgCompliance.filter((c) => c.status === "compliant").length
    const inProgress = orgCompliance.filter((c) => c.status === "in_progress").length
    const notStarted = orgCompliance.filter((c) => c.status === "not_started" || c.status === "non_compliant").length

    return {
      name: org.name.length > 20 ? org.name.substring(0, 20) + "..." : org.name,
      completed,
      inProgress,
      notStarted,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сравнение организаций</CardTitle>
        <CardDescription>Распределение статусов выполнения по организациям</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#22aa7d" name="Выполнено" />
            <Bar dataKey="inProgress" fill="#0095b1" name="В работе" />
            <Bar dataKey="notStarted" fill="#94a3b8" name="Не начато" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
