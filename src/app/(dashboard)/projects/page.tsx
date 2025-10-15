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
import { FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/lib/hooks/use-projects"
import { useDirections } from "@/lib/hooks/use-directions"

interface Project {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  directionId: string;
}

export default function ProjectsPage() {
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

  // React Query hooks
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: directions = [], isLoading: loadingDirections } = useDirections()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

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
    { 
      id: "code", 
      label: "Код", 
      key: "code" 
    },
    { 
      id: "totalBudget", 
      label: "Бюджет", 
      key: "totalBudget",
      render: (v) => v ? `${Number(v).toLocaleString('ru-RU')} ₽` : '—'
    },
  ]

  const handleAdd = () => {
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
    setIsDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      code: project.code || "",
      description: project.description || "",
      status: project.status,
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      totalBudget: project.totalBudget || 0,
      directionId: project.directionId
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.directionId) return

    createProject.mutate(formData, {
      onSuccess: () => {
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
      }
    })
  }

  const handleEditSubmit = async () => {
    if (!editingProject || !formData.name || !formData.directionId) return

    updateProject.mutate({ id: editingProject.id, data: formData }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setEditingProject(null)
      }
    })
  }

  const handleDelete = async (project: Project) => {
    if (confirm(`Вы уверены, что хотите удалить проект "${project.name}"?`)) {
      deleteProject.mutate(project.id)
    }
  }

  const loading = loadingProjects || loadingDirections
  const isMutating = createProject.isPending || updateProject.isPending || deleteProject.isPending

  return (
    <div>
      <UniversalDataTable
        title="Проекты"
        description="Управление проектами компании"
        icon={FolderOpen}
        data={projects}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Создать проект"
        canExport
        exportFilename="projects"
        isLoading={loading || isMutating}
      />

      {/* Диалог создания */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать проект</DialogTitle>
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
                onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createProject.isPending}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.directionId || createProject.isPending}>
              {createProject.isPending ? "Создание..." : "Создать проект"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateProject.isPending}>
              Отмена
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={!formData.name || !formData.directionId || updateProject.isPending}
            >
              {updateProject.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

