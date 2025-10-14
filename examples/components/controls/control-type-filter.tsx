"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ControlTypeFilterProps {
  value: string
  onChange: (value: string) => void
}

export function ControlTypeFilter({ value, onChange }: ControlTypeFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Тип контроля" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все типы</SelectItem>
        <SelectItem value="preventive">Превентивные</SelectItem>
        <SelectItem value="detective">Детективные</SelectItem>
        <SelectItem value="corrective">Корректирующие</SelectItem>
      </SelectContent>
    </Select>
  )
}
