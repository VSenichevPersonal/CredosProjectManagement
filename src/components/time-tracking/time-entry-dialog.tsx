"use client"

/**
 * @intent: Dialog for creating/editing time entries - core function of Credos PM
 * @llm-note: Optimized for quick time entry with minimal clicks
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Clock, Plus, Save } from "lucide-react"
// import { toast } from "sonner" // TODO: Install sonner or use another toast library

interface TimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  employeeId?: string
  projectId?: string
  taskId?: string
  date?: string
}

interface Project {
  id: string
  name: string
  clientName: string
  status: string
}

interface Task {
  id: string
  name: string
  projectId: string
}

export function TimeEntryDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  employeeId,
  projectId: initialProjectId,
  taskId: initialTaskId,
  date: initialDate
}: TimeEntryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "")
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || "")
  
  const [formData, setFormData] = useState({
    projectId: initialProjectId || "",
    taskId: initialTaskId || "",
    employeeId: employeeId || "",
    date: initialDate || new Date().toISOString().split('T')[0],
    hours: 8,
    description: "",
    billable: true,
  })

  // Load projects on mount
  useEffect(() => {
    if (open) {
      loadProjects()
      if (selectedProjectId) {
        loadTasks(selectedProjectId)
      }
    }
  }, [open, selectedProjectId])

  const loadProjects = async () => {
    try {
      // TODO: Replace with actual API call
      const mockProjects: Project[] = [
        { id: "1", name: "Внедрение СКЗИ", clientName: "ООО Рога и Копыта", status: "active" },
        { id: "2", name: "Настройка ИБ", clientName: "ПАО Газпром", status: "active" },
        { id: "3", name: "Разработка документации", clientName: "Минцифры", status: "planning" },
      ]
      setProjects(mockProjects)
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  const loadTasks = async (projectId: string) => {
    try {
      // TODO: Replace with actual API call
      const mockTasks: Task[] = [
        { id: "1", name: "Анализ требований", projectId },
        { id: "2", name: "Разработка архитектуры", projectId },
        { id: "3", name: "Тестирование", projectId },
        { id: "4", name: "Внедрение", projectId },
      ]
      setTasks(mockTasks)
    } catch (error) {
      console.error("Error loading tasks:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Replace with actual API call
      console.log("Creating time entry:", formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert("Время успешно добавлено")
      onSuccess?.()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        projectId: "",
        taskId: "",
        employeeId: employeeId || "",
        date: new Date().toISOString().split('T')[0],
        hours: 8,
        description: "",
        billable: true,
      })
    } catch (error) {
      console.error("Error creating time entry:", error)
      alert("Ошибка при добавлении времени")
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId("")
    setFormData(prev => ({ ...prev, projectId, taskId: "" }))
    loadTasks(projectId)
  }

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId)
    setFormData(prev => ({ ...prev, taskId }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Добавить время
          </DialogTitle>
          <DialogDescription>
            Введите время, потраченное на проект
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Дата *</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Часы *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                required
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Проект *</Label>
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите проект" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.clientName}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProjectId && (
            <div className="space-y-2">
              <Label htmlFor="task">Задача</Label>
              <Select value={selectedTaskId} onValueChange={handleTaskChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите задачу (необязательно)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без задачи</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Описание работы *</Label>
            <Textarea
              id="description"
              placeholder="Опишите что было сделано..."
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
