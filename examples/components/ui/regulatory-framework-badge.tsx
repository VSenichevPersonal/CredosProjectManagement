import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RegulatoryFrameworkBadgeProps {
  code: string
  badgeText?: string
  badgeColor?: "blue" | "purple" | "orange" | "red" | "green" | "secondary" | "outline" | "default"
  className?: string
}

const colorVariants = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  purple:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  secondary: "",
  outline: "",
  default: "",
}

export function RegulatoryFrameworkBadge({
  code,
  badgeText,
  badgeColor = "secondary",
  className,
}: RegulatoryFrameworkBadgeProps) {
  const displayText = badgeText || code
  const isCustomColor = badgeColor && !["secondary", "outline", "default"].includes(badgeColor)

  if (isCustomColor) {
    return (
      <Badge variant="outline" className={cn("text-xs font-medium border", colorVariants[badgeColor], className)}>
        {displayText}
      </Badge>
    )
  }

  return (
    <Badge variant={badgeColor as "secondary" | "outline" | "default"} className={cn("text-xs", className)}>
      {displayText}
    </Badge>
  )
}
