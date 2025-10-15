"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ColumnDefinition } from "@/types/table"
import { Calendar, List, Clock } from "lucide-react"
import WeeklyTimesheet from "@/components/time-tracking/WeeklyTimesheet"
import { useTimeEntries, useCreateTimeEntry, useUpdateTimeEntry, useDeleteTimeEntry, type TimeEntry } from "@/lib/hooks/use-time-entries"
import { useProjects } from "@/lib/hooks/use-projects"
import { useTasks } from "@/lib/hooks/use-tasks"

// TODO: Get actual employee ID from auth session
const MOCK_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000001"

export default function MyTimePage() {
  const [activeTab, setActiveTab] = useState("weekly")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [formData, setFormData] = useState({
    employeeId: MOCK_EMPLOYEE_ID,
    projectId: "",
    taskId: "",
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    description: ""
  })

  // Data fetching
  const { data: entriesResult, isLoading: loadingEntries } = useTimeEntries({
    employeeId: MOCK_EMPLOYEE_ID,
    page: currentPage,
    limit: 20
  })
  const { data: projectsResult } = useProjects()
  const { data: tasksResult } = useTasks()

  const timeEntries = entriesResult?.data || []
  const projects = projectsResult?.data || []
  const tasks = tasksResult?.data || []

  const createEntry = useCreateTimeEntry()
  const updateEntry = useUpdateTimeEntry()
  const deleteEntry = useDeleteTimeEntry()

  // Table columns
  const columns: ColumnDefinition<TimeEntry>[] = [
    {
      id: "date",
      label: "Дата",
      key: "date",
      sortable: true,
      render: (v) => new Date(v as string).toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    },
    {
      id: "projectName",
      label: "Проект",
      key: "projectName",
      render: (v, row) => {
        const project = projects.find(p => p.id === row.projectId)
        return project?.name || "—"
      }
    },
    {
      id: "taskTitle",
      label: "Задача",
      key: "taskTitle",
      render: (v, row) => {
        if (!row.taskId) return "—"
        const task = tasks.find(t => t.id === row.taskId)
        return task?.title || "—"
      }
    },
    {
      id: "hours",
      label: "Часы",
      key: "hours",
      sortable: true,
      render: (v) => `${Number(v).toFixed(1)} ч`
    },
    {
      id: "description",
      label: "Описание",
      key: "description",
      render: (v) => v || "—"
    },
  ]

  const handleAdd = () => {
    setFormData({
      employeeId: MOCK_EMPLOYEE_ID,
      projectId: "",
      taskId: "",
      date: new Date().toISOString().split('T')[0],
      hours: 0,
      description: ""
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setFormData({
      employeeId: entry.employeeId,
      projectId: entry.projectId,
      taskId: entry.taskId || "",
      date: entry.date,
      hours: entry.hours,
      description: entry.description || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.projectId || !formData.date || formData.hours <= 0) return
    createEntry.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setFormData({
          employeeId: MOCK_EMPLOYEE_ID,
          projectId: "",
          taskId: "",
          date: new Date().toISOString().split('T')[0],
          hours: 0,
          description: ""
        })
      }
    })
  }

  const handleEditSubmit = async () => {
    if (!editingEntry || !formData.projectId || !formData.date || formData.hours <= 0) return
    updateEntry.mutate({ id: editingEntry.id, data: formData }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setEditingEntry(null)
      }
    })
  }

  const handleDelete = async (entry: TimeEntry) => {
    if (confirm(`Вы уверены, что хотите удалить запись ${entry.hours} часов за ${new Date(entry.date).toLocaleDateString('ru-RU')}?`)) {
      deleteEntry.mutate(entry.id)
    }
  }

  const filteredTasks = tasks.filter(t => formData.projectId ? t.projectId === formData.projectId : true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['PT_Sans']">Учёт времени</h1>
          <p className="text-gray-600 mt-1">
            Управление рабочим временем и табелями
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weekly" className="gap-2">
            <Calendar className="h-4 w-4" />
            Недельный табель
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Список записей
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyTimesheet employeeId={MOCK_EMPLOYEE_ID} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <UniversalDataTable
            title="Записи времени"
            description="Все записи учёта рабочего времени"
            icon={Clock}
            data={timeEntries}
            columns={columns}
            isLoading={loadingEntries}
            searchPlaceholder="Поиск записей..."
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            addButtonLabel="Добавить запись"
            canExport
            exportFilename="time-entries"
            emptyStateTitle="Нет записей времени"
            emptyStateDescription="Добавьте первую запись или используйте недельный табель"
          />

          {/* Диалог создания */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить запись времени</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Дата *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project">Проект *</Label>
                  <Select value={formData.projectId} onValueChange={(v) => setFormData({...formData, projectId: v, taskId: ""})}>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Выберите проект" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task">Задача</Label>
                  <Select value={formData.taskId} onValueChange={(v) => setFormData({...formData, taskId: v})} disabled={!formData.projectId}>
                    <SelectTrigger id="task">
                      <SelectValue placeholder="Выберите задачу" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTasks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hours">Часы *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="24"
                    value={formData.hours}
                    onChange={(e) => setFormData({...formData, hours: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Что было сделано..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createEntry.isPending}>
                  Отмена
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.projectId || !formData.date || formData.hours <= 0 || createEntry.isPending}>
                  {createEntry.isPending ? "Создание..." : "Создать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Диалог редактирования */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Редактировать запись времени</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="edit-date">Дата *</Label><Input id="edit-date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-project">Проект *</Label><Select value={formData.projectId} onValueChange={(v) => setFormData({...formData, projectId: v, taskId: ""})}><SelectTrigger id="edit-project"><SelectValue placeholder="Выберите проект" /></SelectTrigger><SelectContent>{projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="grid gap-2"><Label htmlFor="edit-task">Задача</Label><Select value={formData.taskId} onValueChange={(v) => setFormData({...formData, taskId: v})} disabled={!formData.projectId}><SelectTrigger id="edit-task"><SelectValue placeholder="Выберите задачу" /></SelectTrigger><SelectContent>{filteredTasks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>))}</SelectContent></Select></div>
                <div className="grid gap-2"><Label htmlFor="edit-hours">Часы *</Label><Input id="edit-hours" type="number" step="0.5" min="0.1" max="24" value={formData.hours} onChange={(e) => setFormData({...formData, hours: parseFloat(e.target.value) || 0})} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-description">Описание</Label><Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Что было сделано..." rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateEntry.isPending}>Отмена</Button>
                <Button onClick={handleEditSubmit} disabled={!formData.projectId || !formData.date || formData.hours <= 0 || updateEntry.isPending}>{updateEntry.isPending ? "Сохранение..." : "Сохранить"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}

