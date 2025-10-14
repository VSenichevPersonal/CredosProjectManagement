"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Scale, Building, Award } from "lucide-react"
import { CreateDocumentTypeDialog } from "./create-document-type-dialog"
import { EditDocumentTypeDialog } from "./edit-document-type-dialog"
import type { RegulatoryDocumentType } from "@/types/domain/regulatory-document-type"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const iconMap = {
  scale: Scale,
  building: Building,
  award: Award,
}

export function RegulatoryDocumentTypesClient() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<RegulatoryDocumentType | null>(null)

  const { data: types, mutate } = useSWR<RegulatoryDocumentType[]>("/api/admin/regulatory-document-types", fetcher)

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот вид документации?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/regulatory-document-types/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete")
      }

      mutate()
    } catch (error) {
      console.error("Error deleting document type:", error)
      alert("Ошибка при удалении вида документации")
    }
  }

  const handleEdit = (type: RegulatoryDocumentType) => {
    setSelectedType(type)
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">Всего видов: {types?.length || 0}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить вид
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Иконка</TableHead>
              <TableHead>Цвет</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Системный</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types?.map((type) => {
              const Icon = type.icon ? iconMap[type.icon as keyof typeof iconMap] : null
              return (
                <TableRow key={type.id}>
                  <TableCell className="font-mono text-sm">{type.code}</TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">{type.description}</TableCell>
                  <TableCell>{Icon && <Icon className="h-4 w-4" />}</TableCell>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: type.color }}>
                      {type.color}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                  <TableCell>{type.isSystem && <Badge variant="outline">Системный</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!type.isSystem && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <CreateDocumentTypeDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={() => mutate()} />

      {selectedType && (
        <EditDocumentTypeDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          documentType={selectedType}
          onSuccess={() => mutate()}
        />
      )}
    </div>
  )
}
