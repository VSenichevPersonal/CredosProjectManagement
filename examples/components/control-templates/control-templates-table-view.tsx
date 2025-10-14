"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { ControlTemplate } from "@/types/domain/control-template"

interface ControlTemplatesTableViewProps {
  templates: ControlTemplate[]
  onView: (template: ControlTemplate) => void
  onEdit: (template: ControlTemplate) => void
  onDelete: (template: ControlTemplate) => void
  visibleColumns: Set<string>
}

export function ControlTemplatesTableView({
  templates,
  onView,
  onEdit,
  onDelete,
  visibleColumns,
}: ControlTemplatesTableViewProps) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      preventive: "Превентивная",
      detective: "Детективная",
      corrective: "Корректирующая",
      compensating: "Компенсирующая",
    }
    return labels[type] || type
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      continuous: "Непрерывно",
      daily: "Ежедневно",
      weekly: "Еженедельно",
      monthly: "Ежемесячно",
      quarterly: "Ежеквартально",
      annually: "Ежегодно",
      on_demand: "По требованию",
    }
    return labels[frequency] || frequency
  }

  if (templates.length === 0) {
    return <div className="text-center py-12 text-muted-foreground border rounded-lg">Типовые меры не найдены</div>
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.has("code") && <TableHead>Код</TableHead>}
            {visibleColumns.has("title") && <TableHead>Название</TableHead>}
            {visibleColumns.has("type") && <TableHead>Тип</TableHead>}
            {visibleColumns.has("category") && <TableHead>Категория</TableHead>}
            {visibleColumns.has("frequency") && <TableHead>Частота</TableHead>}
            {visibleColumns.has("status") && <TableHead>Статус</TableHead>}
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(template)}>
              {visibleColumns.has("code") && <TableCell className="font-mono text-sm">{template.code}</TableCell>}
              {visibleColumns.has("title") && <TableCell className="font-medium">{template.title}</TableCell>}
              {visibleColumns.has("type") && (
                <TableCell>
                  <Badge variant="outline">{getTypeLabel(template.controlType)}</Badge>
                </TableCell>
              )}
              {visibleColumns.has("category") && (
                <TableCell>
                  <Badge variant="secondary">{template.category || "—"}</Badge>
                </TableCell>
              )}
              {visibleColumns.has("frequency") && (
                <TableCell className="text-sm text-muted-foreground">{getFrequencyLabel(template.frequency)}</TableCell>
              )}
              {visibleColumns.has("status") && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {template.isPublic && <Badge variant="secondary">Публичная</Badge>}
                    {template.isAutomated && <Badge>Автоматизированная</Badge>}
                  </div>
                </TableCell>
              )}
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(template)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Просмотр
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
