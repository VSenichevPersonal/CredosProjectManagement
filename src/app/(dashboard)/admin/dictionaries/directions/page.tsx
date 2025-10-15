"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Building2, Plus, Search, Edit, Trash2 } from "lucide-react"
import { useApi } from "@/lib/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import type { Direction } from "@/types/domain"

export default function DirectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDirection, setEditingDirection] = useState<Direction | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    budget: 0
  })

  const api = useApi()
  const { toast } = useToast()

  useEffect(() => {
    loadDirections()
  }, [])

  const loadDirections = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/directions')
      if (response.ok) {
        const data = await response.json()
        setDirections(data.data || [])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: "Не удалось загрузить направления",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredDirections = directions.filter(dir => 
    dir.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      await api.execute('/api/directions', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      toast({
        title: "Успешно!",
        description: "Направление создано",
      })

      setIsDialogOpen(false)
      setFormData({ name: "", code: "", description: "", budget: 0 })
      loadDirections()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать направление",
      })
    }
  }

  const handleEdit = (direction: Direction) => {
    setEditingDirection(direction)
    setFormData({
      name: direction.name || "",
      code: direction.code || "",
      description: direction.description || "",
      budget: direction.budget || 0
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingDirection) return

    try {
      await api.execute(`/api/directions/${editingDirection.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })

      toast({
        title: "Успешно!",
        description: "Направление обновлено",
      })

      setIsEditDialogOpen(false)
      setEditingDirection(null)
      setFormData({ name: "", code: "", description: "", budget: 0 })
      loadDirections()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить направление",
      })
    }
  }

  const handleDelete = async (direction: Direction) => {
    if (!confirm(`Удалить направление "${direction.name}"?`)) return

    try {
      await api.execute(`/api/directions/${direction.id}`, {
        method: 'DELETE',
      })

      toast({
        title: "Успешно!",
        description: "Направление удалено",
      })

      loadDirections()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить направление",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-credos-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка направлений...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Направления</h1>
            <p className="text-gray-600 mt-1">Управление направлениями компании</p>
          </div>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Добавить направление
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Directions List */}
        <div className="grid gap-4">
          {filteredDirections.map((direction) => (
            <Card key={direction.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-credos-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-credos-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{direction.name}</CardTitle>
                      {direction.description && (
                        <p className="text-sm text-muted-foreground">{direction.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(direction)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(direction)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {direction.budget && (
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Бюджет: <span className="font-medium text-credos-primary">{direction.budget.toLocaleString('ru')} ₽</span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredDirections.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Направления не найдены</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery ? "Попробуйте изменить поисковый запрос" : "Создайте первое направление"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новое направление</DialogTitle>
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
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={api.loading}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || api.loading}>
              {api.loading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={api.loading}>
              Отмена
            </Button>
            <Button onClick={handleEditSubmit} disabled={!formData.name || api.loading}>
              {api.loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
