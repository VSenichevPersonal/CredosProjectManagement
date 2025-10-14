"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ControlMeasureTemplateDialog } from "@/components/dictionaries/control-measure-template-dialog"
import type { ControlMeasureTemplate } from "@/types/domain/control-measure"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ControlMeasureTemplatesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ControlMeasureTemplate | null>(null)

  const { data: templates, isLoading } = useSWR<ControlMeasureTemplate[]>(
    "/api/dictionaries/control-measure-templates",
    fetcher,
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот шаблон меры?")) {
      return
    }

    try {
      const response = await fetch(`/api/dictionaries/control-measure-templates/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      mutate("/api/dictionaries/control-measure-templates")
    } catch (error) {
      console.error("Failed to delete control measure template:", error)
      alert("Не удалось удалить шаблон меры")
    }
  }

  const handleSuccess = () => {
    mutate("/api/dictionaries/control-measure-templates")
    setIsCreateOpen(false)
    setEditingTemplate(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Шаблоны мер контроля</h1>
          <p className="text-muted-foreground mt-2">
            Управление справочником шаблонов мер для выполнения требований информационной безопасности
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить шаблон
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Тип меры</TableHead>
              <TableHead>Порядок</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : templates && templates.length > 0 ? (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-mono text-sm">{template.code}</TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">
                    {template.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.category || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.measureType}</Badge>
                  </TableCell>
                  <TableCell>{template.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Шаблоны мер не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ControlMeasureTemplateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={handleSuccess} />

      <ControlMeasureTemplateDialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        template={editingTemplate}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
