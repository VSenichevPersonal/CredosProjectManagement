"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Plus, Pencil, Trash2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { OrganizationTypeFormDialog } from "@/components/admin/organization-type-form-dialog"
import type { OrganizationType } from "@/types/domain/organization-type"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function OrganizationTypesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingType, setEditingType] = useState<OrganizationType | null>(null)

  const { data: types, isLoading } = useSWR<OrganizationType[]>("/api/dictionaries/organization-types", fetcher)

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот тип организации?")) {
      return
    }

    try {
      const response = await fetch(`/api/dictionaries/organization-types/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      mutate("/api/dictionaries/organization-types")
    } catch (error) {
      console.error("Failed to delete organization type:", error)
      alert("Не удалось удалить тип организации")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Типы организаций</h1>
          <p className="text-muted-foreground mt-2">Управление справочником типов организаций</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить тип
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
              <TableHead>Порядок</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : types && types.length > 0 ? (
              types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-mono text-sm">{type.code}</TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">{type.description || "—"}</TableCell>
                  <TableCell>
                    {type.icon ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm text-muted-foreground">{type.icon}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{type.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingType(type)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Типы организаций не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <OrganizationTypeFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false)
          mutate("/api/dictionaries/organization-types")
        }}
      />

      {editingType && (
        <OrganizationTypeFormDialog
          open={!!editingType}
          onOpenChange={(open) => !open && setEditingType(null)}
          type={editingType}
          onSuccess={() => {
            setEditingType(null)
            mutate("/api/dictionaries/organization-types")
          }}
        />
      )}
    </div>
  )
}
