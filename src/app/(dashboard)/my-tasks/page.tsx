"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ColumnDefinition } from "@/types/table"
import { CheckSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks"
import { useProjects } from "@/lib/hooks/use-projects"

interface Task {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  status: string;
  priority?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
}

export default function MyTasksPage() {
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

  // TODO: Get actual employee ID from auth session
  const MOCK_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000001"

  // React Query hooks with filter for "my tasks"
  const { data: tasksResult, isLoading: loadingTasks } = useTasks({
    assigneeId: MOCK_EMPLOYEE_ID, // Filter: только мои задачи
  })
  const { data: projectsResult, isLoading: loadingProjects } = useProjects()
  
  const tasks = tasksResult?.data || []
  const projects = projectsResult?.data || []
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

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
          low: "bg-gray-100 text-gray-800",
          medium: "bg-blue-100 text-blue-800",
          high: "bg-orange-100 text-orange-800",
          critical: "bg-red-100 text-red-800"
        }
        const labels: Record<string, string> = {
          low: "Низкий",
          medium: "Средний",
          high: "Высокий",
          critical: "Критичный"
        }
        return <Badge className={colors[row.priority || ''] || ""}>{labels[row.priority || ''] || row.priority}</Badge>
      }
    },
    { 
      id: "estimatedHours", 
      label: "Оценка (ч)", 
      key: "estimatedHours",
      render: (v) => v ? `${v}ч` : '—'
    },
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

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      name: task.name,
      description: task.description || "",
      projectId: task.projectId,
      status: task.status,
      priority: task.priority || "medium",
      estimatedHours: task.estimatedHours || 0,
      dueDate: task.dueDate || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.projectId) return

    createTask.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setFormData({
          name: "",
          description: "",
          projectId: "",
          status: "todo",
          priority: "medium",
          estimatedHours: 0,
          dueDate: ""
        })
      }
    })
  }

  const handleEditSubmit = async () => {
    if (!editingTask || !formData.name || !formData.projectId) return

    updateTask.mutate({ id: editingTask.id, data: formData }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setEditingTask(null)
      }
    })
  }

  const handleDelete = async (task: Task) => {
    if (confirm(`Вы уверены, что хотите удалить задачу "${task.name}"?`)) {
      deleteTask.mutate(task.id)
    }
  }

  const loading = loadingTasks || loadingProjects
  const isMutating = createTask.isPending || updateTask.isPending || deleteTask.isPending

  return (
    <div>
      <UniversalDataTable
        title="Мои задачи"
        description="Управление моими задачами"
        icon={CheckSquare}
        data={tasks}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Добавить задачу"
        canExport
        exportFilename="my-tasks"
        isLoading={loading || isMutating}
      />

      {/* Диалог создания */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать задачу</DialogTitle>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createTask.isPending}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.projectId || createTask.isPending}>
              {createTask.isPending ? "Создание..." : "Создать задачу"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateTask.isPending}>
              Отмена
            </Button>
            <Button onClick={handleEditSubmit} disabled={!formData.name || !formData.projectId || updateTask.isPending}>
              {updateTask.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

