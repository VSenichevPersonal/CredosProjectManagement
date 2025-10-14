"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface RequirementCategoryChartProps {
  requirements: any[]
  compliance: any[]
}

export function RequirementCategoryChart({ requirements, compliance }: RequirementCategoryChartProps) {
  const categories = ["КИИ", "ПДн", "ГИС", "Криптография", "Общее"]
  const COLORS = ["#22aa7d", "#0095b1", "#0ea5e9", "#8b5cf6", "#f59e0b"]

  const categoryData = categories.map((category, index) => {
    const categoryReqs = requirements.filter((r) => r.category === category)
    const categoryCompliance = compliance.filter((c) =>
      categoryReqs.some((r) => r.id === c.requirement_id && c.status === "compliant"),
    )
    const completionRate =
      categoryReqs.length > 0 ? Math.round((categoryCompliance.length / categoryReqs.length) * 100) : 0

    return {
      name: category,
      value: completionRate,
      count: categoryReqs.length,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Выполнение по категориям</CardTitle>
        <CardDescription>Процент выполнения требований по категориям регуляторов</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
