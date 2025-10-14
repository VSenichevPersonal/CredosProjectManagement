"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ComplianceByRegulatorChartProps {
  compliance: any[]
}

export function ComplianceByRegulatorChart({ compliance }: ComplianceByRegulatorChartProps) {
  const regulators = ["ФСТЭК", "Роскомнадзор", "ФСБ", "Минцифры"]

  const regulatorData = regulators.map((regulator) => {
    const regulatorCompliance = compliance.filter((c) => c.requirement?.regulator === regulator)
    const completed = regulatorCompliance.filter((c) => c.status === "compliant").length
    const total = regulatorCompliance.length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      name: regulator,
      rate,
      completed,
      total,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Выполнение по регуляторам</CardTitle>
        <CardDescription>Процент выполнения требований различных регуляторов</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={regulatorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="rate" fill="#22aa7d" name="Процент выполнения (%)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
