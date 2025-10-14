"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ControlFrequencyFilterProps {
  value: string
  onChange: (value: string) => void
}

export function ControlFrequencyFilter({ value, onChange }: ControlFrequencyFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Частота" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все частоты</SelectItem>
        <SelectItem value="continuous">Непрерывно</SelectItem>
        <SelectItem value="daily">Ежедневно</SelectItem>
        <SelectItem value="weekly">Еженедельно</SelectItem>
        <SelectItem value="monthly">Ежемесячно</SelectItem>
        <SelectItem value="quarterly">Ежеквартально</SelectItem>
        <SelectItem value="annually">Ежегодно</SelectItem>
        <SelectItem value="on_demand">По требованию</SelectItem>
      </SelectContent>
    </Select>
  )
}
