"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Risk {
  id: string
  title: string
  description: string | null
  risk_level: string
  risk_score: number
  status: string
  organization?: { name: string }
  category?: { name: string; color: string }
  owner?: { full_name: string }
}

interface RiskListProps {
  risks: Risk[]
}

export function RiskList({ risks }: RiskListProps) {
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    }
    return colors[level] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      identified: "Выявлен",
      assessed: "Оценен",
      mitigating: "Снижается",
      accepted: "Принят",
      closed: "Закрыт",
    }
    return labels[status] || status
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Список рисков</CardTitle>
      </CardHeader>
      <CardContent>
        {risks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Риски не найдены. Добавьте первый риск для начала работы.
          </p>
        ) : (
          <div className="space-y-4">
            {risks.map((risk) => (
              <div key={risk.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{risk.title}</h3>
                      <Badge className={getLevelColor(risk.risk_level)}>{risk.risk_level.toUpperCase()}</Badge>
                      <Badge variant="outline">{getStatusLabel(risk.status)}</Badge>
                    </div>
                    {risk.description && <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {risk.organization && <span>Организация: {risk.organization.name}</span>}
                      {risk.category && (
                        <span className="flex items-center gap-1">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: risk.category.color || "#gray" }}
                          />
                          {risk.category.name}
                        </span>
                      )}
                      {risk.owner && <span>Ответственный: {risk.owner.full_name}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{risk.risk_score}</div>
                    <div className="text-xs text-muted-foreground">Оценка риска</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
