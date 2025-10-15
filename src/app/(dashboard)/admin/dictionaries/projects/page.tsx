"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  directionId: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Планирование",
  active: "Активный",
  on_hold: "Приостановлен",
  completed: "Завершён",
  cancelled: "Отменён",
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  planning: "secondary",
  active: "default",
  on_hold: "secondary",
  completed: "default",
  cancelled: "destructive",
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    directionId: "",
    managerId: "",
    startDate: "",
    endDate: "",
    budget: 0,
    status: "planning"
  })

  const { data: projResult, isLoading: loadingProjects } = useProjects({ 
    search: searchQuery, 
    page: currentPage, 
    limit: 20 
  })
  const { data: dirResult } = useDirections()
  
  const projects = projResult?.data || []
  const directions = dirResult?.data || []
  
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const columns: ColumnDefinition<Project>[] = [
    { 
      id: "name", 
      label: "Название", 
      key: "name", 
      sortable: true 
    },
    { 
      id: "code", 
      label: "Код", 
      key: "code",
      render: (v) => v || "—"
    },
    { 
      id: "status", 
      label: "Статус", 
      key: "status",
      render: (v) => <Badge variant={STATUS_COLORS[v as string] || "default"}>{STATUS_LABELS[v as string] || v}</Badge>
    },
    { 
      id: "startDate", 
      label: "Начало", 
      key: "startDate",
      render: (v) => v ? new Date(v as string).toLocaleDateString('ru-RU') : "—"
    },
    { 
      id: "endDate", 
      label: "Окончание", 
      key: "endDate",
      render: (v) => v ? new Date(v as string).toLocaleDateString('ru-RU') : "—"
    },
    { 
      id: "budget", 
      label: "Бюджет", 
      key: "budget",
      sortable: true,
      render: (v) => v ? `${Number(v).toLocaleString('ru-RU')} ₽` : "—"
    },
  ]

  const handleAdd = () => {
    setFormData({ name: "", code: "", description: "", directionId: "", managerId: "", startDate: "", endDate: "", budget: 0, status: "planning" })
    setIsDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      code: project.code || "",
      description: project.description || "",
      directionId: project.directionId,
      managerId: project.managerId || "",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      budget: project.budget || 0,
      status: project.status
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.directionId) return
    createProject.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setFormData({ name: "", code: "", description: "", directionId: "", managerId: "", startDate: "", endDate: "", budget: 0, status: "planning" })
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

  return (
    <div>
      <UniversalDataTable
        title="Проекты"
        description="Управление проектами компании"
        icon={FolderOpen}
        data={projects}
        columns={columns}
        isLoading={loadingProjects}
        searchPlaceholder="Поиск проектов..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Создать проект"
        canExport
        exportFilename="projects"
        emptyStateTitle="Нет проектов"
        emptyStateDescription="Создайте первый проект для начала работы"
      />

      {/* Диалог создания */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  placeholder="Например: Внедрение SIEM"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Код</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="SIEM-2024"
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
                <Select value={formData.directionId} onValueChange={(v) => setFormData({...formData, directionId: v})}>
                  <SelectTrigger id="direction">
                    <SelectValue placeholder="Выберите направление" />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((dir) => (
                      <SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Статус</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
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
                <Label htmlFor="endDate">Дата окончания</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createProject.isPending}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.directionId || createProject.isPending}>
              {createProject.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования - аналогично */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать проект</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Название проекта *</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Например: Внедрение SIEM" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Код</Label>
                <Input id="edit-code" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="SIEM-2024" />
              </div>
            </div>
            <div className="grid gap-2"><Label htmlFor="edit-description">Описание</Label><Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Краткое описание проекта..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="edit-direction">Направление *</Label><Select value={formData.directionId} onValueChange={(v) => setFormData({...formData, directionId: v})}><SelectTrigger id="edit-direction"><SelectValue placeholder="Выберите направление" /></SelectTrigger><SelectContent>{directions.map((dir) => (<SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid gap-2"><Label htmlFor="edit-status">Статус</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger id="edit-status"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="edit-startDate">Дата начала</Label><Input id="edit-startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-endDate">Дата окончания</Label><Input id="edit-endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} /></div>
            </div>
            <div className="grid gap-2"><Label htmlFor="edit-budget">Бюджет (₽)</Label><Input id="edit-budget" type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || 0})} placeholder="0" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateProject.isPending}>Отмена</Button>
            <Button onClick={handleEditSubmit} disabled={!formData.name || !formData.directionId || updateProject.isPending}>{updateProject.isPending ? "Сохранение..." : "Сохранить изменения"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
