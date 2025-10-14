"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, LinkIcon, FileText } from "lucide-react"
import { ControlTypeBadge } from "./control-type-badge"
import { ControlFrequencyBadge } from "./control-frequency-badge"
import type { Control } from "@/types/domain/control"
import { useState } from "react"
import { ControlDetailDialog } from "./control-detail-dialog"

interface ControlCardProps {
  control: Control
  onUpdate: () => void
}

export function ControlCard({ control, onUpdate }: ControlCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <>
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">{control.code}</span>
              <ControlTypeBadge type={control.type} />
            </div>
            <h3 className="font-semibold leading-tight">{control.title}</h3>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{control.description}</p>

        <div className="flex items-center gap-2">
          <ControlFrequencyBadge frequency={control.frequency} />
          {control.isAutomated && (
            <Badge variant="outline" className="text-xs">
              Автоматизирован
            </Badge>
          )}
        </div>

        {control.owner && <div className="text-xs text-muted-foreground">Ответственный: {control.owner}</div>}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              <span>{control.mappedRequirements || 0} требований</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{control.evidenceCount || 0} доказательств</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDetailOpen(true)}>
            Подробнее
          </Button>
        </div>
      </Card>

      <ControlDetailDialog controlId={control.id} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  )
}
