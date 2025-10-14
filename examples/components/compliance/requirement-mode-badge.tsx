import { Badge } from "@/components/ui/badge"
import { Shield, Sparkles } from "lucide-react"

interface RequirementModeBadgeProps {
  mode: "strict" | "flexible"
  type: "measure" | "evidence"
  className?: string
}

export function RequirementModeBadge({ mode, type, className }: RequirementModeBadgeProps) {
  const isStrict = mode === "strict"
  const label = type === "measure" ? "Меры" : "Доказательства"

  return (
    <Badge
      variant={isStrict ? "default" : "secondary"}
      className={`${isStrict ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : ""} ${className || ""}`}
    >
      {isStrict ? <Shield className="mr-1 h-3 w-3" /> : <Sparkles className="mr-1 h-3 w-3" />}
      {label}: {isStrict ? "Строгий" : "Гибкий"}
    </Badge>
  )
}
