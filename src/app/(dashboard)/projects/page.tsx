"use client"

import { useState, useEffect } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ColumnDefinition } from "@/types/table"
import type { Project } from "@/types/domain"
import { FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/lib/hooks/use-api"
import { useToast } from "@/hooks/use-toast"

export default function ProjectsPage() {
  const [data, setData] = useState<Project[]>([])
  const [directions, setDirections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "planning",
    startDate: "",
    endDate: "",
    totalBudget: 0,
    directionId: ""
  })

  const api = useApi()
  const { toast } = useToast()

  // Загрузка проектов и направлений
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Загружаем проекты
      const projectsResponse = await fetch('/api/projects')
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setData(projectsData.data || [])
      }

      // Загружаем направления для селекта
      const directionsResponse = await fetch('/api/directions')
      if (directionsResponse.ok) {
        const directionsData = await directionsResponse.json()
        setDirections(directionsData.data || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные",
      })
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDefinition<Project>[] = [
    { id: "name", label: "Название", key: "name", sortable: true },
    { 
      id: "status", 
      label: "Статус", 
      key: "status",
      render: (v, row) => {
        const colors: Record<string, string> = {
          planning: "bg-gray-100 text-gray-800",
          active: "bg-green-100 text-green-800",
          on_hold: "bg-yellow-100 text-yellow-800",
          completed: "bg-blue-100 text-blue-800",
          cancelled: "bg-red-100 text-red-800"
        }
        const labels: Record<string, string> = {
          planning: "Планирование",
          active: "Активен",
          on_hold: "Приостановлен",
          completed: "Завершен",
          cancelled: "Отменен"
        }
        return <Badge className={colors[row.status] || ""}>{labels[row.status] || row.status}</Badge>
      }
    },
    { id: "startDate", label: "Дата начала", key: "startDate", sortable: true },
    { id: "totalBudget", label: "Бюджет (₽)", key: "totalBudget", sortable: true, render: (v) => v?.toLocaleString('ru') || '—' },
  ]

  const handleAdd = () => {
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const response = await api.execute('/api/projects', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      toast({
        title: "Успешно!",
        description: "Проект создан",
      })

      // Закрываем диалог и обновляем список
      setIsDialogOpen(false)
      setFormData({
        name: "",
        code: "",
        description: "",
        status: "planning",
        startDate: "",
        endDate: "",
        totalBudget: 0,
        directionId: ""
      })

      // Перезагружаем данные
      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать проект",
      })
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name || "",
      code: project.code || "",
      description: project.description || "",
      status: project.status || "planning",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      totalBudget: project.totalBudget || 0,
      directionId: project.directionId || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingProject) return

    try {
      await api.execute(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })

      toast({
        title: "Успешно!",
        description: "Проект обновлен",
      })

      setIsEditDialogOpen(false)
      setEditingProject(null)
      setFormData({
        name: "",
        code: "",
        description: "",
        status: "planning",
        startDate: "",
        endDate: "",
        totalBudget: 0,
        directionId: ""
      })

      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить проект",
      })
    }
  }

  const handleDelete = async (project: Project) => {
    if (!confirm(`Удалить проект "${project.name}"?`)) return

    try {
      await api.execute(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      toast({
        title: "Успешно!",
        description: "Проект удален",
      })

      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить проект",
      })
    }
  }

  return (
    <>
      <div>
        <UniversalDataTable
          title="Все проекты"
          description="Управление проектами компании"
          icon={FolderOpen}
          data={data}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addButtonLabel="Создать проект"
          isLoading={loading}
          canExport
          exportFilename="projects"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Название проекта *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Например: Аудит ИБ ООО Альфа"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Код проекта</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Например: AUDIT-2024-01"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Краткое описание проекта..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="direction">Направление *</Label>
                <Select 
                  value={formData.directionId} 
                  onValueChange={(v) => setFormData({...formData, directionId: v})}
                >
                  <SelectTrigger id="direction">
                    <SelectValue placeholder="Выберите направление" />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((dir) => (
                      <SelectItem key={dir.id} value={dir.id}>
                        {dir.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Статус</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v})}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Планирование</SelectItem>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="on_hold">Приостановлен</SelectItem>
                    <SelectItem value="completed">Завершен</SelectItem>
                    <SelectItem value="cancelled">Отменен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Дата начала</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Плановая дата окончания</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget">Общий бюджет (₽)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.totalBudget}
                onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value)})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={api.loading}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || !formData.directionId || api.loading}
            >
              {api.loading ? "Создание..." : "Создать проект"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать проект</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Название проекта *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Например: Аудит ИБ ООО Альфа"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Код проекта</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Например: AUDIT-2024-01"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Краткое описание проекта..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-direction">Направление *</Label>
                <Select 
                  value={formData.directionId} 
                  onValueChange={(v) => setFormData({...formData, directionId: v})}
                >
                  <SelectTrigger id="edit-direction">
                    <SelectValue placeholder="Выберите направление" />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((dir) => (
                      <SelectItem key={dir.id} value={dir.id}>
                        {dir.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Статус</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v})}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Планирование</SelectItem>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="on_hold">Приостановлен</SelectItem>
                    <SelectItem value="completed">Завершен</SelectItem>
                    <SelectItem value="cancelled">Отменен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Дата начала</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">Плановая дата окончания</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-budget">Общий бюджет (₽)</Label>
              <Input
                id="edit-budget"
                type="number"
                value={formData.totalBudget}
                onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={api.loading}>
              Отмена
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={!formData.name || !formData.directionId || api.loading}
            >
              {api.loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
