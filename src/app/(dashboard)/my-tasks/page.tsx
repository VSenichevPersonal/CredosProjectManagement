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
import type { Task } from "@/types/domain"
import { Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/lib/hooks/use-api"
import { useToast } from "@/hooks/use-toast"

export default function MyTasksPage() {
  const [data, setData] = useState<Task[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "",
    status: "todo",
    priority: "medium",
    estimatedHours: 0,
    dueDate: ""
  })

  const api = useApi()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects')
      ])

      if (tasksRes.ok) {
        const result = await tasksRes.json()
        setData(result.data || [])
      }

      if (projectsRes.ok) {
        const result = await projectsRes.json()
        setProjects(result.data || [])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные",
      })
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDefinition<Task>[] = [
    { id: "name", label: "Задача", key: "name", sortable: true },
    { 
      id: "status", 
      label: "Статус", 
      key: "status",
      sortable: true,
      render: (v, row) => {
        const colors: Record<string, string> = {
          todo: "bg-gray-100 text-gray-800",
          in_progress: "bg-blue-100 text-blue-800",
          review: "bg-yellow-100 text-yellow-800",
          done: "bg-green-100 text-green-800"
        }
        const labels: Record<string, string> = {
          todo: "К выполнению",
          in_progress: "В работе",
          review: "На проверке",
          done: "Завершено"
        }
        return <Badge className={colors[row.status] || ""}>{labels[row.status] || row.status}</Badge>
      }
    },
    { 
      id: "priority", 
      label: "Приоритет", 
      key: "priority",
      render: (v, row) => {
        const colors: Record<string, string> = {
          low: "text-gray-600",
          medium: "text-blue-600",
          high: "text-orange-600",
          critical: "text-red-600"
        }
        const labels: Record<string, string> = {
          low: "Низкий",
          medium: "Средний",
          high: "Высокий",
          critical: "Критичный"
        }
        return <span className={colors[row.priority] || ""}>{labels[row.priority] || row.priority}</span>
      }
    },
    { id: "dueDate", label: "Срок", key: "dueDate", sortable: true },
    { id: "estimatedHours", label: "Оценка (ч)", key: "estimatedHours" },
  ]

  const handleAdd = () => {
    setFormData({
      name: "",
      description: "",
      projectId: "",
      status: "todo",
      priority: "medium",
      estimatedHours: 0,
      dueDate: ""
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      await api.execute('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      toast({
        title: "Успешно!",
        description: "Задача создана",
      })

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать задачу",
      })
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      name: task.name || "",
      description: task.description || "",
      projectId: task.projectId || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      estimatedHours: task.estimatedHours || 0,
      dueDate: task.dueDate || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingTask) return

    try {
      await api.execute(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })

      toast({
        title: "Успешно!",
        description: "Задача обновлена",
      })

      setIsEditDialogOpen(false)
      setEditingTask(null)
      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить задачу",
      })
    }
  }

  const handleDelete = async (task: Task) => {
    if (!confirm(`Удалить задачу "${task.name}"?`)) return

    try {
      await api.execute(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      })

      toast({
        title: "Успешно!",
        description: "Задача удалена",
      })

      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить задачу",
      })
    }
  }

  return (
    <>
      <div>
        <UniversalDataTable
          title="Мои задачи"
          description="Задачи, назначенные мне"
          icon={Target}
          data={data}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addButtonLabel="Создать задачу"
          isLoading={loading}
          canExport
          exportFilename="my-tasks"
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Новая задача</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название задачи *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Например: Разработать функцию авторизации"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Подробное описание задачи..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project">Проект *</Label>
                <Select 
                  value={formData.projectId} 
                  onValueChange={(v) => setFormData({...formData, projectId: v})}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Выберите проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name}
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
                    <SelectItem value="todo">К выполнению</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="review">На проверке</SelectItem>
                    <SelectItem value="done">Завершено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Приоритет</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v) => setFormData({...formData, priority: v})}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="critical">Критичный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estimatedHours">Оценка (ч)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Срок</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={api.loading}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.projectId || api.loading}>
              {api.loading ? "Создание..." : "Создать задачу"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать задачу</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Название задачи *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Например: Разработать функцию авторизации"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Подробное описание задачи..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-project">Проект *</Label>
                <Select 
                  value={formData.projectId} 
                  onValueChange={(v) => setFormData({...formData, projectId: v})}
                >
                  <SelectTrigger id="edit-project">
                    <SelectValue placeholder="Выберите проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name}
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
                    <SelectItem value="todo">К выполнению</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="review">На проверке</SelectItem>
                    <SelectItem value="done">Завершено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Приоритет</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v) => setFormData({...formData, priority: v})}
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="critical">Критичный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-estimatedHours">Оценка (ч)</Label>
                <Input
                  id="edit-estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-dueDate">Срок</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={api.loading}>
              Отмена
            </Button>
            <Button onClick={handleEditSubmit} disabled={!formData.name || !formData.projectId || api.loading}>
              {api.loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
