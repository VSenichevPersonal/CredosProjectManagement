"use client"

import type React from "react"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { EvidenceType } from "@/types/domain/control-measure"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function EvidenceTypesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingType, setEditingType] = useState<EvidenceType | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    category: "",
    sortOrder: 0,
    isActive: true,
  })

  const { data: types, isLoading } = useSWR<EvidenceType[]>("/api/dictionaries/evidence-types", fetcher)

  console.log("[v0] Evidence types data:", types)

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот тип доказательства?")) {
      return
    }

    try {
      const response = await fetch(`/api/dictionaries/evidence-types/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      mutate("/api/dictionaries/evidence-types")
    } catch (error) {
      console.error("Failed to delete evidence type:", error)
      alert("Не удалось удалить тип доказательства")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingType
        ? `/api/dictionaries/evidence-types/${editingType.id}`
        : "/api/dictionaries/evidence-types"

      const method = editingType ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      mutate("/api/dictionaries/evidence-types")
      setIsCreateOpen(false)
      setEditingType(null)
      setFormData({
        code: "",
        name: "",
        description: "",
        category: "",
        sortOrder: 0,
        isActive: true,
      })
    } catch (error) {
      console.error("Failed to save evidence type:", error)
      alert("Не удалось сохранить тип доказательства")
    }
  }

  const handleEdit = (type: EvidenceType) => {
    setEditingType(type)
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || "",
      category: type.category || "",
      sortOrder: type.sortOrder,
      isActive: type.isActive,
    })
    setIsCreateOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingType(null)
    setFormData({
      code: "",
      name: "",
      description: "",
      category: "",
      sortOrder: 0,
      isActive: true,
    })
    setIsCreateOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Типы доказательств</h1>
          <p className="text-muted-foreground mt-2">
            Управление справочником типов доказательств для подтверждения выполнения требований
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
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
              <TableHead>Категория</TableHead>
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
                    <Badge variant="outline">{type.category || "—"}</Badge>
                  </TableCell>
                  <TableCell>{type.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
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
                  Типы доказательств не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Редактировать тип доказательства" : "Добавить тип доказательства"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Код *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Порядок сортировки</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Активен</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">{editingType ? "Сохранить" : "Создать"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
