import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

type DocumentStatus = "need_document" | "ok" | "needs_update" | "not_relevant"

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  className?: string
}

const statusConfig = {
  need_document: {
    label: "Требуется документ",
    icon: FileText,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  ok: {
    label: "Актуален",
    icon: CheckCircle,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  needs_update: {
    label: "Требует обновления",
    icon: AlertTriangle,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  not_relevant: {
    label: "Не применимо",
    icon: XCircle,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.className} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
