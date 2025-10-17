"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ColumnDefinition } from "@/types/table"
import type { Direction } from "@/types/domain"
import { Building2 } from "lucide-react"
import { useDirections, useCreateDirection, useUpdateDirection, useDeleteDirection } from "@/lib/hooks/use-directions"

const COLOR_PRESETS = [
  { label: "Синий", value: "#3B82F6" },
  { label: "Зелёный", value: "#10B981" },
  { label: "Красный", value: "#EF4444" },
  { label: "Оранжевый", value: "#F59E0B" },
  { label: "Фиолетовый", value: "#8B5CF6" },
  { label: "Розовый", value: "#EC4899" },
  { label: "Голубой", value: "#06B6D4" },
  { label: "Серый", value: "#6B7280" },
]

export default function DirectionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDirection, setEditingDirection] = useState<Direction | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    color: "#3B82F6",
    budget: 0,
  })

  // React Query hooks
  const { data: directionsResult, isLoading: loadingDirections } = useDirections()
  const directions = directionsResult?.data || []
  const createDirection = useCreateDirection()
  const updateDirection = useUpdateDirection()
  const deleteDirection = useDeleteDirection()

  const columns: ColumnDefinition<Direction>[] = [
    { id: "name", label: "Название", key: "name", sortable: true },
    { 
      id: "color", 
      label: "Цвет", 
      key: "color",
      render: (v) => v ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border border-gray-300" style={{backgroundColor: v}} />
          <span className="text-xs text-gray-500">{v}</span>
        </div>
      ) : '—'
    },
    { id: "description", label: "Описание", key: "description" },
    { id: "budget", label: "Бюджет (₽)", key: "budget", sortable: true, render: (v) => v ? `${Number(v).toLocaleString('ru-RU')} ₽` : '—' },
  ]

  const handleAdd = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      color: "#3B82F6",
      budget: 0,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (direction: Direction) => {
    setEditingDirection(direction)
    setFormData({
      name: direction.name,
      code: direction.code || "",
      description: direction.description || "",
      color: direction.color || "#3B82F6",
      budget: direction.budget || 0,
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name) return

    createDirection.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setFormData({
          name: "",
          code: "",
          description: "",
          color: "#3B82F6",
          budget: 0,
        })
      }
    })
  }

  const handleEditSubmit = async () => {
    if (!editingDirection || !formData.name) return

    updateDirection.mutate({ id: editingDirection.id, data: formData }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setEditingDirection(null)
      }
    })
  }

  const handleDelete = async (direction: Direction) => {
    if (confirm(`Вы уверены, что хотите удалить направление "${direction.name}"?`)) {
      deleteDirection.mutate(direction.id)
    }
  }

  const loading = loadingDirections
  const isMutating = createDirection.isPending || updateDirection.isPending || deleteDirection.isPending

  return (
    <div>
      <UniversalDataTable
        title="Направления"
        description="Бизнес-направления компании (ИБ, ПИБ, ТК, Аудит)"
        icon={Building2}
        data={directions}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Создать направление"
        isLoading={loading || isMutating}
        canExport
        exportFilename="directions"
      />

      {/* Диалог создания */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать направление</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Например: Информационная безопасность"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Код</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Например: IB"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Краткое описание направления..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Цвет *</Label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData({...formData, color: preset.value})}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === preset.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{backgroundColor: preset.value}}
                    title={preset.label}
                  />
                ))}
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-16 h-8 p-1 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500">Выберите цвет из палитры или введите свой</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget">Бюджет направления (₽)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createDirection.isPending}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || createDirection.isPending}>
              {createDirection.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать направление</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Название *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Например: Информационная безопасность"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Код</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Например: IB"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Краткое описание направления..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-color">Цвет *</Label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData({...formData, color: preset.value})}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === preset.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{backgroundColor: preset.value}}
                    title={preset.label}
                  />
                ))}
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-16 h-8 p-1 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500">Выберите цвет из палитры или введите свой</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-budget">Бюджет направления (₽)</Label>
              <Input
                id="edit-budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateDirection.isPending}>
              Отмена
            </Button>
            <Button onClick={handleEditSubmit} disabled={!formData.name || updateDirection.isPending}>
              {updateDirection.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
