"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/cn"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RequirementCode } from "@/components/ui/requirement-code"
import { CriticalityBadge } from "@/components/ui/criticality-badge"

interface HeatmapData {
  requirements: Array<{
    id: string
    code: string
    title: string
    regulator_id: string
    criticality: string // Fixed: criticality_level → criticality
  }>
  organizations: Array<{
    id: string
    name: string
    type_id: string // Fixed: organization_type_id → type_id
    organization_types?: {
      code: string
      name: string
    }
  }>
  matrix: Record<string, Record<string, string>>
}

interface ComplianceHeatmapProps {
  data: HeatmapData
}

const STATUS_COLORS = {
  not_assigned: "bg-gray-100 hover:bg-gray-200",
  not_started: "bg-red-100 hover:bg-red-200 border-red-300",
  in_progress: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300",
  pending_review: "bg-blue-100 hover:bg-blue-200 border-blue-300",
  approved: "bg-green-100 hover:bg-green-200 border-green-300",
  rejected: "bg-orange-100 hover:bg-orange-200 border-orange-300",
  overdue: "bg-red-200 hover:bg-red-300 border-red-400",
}

const STATUS_LABELS = {
  not_assigned: "Не назначено",
  not_started: "Не начато",
  in_progress: "В работе",
  pending_review: "На проверке",
  approved: "Утверждено",
  rejected: "Отклонено",
  overdue: "Просрочено",
}

export function ComplianceHeatmap({ data }: ComplianceHeatmapProps) {
  const [regulatorFilter, setRegulatorFilter] = useState<string>("all")
  const [criticalityFilter, setCriticalityFilter] = useState<string>("all")
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>("all")

  const filteredData = useMemo(() => {
    let filteredReqs = data.requirements
    let filteredOrgs = data.organizations

    if (regulatorFilter !== "all") {
      filteredReqs = filteredReqs.filter((req) => req.regulator_id === regulatorFilter)
    }

    if (criticalityFilter !== "all") {
      filteredReqs = filteredReqs.filter((req) => req.criticality === criticalityFilter)
    }

    if (orgTypeFilter !== "all") {
      filteredOrgs = filteredOrgs.filter((org) => org.organization_types?.code === orgTypeFilter)
    }

    return { requirements: filteredReqs, organizations: filteredOrgs }
  }, [data, regulatorFilter, criticalityFilter, orgTypeFilter])

  const regulators = useMemo(() => {
    const unique = new Set(data.requirements.map((r) => r.regulator_id))
    return Array.from(unique).filter(Boolean)
  }, [data.requirements])

  const orgTypes = useMemo(() => {
    const unique = new Set(data.organizations.map((o) => o.organization_types?.code).filter(Boolean))
    return Array.from(unique)
  }, [data.organizations])

  const stats = useMemo(() => {
    const total = filteredData.requirements.length * filteredData.organizations.length
    const statusCounts: Record<string, number> = {}

    filteredData.requirements.forEach((req) => {
      filteredData.organizations.forEach((org) => {
        const status = data.matrix[req.id]?.[org.id] || "not_assigned"
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
    })

    return { total, statusCounts }
  }, [filteredData, data.matrix])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Регулятор</Label>
            <Select value={regulatorFilter} onValueChange={setRegulatorFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все регуляторы</SelectItem>
                {regulators.map((reg) => (
                  <SelectItem key={reg} value={reg}>
                    {reg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Критичность</Label>
            <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                <SelectItem value="critical">Критическая</SelectItem>
                <SelectItem value="high">Высокая</SelectItem>
                <SelectItem value="medium">Средняя</SelectItem>
                <SelectItem value="low">Низкая</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Тип организации</Label>
            <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {orgTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(stats.statusCounts).map(([status, count]) => {
          const percentage = ((count / stats.total) * 100).toFixed(1)
          return (
            <Card key={status} className="p-3">
              <div className="text-xs text-muted-foreground mb-1">
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </div>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs text-muted-foreground">{percentage}%</div>
            </Card>
          )
        })}
      </div>

      {/* Heatmap */}
      <Card className="p-4 overflow-auto">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-background border border-border p-2 text-left min-w-[200px]">
                  <div className="font-semibold text-sm">Требование</div>
                </th>
                {filteredData.organizations.map((org) => (
                  <th key={org.id} className="border border-border p-2 min-w-[120px]">
                    <div className="text-xs font-medium text-center truncate" title={org.name}>
                      {org.name}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {org.organization_types?.name || org.organization_types?.code}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.requirements.map((req) => (
                <tr key={req.id}>
                  <td className="sticky left-0 z-10 bg-background border border-border p-2">
                    <div className="flex items-center gap-2">
                      <RequirementCode code={req.code} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" title={req.title}>
                          {req.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <CriticalityBadge level={req.criticality} />
                          <span className="text-xs text-muted-foreground">{req.regulator_id}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  {filteredData.organizations.map((org) => {
                    const status = data.matrix[req.id]?.[org.id] || "not_assigned"
                    return (
                      <td key={org.id} className="border border-border p-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "h-12 w-full rounded border cursor-pointer transition-colors",
                                  STATUS_COLORS[status as keyof typeof STATUS_COLORS],
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div className="font-semibold">
                                  {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                                </div>
                                <div className="text-muted-foreground mt-1">{req.code}</div>
                                <div className="text-muted-foreground">{org.name}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Легенда</div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={cn("h-4 w-4 rounded border", STATUS_COLORS[status as keyof typeof STATUS_COLORS])} />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
