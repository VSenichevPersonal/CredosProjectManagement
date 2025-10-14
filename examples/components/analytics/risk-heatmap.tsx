"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface RiskHeatmapProps {
  risks: any[]
  organizations: any[]
}

export function RiskHeatmap({ risks, organizations }: RiskHeatmapProps) {
  const riskCategories = ["Технический", "Комплаенс", "Организационный", "Финансовый", "Репутационный"]

  const getOrganizationRisks = (orgId: string, category: string) => {
    return risks.filter((r) => r.organization_id === orgId && r.category?.name === category)
  }

  const getRiskColor = (count: number) => {
    if (count === 0) return "bg-green-100"
    if (count <= 2) return "bg-yellow-100"
    if (count <= 5) return "bg-orange-100"
    return "bg-red-100"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тепловая карта рисков</CardTitle>
        <CardDescription>Распределение рисков по организациям и категориям</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-2 bg-muted text-left font-medium">Организация</th>
                {riskCategories.map((category) => (
                  <th key={category} className="border p-2 bg-muted text-center font-medium">
                    {category}
                  </th>
                ))}
                <th className="border p-2 bg-muted text-center font-medium">Всего</th>
              </tr>
            </thead>
            <tbody>
              {organizations.slice(0, 10).map((org) => {
                const orgRisks = risks.filter((r) => r.organization_id === org.id)
                return (
                  <tr key={org.id}>
                    <td className="border p-2 font-medium">{org.name}</td>
                    {riskCategories.map((category) => {
                      const categoryRisks = getOrganizationRisks(org.id, category)
                      return (
                        <td key={category} className={`border p-2 text-center ${getRiskColor(categoryRisks.length)}`}>
                          {categoryRisks.length}
                        </td>
                      )
                    })}
                    <td className="border p-2 text-center font-bold">{orgRisks.length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border" />
            <span>0 рисков</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border" />
            <span>1-2 риска</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border" />
            <span>3-5 рисков</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border" />
            <span>6+ рисков</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
