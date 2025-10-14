"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Circle, CheckCircle2, Clock } from "lucide-react"
import type { ComplianceStatus } from "@/types/domain/compliance"
import { COMPLIANCE_STATUS_CONFIG } from "@/lib/workflow/compliance-workflow"

interface WorkflowTimelineProps {
  currentStatus: ComplianceStatus
  history?: Array<{
    status: ComplianceStatus
    timestamp: Date
    user?: string
    comment?: string
  }>
}

const WORKFLOW_STAGES: ComplianceStatus[] = ["not_started", "in_progress", "pending_review", "approved"]

export function WorkflowTimeline({ currentStatus, history = [] }: WorkflowTimelineProps) {
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStatus)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Прогресс выполнения</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div
            className="absolute left-4 top-0 w-0.5 bg-primary transition-all duration-500"
            style={{
              height: currentIndex >= 0 ? `${(currentIndex / (WORKFLOW_STAGES.length - 1)) * 100}%` : "0%",
            }}
          />

          {/* Stages */}
          <div className="space-y-6">
            {WORKFLOW_STAGES.map((stage, index) => {
              const config = COMPLIANCE_STATUS_CONFIG[stage]
              const isPast = index < currentIndex
              const isCurrent = index === currentIndex
              const isFuture = index > currentIndex

              return (
                <div key={stage} className="relative flex items-start gap-4 pl-10">
                  {/* Icon */}
                  <div className="absolute left-0 flex items-center justify-center">
                    {isPast ? (
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    ) : isCurrent ? (
                      <Clock className="h-8 w-8 text-primary animate-pulse" />
                    ) : (
                      <Circle className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-semibold ${isCurrent ? "text-primary" : isFuture ? "text-muted-foreground" : ""}`}
                      >
                        {config.label}
                      </h4>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          Текущий
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>

                    {/* History for this stage */}
                    {history
                      .filter((h) => h.status === stage)
                      .map((h, i) => (
                        <div key={i} className="mt-2 p-2 bg-muted rounded-md text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{h.user || "Система"}</span>
                            <span className="text-muted-foreground">
                              {new Date(h.timestamp).toLocaleString("ru-RU")}
                            </span>
                          </div>
                          {h.comment && <p className="text-muted-foreground">{h.comment}</p>}
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
