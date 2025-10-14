import { Badge } from "@/components/ui/badge"
import type { OrganizationAttributes } from "@/types/domain/organization"

interface OrganizationAttributesBadgeProps {
  attributes: OrganizationAttributes
  organizationId?: string
}

export function OrganizationAttributesBadge({ attributes, organizationId }: OrganizationAttributesBadgeProps) {
  const keyPrefix = organizationId || "attr"
  const badges = []

  if (attributes.kiiCategory) {
    badges.push(
      <Badge key={`${keyPrefix}-kii`} variant="outline" className="bg-red-50 text-red-700 border-red-200">
        КИИ-{attributes.kiiCategory}
      </Badge>,
    )
  }

  if (attributes.pdnLevel) {
    badges.push(
      <Badge key={`${keyPrefix}-pdn`} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        УЗ-{attributes.pdnLevel}
      </Badge>,
    )
  }

  if (attributes.isFinancial) {
    badges.push(
      <Badge key={`${keyPrefix}-financial`} variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Финансовая
      </Badge>,
    )
  }

  if (attributes.isHealthcare) {
    badges.push(
      <Badge
        key={`${keyPrefix}-healthcare`}
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-200"
      >
        Медицинская
      </Badge>,
    )
  }

  if (attributes.isGovernment) {
    badges.push(
      <Badge
        key={`${keyPrefix}-government`}
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-200"
      >
        Государственная
      </Badge>,
    )
  }

  if (attributes.hasForeignData) {
    badges.push(
      <Badge key={`${keyPrefix}-foreign`} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        Иностранные данные
      </Badge>,
    )
  }

  if (badges.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Атрибуты не заданы
      </Badge>
    )
  }

  return <div className="flex flex-wrap gap-2">{badges}</div>
}
