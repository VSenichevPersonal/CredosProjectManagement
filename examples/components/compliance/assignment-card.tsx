"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AssignUserDialog } from "./assign-user-dialog"
import { SetDeadlineDialog } from "./set-deadline-dialog"
import { User, Calendar, AlertCircle, Clock } from "lucide-react"

interface AssignmentCardProps {
  complianceId: string
  assignedTo?: {
    id: string
    fullName: string
    email: string
  } | null
  nextReviewDate?: Date | null
  onUpdate?: () => void
}

export function AssignmentCard({ complianceId, assignedTo, nextReviewDate, onUpdate }: AssignmentCardProps) {
  const getDaysUntilDeadline = () => {
    if (!nextReviewDate) return null
    const days = Math.ceil((new Date(nextReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const daysUntilDeadline = getDaysUntilDeadline()
  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 7

  return (
    <Card>
      <CardHeader>
        <CardTitle>Назначение и сроки</CardTitle>
        <CardDescription>Ответственный за выполнение и дедлайны</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assigned User */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Ответственный
            </Label>
            <AssignUserDialog
              complianceId={complianceId}
              currentAssignee={assignedTo?.id}
              onSuccess={onUpdate}
              trigger={
                <Button variant="ghost" size="sm">
                  {assignedTo ? "Изменить" : "Назначить"}
                </Button>
              }
            />
          </div>

          {assignedTo ? (
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{assignedTo.fullName}</p>
              <p className="text-sm text-muted-foreground">{assignedTo.email}</p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Ответственный не назначен
              </p>
            </div>
          )}
        </div>

        {/* Deadline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Дедлайн
            </Label>
            <SetDeadlineDialog
              complianceId={complianceId}
              currentDeadline={nextReviewDate}
              onSuccess={onUpdate}
              trigger={
                <Button variant="ghost" size="sm">
                  {nextReviewDate ? "Изменить" : "Установить"}
                </Button>
              }
            />
          </div>

          {nextReviewDate ? (
            <div
              className={`p-3 rounded-md ${
                isOverdue
                  ? "bg-red-50 border border-red-200"
                  : isUrgent
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-muted"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">
                  {new Date(nextReviewDate).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {isOverdue ? (
                  <Badge variant="destructive" className="text-xs">
                    Просрочено
                  </Badge>
                ) : isUrgent ? (
                  <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-600">
                    Срочно
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    В срок
                  </Badge>
                )}
              </div>
              <p
                className={`text-sm flex items-center gap-2 ${
                  isOverdue ? "text-red-800" : isUrgent ? "text-yellow-800" : "text-muted-foreground"
                }`}
              >
                <Clock className="h-4 w-4" />
                {isOverdue
                  ? `Просрочено на ${Math.abs(daysUntilDeadline!)} ${Math.abs(daysUntilDeadline!) === 1 ? "день" : "дней"}`
                  : `Осталось ${daysUntilDeadline} ${daysUntilDeadline === 1 ? "день" : "дней"}`}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Дедлайн не установлен
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
