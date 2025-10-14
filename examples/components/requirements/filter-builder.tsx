"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { ApplicabilityFilterRules } from "@/types/domain/applicability"

interface FilterBuilderProps {
  filterRules: ApplicabilityFilterRules
  onChange: (rules: ApplicabilityFilterRules) => void
}

export function FilterBuilder({ filterRules, onChange }: FilterBuilderProps) {
  const toggleKiiCategory = (category: 1 | 2 | 3) => {
    const current = filterRules.kiiCategory || []
    const updated = current.includes(category) ? current.filter((c) => c !== category) : [...current, category]
    onChange({ ...filterRules, kiiCategory: updated.length > 0 ? updated : undefined })
  }

  const togglePdnLevel = (level: 1 | 2 | 3 | 4) => {
    const current = filterRules.pdnLevel || []
    const updated = current.includes(level) ? current.filter((l) => l !== level) : [...current, level]
    onChange({ ...filterRules, pdnLevel: updated.length > 0 ? updated : undefined })
  }

  const clearFilter = (key: keyof ApplicabilityFilterRules) => {
    const updated = { ...filterRules }
    delete updated[key]
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Active Filters */}
      {Object.keys(filterRules).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterRules.kiiCategory && filterRules.kiiCategory.length > 0 && (
            <Badge variant="outline" className="gap-2">
              КИИ: {filterRules.kiiCategory.join(", ")}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("kiiCategory")} />
            </Badge>
          )}
          {filterRules.pdnLevel && filterRules.pdnLevel.length > 0 && (
            <Badge variant="outline" className="gap-2">
              ПДн: УЗ-{filterRules.pdnLevel.join(", УЗ-")}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("pdnLevel")} />
            </Badge>
          )}
          {filterRules.isFinancial && (
            <Badge variant="outline" className="gap-2">
              Финансовая
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("isFinancial")} />
            </Badge>
          )}
          {filterRules.isHealthcare && (
            <Badge variant="outline" className="gap-2">
              Медицинская
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("isHealthcare")} />
            </Badge>
          )}
          {filterRules.isGovernment && (
            <Badge variant="outline" className="gap-2">
              Государственная
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("isGovernment")} />
            </Badge>
          )}
          {filterRules.hasForeignData && (
            <Badge variant="outline" className="gap-2">
              Иностранные данные
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("hasForeignData")} />
            </Badge>
          )}
          {(filterRules.minEmployeeCount || filterRules.maxEmployeeCount) && (
            <Badge variant="outline" className="gap-2">
              Сотрудники: {filterRules.minEmployeeCount || 0} - {filterRules.maxEmployeeCount || "∞"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  clearFilter("minEmployeeCount")
                  clearFilter("maxEmployeeCount")
                }}
              />
            </Badge>
          )}
        </div>
      )}

      {/* КИИ Filter */}
      <div className="flex flex-col gap-3">
        <Label className="text-base font-semibold">Критическая информационная инфраструктура (КИИ)</Label>
        <div className="flex gap-4">
          {[1, 2, 3].map((category) => (
            <div key={category} className="flex items-center gap-2">
              <Checkbox
                id={`kii-${category}`}
                checked={filterRules.kiiCategory?.includes(category as 1 | 2 | 3) || false}
                onCheckedChange={() => toggleKiiCategory(category as 1 | 2 | 3)}
              />
              <Label htmlFor={`kii-${category}`} className="cursor-pointer text-sm">
                Категория {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* ПДн Filter */}
      <div className="flex flex-col gap-3">
        <Label className="text-base font-semibold">Персональные данные (ПДн)</Label>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((level) => (
            <div key={level} className="flex items-center gap-2">
              <Checkbox
                id={`pdn-${level}`}
                checked={filterRules.pdnLevel?.includes(level as 1 | 2 | 3 | 4) || false}
                onCheckedChange={() => togglePdnLevel(level as 1 | 2 | 3 | 4)}
              />
              <Label htmlFor={`pdn-${level}`} className="cursor-pointer text-sm">
                УЗ-{level}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Organization Type Filter */}
      <div className="flex flex-col gap-3">
        <Label className="text-base font-semibold">Тип организации</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isFinancial"
              checked={filterRules.isFinancial || false}
              onCheckedChange={(checked) => onChange({ ...filterRules, isFinancial: checked as boolean })}
            />
            <Label htmlFor="isFinancial" className="cursor-pointer text-sm">
              Финансовая
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isHealthcare"
              checked={filterRules.isHealthcare || false}
              onCheckedChange={(checked) => onChange({ ...filterRules, isHealthcare: checked as boolean })}
            />
            <Label htmlFor="isHealthcare" className="cursor-pointer text-sm">
              Медицинская
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isGovernment"
              checked={filterRules.isGovernment || false}
              onCheckedChange={(checked) => onChange({ ...filterRules, isGovernment: checked as boolean })}
            />
            <Label htmlFor="isGovernment" className="cursor-pointer text-sm">
              Государственная
            </Label>
          </div>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="flex flex-col gap-3">
        <Label className="text-base font-semibold">Дополнительные фильтры</Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hasForeignData"
            checked={filterRules.hasForeignData || false}
            onCheckedChange={(checked) => onChange({ ...filterRules, hasForeignData: checked as boolean })}
          />
          <Label htmlFor="hasForeignData" className="cursor-pointer text-sm">
            Обработка данных иностранных граждан
          </Label>
        </div>
      </div>

      {/* Employee Count Filter */}
      <div className="flex flex-col gap-3">
        <Label className="text-base font-semibold">Количество сотрудников</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="minEmployeeCount" className="text-sm">
              От
            </Label>
            <Input
              id="minEmployeeCount"
              type="number"
              placeholder="0"
              className="w-32"
              value={filterRules.minEmployeeCount || ""}
              onChange={(e) =>
                onChange({
                  ...filterRules,
                  minEmployeeCount: e.target.value ? Number.parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="maxEmployeeCount" className="text-sm">
              До
            </Label>
            <Input
              id="maxEmployeeCount"
              type="number"
              placeholder="∞"
              className="w-32"
              value={filterRules.maxEmployeeCount || ""}
              onChange={(e) =>
                onChange({
                  ...filterRules,
                  maxEmployeeCount: e.target.value ? Number.parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
