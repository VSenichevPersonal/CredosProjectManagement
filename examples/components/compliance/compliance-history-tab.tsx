"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Circle, FileText, Upload, MessageSquare, CheckCircle2, Download } from "lucide-react"

interface HistoryEvent {
  id: string
  eventType: string
  description: string
  user: {
    fullName: string
    email: string
  }
  createdAt: string
  metadata?: any
}

interface ComplianceHistoryTabProps {
  complianceId: string
}

const eventTypeConfig = {
  status_change: { label: "Изменение статуса", icon: Circle, color: "blue" },
  evidence_added: { label: "Добавлено доказательство", icon: Upload, color: "green" },
  measure_updated: { label: "Обновлена мера", icon: FileText, color: "yellow" },
  comment_added: { label: "Добавлен комментарий", icon: MessageSquare, color: "gray" },
  approved: { label: "Одобрено", icon: CheckCircle2, color: "green" },
}

export function ComplianceHistoryTab({ complianceId }: ComplianceHistoryTabProps) {
  const [history, setHistory] = useState<HistoryEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState<string>("all")

  const fetchHistory = async () => {
    try {
      // Используем audit_log вместо старой compliance_history
      const response = await fetch(`/api/audit?resourceType=compliance&resourceId=${complianceId}`)
      const data = await response.json()
      
      // Преобразуем audit записи в события истории
      const events = (data.data || []).map((audit: any) => ({
        id: audit.id,
        eventType: mapAuditActionToEventType(audit.action),
        description: getEventDescription(audit),
        user: {
          fullName: audit.user?.name || "Система",
          email: audit.user?.email || "",
        },
        createdAt: audit.created_at,
        metadata: audit.metadata,
      }))
      
      setHistory(events)
    } catch (error) {
      console.error("[v0] Failed to fetch history:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const mapAuditActionToEventType = (action: string) => {
    if (action.includes("status")) return "status_change"
    if (action.includes("evidence")) return "evidence_added"
    if (action.includes("measure")) return "measure_updated"
    if (action.includes("comment")) return "comment_added"
    if (action.includes("approved")) return "approved"
    return "other"
  }
  
  const getEventDescription = (audit: any) => {
    const actionLabels: Record<string, string> = {
      "compliance_created": "Запись соответствия создана",
      "compliance_updated": "Запись соответствия обновлена",
      "compliance_status_changed": `Статус изменён на "${audit.metadata?.newStatus || 'unknown'}"`,
      "evidence_created": "Добавлено доказательство",
      "evidence_linked": "Доказательство привязано к мере",
      "control_measure_created": "Создана мера контроля",
      "control_measure_status_updated": "Статус меры обновлён",
    }
    return actionLabels[audit.action] || audit.action
  }

  useEffect(() => {
    fetchHistory()
  }, [complianceId])

  const filteredHistory = history.filter((h) => eventFilter === "all" || h.eventType === eventFilter)

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>История изменений</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Фильтр по типу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все события</SelectItem>
                <SelectItem value="status_change">Изменения статуса</SelectItem>
                <SelectItem value="evidence_added">Доказательства</SelectItem>
                <SelectItem value="measure_updated">Меры</SelectItem>
                <SelectItem value="comment_added">Комментарии</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Экспорт в PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>История изменений пуста</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {filteredHistory.map((event) => {
                const config = eventTypeConfig[event.eventType as keyof typeof eventTypeConfig] || {
                  label: event.eventType,
                  icon: Circle,
                  color: "gray",
                }
                const EventIcon = config.icon

                return (
                  <div key={event.id} className="relative flex items-start gap-4 pl-10">
                    <div className="absolute left-0 flex items-center justify-center">
                      <div className={`bg-${config.color}-100 rounded-full p-2`}>
                        <EventIcon className={`h-4 w-4 text-${config.color}-600`} />
                      </div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString("ru-RU")}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.user.fullName} ({event.user.email})
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
