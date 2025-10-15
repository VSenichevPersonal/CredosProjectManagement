"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Building2, Plus, Search, Edit, Trash2 } from "lucide-react"
import { useDirections, useCreateDirection, useUpdateDirection, useDeleteDirection } from "@/lib/hooks/use-directions"

interface Direction {
  id: string;
  name: string;
  code?: string;
  description?: string;
  budget?: number;
}

export default function DirectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDirection, setEditingDirection] = useState<Direction | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    budget: 0
  })

  // React Query hooks
  const { data: directions = [], isLoading } = useDirections()
  const createDirection = useCreateDirection()
  const updateDirection = useUpdateDirection()
  const deleteDirection = useDeleteDirection()

  const filteredDirections = directions.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAdd = () => {
    setFormData({ name: "", code: "", description: "", budget: 0 })
    setIsDialogOpen(true)
  }

  const handleEdit = (direction: Direction) => {
    setEditingDirection(direction)
    setFormData({
      name: direction.name,
      code: direction.code || "",
      description: direction.description || "",
      budget: direction.budget || 0
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name) return
    createDirection.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setFormData({ name: "", code: "", description: "", budget: 0 })
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
    if (confirm(\`Вы уверены, что хотите удалить направление "\${direction.name}"?\`)) {
      deleteDirection.mutate(direction.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['PT_Sans']">Направления</h1>
          <p className="text-gray-600 mt-1">Управление направлениями деятельности</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить направление
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Поиск направлений..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDirections.map((direction) => (
            <Card key={direction.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="font-['PT_Sans']">{direction.name}</CardTitle>
                      {direction.code && (
                        <p className="text-sm text-gray-500 font-['JetBrains_Mono']">{direction.code}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(direction)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(direction)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {direction.description && (
                  <p className="text-sm text-gray-600 mb-3">{direction.description}</p>
                )}
                {direction.budget !== undefined && direction.budget > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Бюджет:</span>
                    <span className="font-semibold ml-2 font-['JetBrains_Mono']">
                      {direction.budget.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог создания */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить направление</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название направления *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Например: Информационная безопасность"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Краткое описание направления..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">Бюджет (₽)</Label>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать направление</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Название направления *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Например: Информационная безопасность"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Краткое описание направления..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-budget">Бюджет (₽)</Label>
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
