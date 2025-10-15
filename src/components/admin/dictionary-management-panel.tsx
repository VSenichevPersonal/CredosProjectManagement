"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ColumnDefinition } from "@/types/table"
import type { LucideIcon } from "lucide-react"

export interface DictionaryField {
  id: string
  label: string
  type: "text" | "number" | "textarea" | "email" | "url" | "boolean"
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export interface DictionaryConfig<T = any> {
  title: string
  description: string
  icon: LucideIcon
  apiPath: string
  fields: DictionaryField[]
  columns: ColumnDefinition<T>[]
  searchPlaceholder?: string
  canToggleActive?: boolean
}

interface DictionaryManagementPanelProps<T extends Record<string, any>> {
  config: DictionaryConfig<T>
}

export function DictionaryManagementPanel<T extends Record<string, any>>({
  config,
}: DictionaryManagementPanelProps<T>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState("")
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: result, isLoading } = useQuery({
    queryKey: [config.apiPath, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      
      const response = await fetch(`${config.apiPath}?${params}`)
      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized")
        throw new Error("Failed to fetch data")
      }
      const data = await response.json()
      if (!data || !Array.isArray(data.data)) {
        return { data: [], total: 0 }
      }
      return data
    },
  })

  const items = result?.data || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const response = await fetch(config.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.apiPath] })
      toast({ title: "Успех", description: `${config.title} успешно создан` })
      setIsDialogOpen(false)
      setFormData({})
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const response = await fetch(`${config.apiPath}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.apiPath] })
      toast({ title: "Успех", description: `${config.title} успешно обновлён` })
      setIsEditDialogOpen(false)
      setEditingItem(null)
      setFormData({})
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${config.apiPath}/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.apiPath] })
      toast({ title: "Успех", description: `${config.title} успешно удалён` })
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" })
    },
  })

  const handleAdd = () => {
    const initialData: Record<string, any> = {}
    config.fields.forEach((field) => {
      if (field.type === "boolean") {
        initialData[field.id] = true
      } else if (field.type === "number") {
        initialData[field.id] = field.min || 0
      } else {
        initialData[field.id] = ""
      }
    })
    setFormData(initialData)
    setIsDialogOpen(true)
  }

  const handleEdit = (item: T) => {
    setEditingItem(item)
    const editData: Record<string, any> = {}
    config.fields.forEach((field) => {
      editData[field.id] = item[field.id] !== undefined ? item[field.id] : ""
    })
    setFormData(editData)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (item: T) => {
    if (confirm(`Вы уверены, что хотите удалить "${item.name}"?`)) {
      deleteMutation.mutate(item.id)
    }
  }

  const handleSubmit = () => {
    // Validate required fields
    const missingFields = config.fields
      .filter((f) => f.required && !formData[f.id])
      .map((f) => f.label)
    
    if (missingFields.length > 0) {
      toast({
        title: "Ошибка",
        description: `Заполните обязательные поля: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    createMutation.mutate(formData)
  }

  const handleEditSubmit = () => {
    if (!editingItem) return

    // Validate required fields
    const missingFields = config.fields
      .filter((f) => f.required && !formData[f.id])
      .map((f) => f.label)
    
    if (missingFields.length > 0) {
      toast({
        title: "Ошибка",
        description: `Заполните обязательные поля: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    updateMutation.mutate({ id: editingItem.id, data: formData })
  }

  const renderField = (field: DictionaryField, value: any, onChange: (value: any) => void) => {
    if (field.type === "boolean") {
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={field.id}
            checked={value}
            onCheckedChange={onChange}
          />
          <Label htmlFor={field.id}>{field.label}</Label>
        </div>
      )
    }

    if (field.type === "textarea") {
      return (
        <div className="grid gap-2">
          <Label htmlFor={field.id}>
            {field.label} {field.required && "*"}
          </Label>
          <Textarea
            id={field.id}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        </div>
      )
    }

    return (
      <div className="grid gap-2">
        <Label htmlFor={field.id}>
          {field.label} {field.required && "*"}
        </Label>
        <Input
          id={field.id}
          type={field.type}
          value={value || ""}
          onChange={(e) => {
            const val = field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
            onChange(val)
          }}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      </div>
    )
  }

  return (
    <>
      <UniversalDataTable
        title={config.title}
        description={config.description}
        icon={config.icon}
        data={items}
        columns={config.columns}
        isLoading={isLoading}
        searchPlaceholder={config.searchPlaceholder || `Поиск ${config.title.toLowerCase()}...`}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel={`Добавить ${config.title.toLowerCase()}`}
        canExport
        exportFilename={config.apiPath.replace("/api/", "")}
        emptyStateTitle={`Нет ${config.title.toLowerCase()}`}
        emptyStateDescription={`Добавьте первый элемент`}
      />

      {/* Диалог создания */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить {config.title.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {config.fields.map((field) =>
              renderField(field, formData[field.id], (value) =>
                setFormData({ ...formData, [field.id]: value })
              )
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать {config.title.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {config.fields.map((field) =>
              renderField(field, formData[field.id], (value) =>
                setFormData({ ...formData, [field.id]: value })
              )
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              Отмена
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

