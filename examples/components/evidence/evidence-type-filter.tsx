/**
 * @intent: Filter evidence by type
 * @llm-note: Dropdown filter for evidence types
 */

"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"
import type { EvidenceType } from "@/types/domain/evidence"
import { getEvidenceTypeLabel } from "@/lib/utils/evidence-type-helpers"

interface EvidenceTypeFilterProps {
  selectedTypes: EvidenceType[]
  onTypesChange: (types: EvidenceType[]) => void
}

const allTypes: EvidenceType[] = [
  "document",
  "screenshot",
  "log",
  "certificate",
  "report",
  "scan",
  "video",
  "audio",
  "archive",
  "other",
]

export function EvidenceTypeFilter({ selectedTypes, onTypesChange }: EvidenceTypeFilterProps) {
  const handleToggle = (type: EvidenceType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  const handleClear = () => {
    onTypesChange([])
  }

  const handleSelectAll = () => {
    onTypesChange(allTypes)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Тип
          {selectedTypes.length > 0 && <span className="ml-1 text-xs">({selectedTypes.length})</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Фильтр по типу</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allTypes.map((type) => (
          <DropdownMenuCheckboxItem
            key={type}
            checked={selectedTypes.includes(type)}
            onCheckedChange={() => handleToggle(type)}
          >
            {getEvidenceTypeLabel(type)}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2 px-2 py-1">
          <Button variant="ghost" size="sm" onClick={handleClear} className="flex-1 h-8">
            Очистить
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSelectAll} className="flex-1 h-8">
            Все
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
