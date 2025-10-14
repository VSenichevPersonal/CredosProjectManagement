import { Badge } from "@/components/ui/badge"
import { cn, getStatusColor, getPriorityColor, getDirectionColor } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  type?: "status" | "priority" | "direction"
  className?: string
}

export function StatusBadge({ status, type = "status", className }: StatusBadgeProps) {
  const getColorClass = () => {
    switch (type) {
      case "priority":
        return getPriorityColor(status)
      case "direction":
        return getDirectionColor(status)
      case "status":
      default:
        return getStatusColor(status)
    }
  }

  const getDisplayText = () => {
    switch (type) {
      case "priority":
        const priorityMap = {
          low: "Низкий",
          medium: "Средний", 
          high: "Высокий",
          critical: "Критический"
        }
        return priorityMap[status as keyof typeof priorityMap] || status
      
      case "direction":
        const directionMap = {
          ib: "ИБ",
          pib: "ПИБ",
          tc: "ТЦ",
          audit: "Аудит",
          hr: "HR",
          finance: "Финансы"
        }
        return directionMap[status as keyof typeof directionMap] || status
      
      case "status":
      default:
        const statusMap = {
          planning: "Планирование",
          active: "Активный",
          on_hold: "Приостановлен",
          completed: "Завершен",
          cancelled: "Отменен",
          draft: "Черновик",
          submitted: "На рассмотрении",
          approved: "Утвержден",
          rejected: "Отклонен",
          todo: "К выполнению",
          in_progress: "В работе",
          review: "На проверке",
          done: "Выполнено"
        }
        return statusMap[status as keyof typeof statusMap] || status
    }
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("credos-direction-badge", getColorClass(), className)}
    >
      {getDisplayText()}
    </Badge>
  )
}
