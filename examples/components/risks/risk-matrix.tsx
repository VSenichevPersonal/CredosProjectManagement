"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Risk {
  id: string
  title: string
  likelihood: string
  impact: string
  risk_level: string
}

interface RiskMatrixProps {
  risks: Risk[]
}

export function RiskMatrix({ risks }: RiskMatrixProps) {
  const likelihoodLevels = ["very_high", "high", "medium", "low", "very_low"]
  const impactLevels = ["very_low", "low", "medium", "high", "very_high"]

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      very_low: "Очень низкий",
      low: "Низкий",
      medium: "Средний",
      high: "Высокий",
      very_high: "Очень высокий",
    }
    return labels[level] || level
  }

  const getCellColor = (likelihood: string, impact: string) => {
    const likelihoodValue = likelihoodLevels.indexOf(likelihood) + 1
    const impactValue = impactLevels.indexOf(impact) + 1
    const score = likelihoodValue * impactValue

    if (score <= 4) return "bg-green-100 hover:bg-green-200"
    if (score <= 9) return "bg-yellow-100 hover:bg-yellow-200"
    if (score <= 16) return "bg-orange-100 hover:bg-orange-200"
    return "bg-red-100 hover:bg-red-200"
  }

  const getRisksInCell = (likelihood: string, impact: string) => {
    return risks.filter((r) => r.likelihood === likelihood && r.impact === impact)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Матрица рисков</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted text-sm font-medium">Вероятность / Влияние</th>
                {impactLevels.map((impact) => (
                  <th key={impact} className="border p-2 bg-muted text-sm font-medium">
                    {getLevelLabel(impact)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {likelihoodLevels.map((likelihood) => (
                <tr key={likelihood}>
                  <td className="border p-2 bg-muted text-sm font-medium">{getLevelLabel(likelihood)}</td>
                  {impactLevels.map((impact) => {
                    const cellRisks = getRisksInCell(likelihood, impact)
                    return (
                      <td
                        key={`${likelihood}-${impact}`}
                        className={`border p-2 text-center cursor-pointer transition-colors ${getCellColor(likelihood, impact)}`}
                      >
                        <div className="text-lg font-bold">{cellRisks.length}</div>
                        {cellRisks.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {cellRisks
                              .slice(0, 2)
                              .map((r) => r.title.substring(0, 20))
                              .join(", ")}
                            {cellRisks.length > 2 && "..."}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border" />
            <span>Низкий (1-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border" />
            <span>Средний (5-9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border" />
            <span>Высокий (10-16)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border" />
            <span>Критический (17-25)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
