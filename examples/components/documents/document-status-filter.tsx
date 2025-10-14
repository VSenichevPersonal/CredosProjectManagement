"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Filter } from "lucide-react"

interface DocumentStatusFilterProps {
  value: string
  onChange: (value: string) => void
  counts?: {
    all: number
    need_document: number
    ok: number
    needs_update: number
    not_relevant: number
  }
}

export function DocumentStatusFilter({ value, onChange, counts }: DocumentStatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[240px]">
        <Filter className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Статус документа" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все документы {counts && `(${counts.all})`}</SelectItem>
        <SelectItem value="need_document">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
              Требуется
            </Badge>
            {counts && <span className="text-muted-foreground">({counts.need_document})</span>}
          </div>
        </SelectItem>
        <SelectItem value="ok">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              Актуален
            </Badge>
            {counts && <span className="text-muted-foreground">({counts.ok})</span>}
          </div>
        </SelectItem>
        <SelectItem value="needs_update">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
              Обновить
            </Badge>
            {counts && <span className="text-muted-foreground">({counts.needs_update})</span>}
          </div>
        </SelectItem>
        <SelectItem value="not_relevant">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
              Не применимо
            </Badge>
            {counts && <span className="text-muted-foreground">({counts.not_relevant})</span>}
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
