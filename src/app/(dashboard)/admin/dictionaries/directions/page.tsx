"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"
import type { ColumnDefinition } from "@/types/table"
import { Building2 } from "lucide-react"
import { useDirections, useCreateDirection, useUpdateDirection, useDeleteDirection } from "@/lib/hooks/use-directions"
import { useFormValidation } from "@/lib/hooks/use-form-validation"
import { DirectionSchema } from "@/lib/validators/shared-schemas"

interface Direction {
  id: string;
  name: string;
  code?: string;
  description?: string;
  budget?: number;
}

export default function DirectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDirection, setEditingDirection] = useState<Direction | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    budget: 0
  })

  // Validation
  const { errors, validateField, validateForm, clearErrors } = useFormValidation(DirectionSchema)

  // React Query hooks с server-side search
  const { data: result, isLoading } = useDirections({
    search: searchQuery,
    page: currentPage,
    limit: 20
  })
  
  const directions = result?.data || []
  const total = result?.total || 0
  
  const createDirection = useCreateDirection()
  const updateDirection = useUpdateDirection()
  const deleteDirection = useDeleteDirection()

  const columns: ColumnDefinition<Direction>[] = [
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
      id: "description", 
      label: "Описание", 
      key: "description",
      render: (v) => v || "—"
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
    setFormData({ name: "", code: "", description: "", budget: 0 })
    clearErrors()
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
    clearErrors()
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm(formData)) return
    
    createDirection.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setFormData({ name: "", code: "", description: "", budget: 0 })
        clearErrors()
      }
    })
  }

  const handleEditSubmit = async () => {
    if (!editingDirection) return
    
    // Validate form
    if (!validateForm(formData)) return
    
    updateDirection.mutate({ id: editingDirection.id, data: formData }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setEditingDirection(null)
        clearErrors()
      }
    })
  }

  const handleDelete = async (direction: Direction) => {
    if (confirm(`Вы уверены, что хотите удалить направление "${direction.name}"?`)) {
      deleteDirection.mutate(direction.id)
    }
  }

  return (
    <div>
      <UniversalDataTable
        title="Направления"
        description="Управление направлениями деятельности компании"
        icon={Building2}
        data={directions}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Поиск направлений..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Создать направление"
        canExport
        exportFilename="directions"
        emptyStateTitle="Нет направлений"
        emptyStateDescription="Создайте первое направление для начала работы"
      />

      {/* Диалог создания */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать направление</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField label="Название направления *" error={errors.name}>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value})
                  validateField('name', e.target.value)
                }}
                placeholder="Например: Информационная безопасность"
                className={errors.name ? 'border-red-500' : ''}
              />
            </FormField>
            
            <FormField label="Код" error={errors.code}>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => {
                  setFormData({...formData, code: e.target.value})
                  validateField('code', e.target.value)
                }}
                placeholder="IB"
                className={errors.code ? 'border-red-500' : ''}
              />
            </FormField>
            
            <FormField label="Описание" error={errors.description}>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value})
                  validateField('description', e.target.value)
                }}
                placeholder="Краткое описание направления..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
            </FormField>
            
            <FormField label="Бюджет (₽)" error={errors.budget}>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  setFormData({...formData, budget: value})
                  validateField('budget', value)
                }}
                placeholder="0"
                className={errors.budget ? 'border-red-500' : ''}
              />
            </FormField>
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
            <FormField label="Название направления *" error={errors.name}>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value})
                  validateField('name', e.target.value)
                }}
                placeholder="Например: Информационная безопасность"
                className={errors.name ? 'border-red-500' : ''}
              />
            </FormField>
            
            <FormField label="Код" error={errors.code}>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => {
                  setFormData({...formData, code: e.target.value})
                  validateField('code', e.target.value)
                }}
                placeholder="IB"
                className={errors.code ? 'border-red-500' : ''}
              />
            </FormField>
            
            <FormField label="Описание" error={errors.description}>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value})
                  validateField('description', e.target.value)
                }}
                placeholder="Краткое описание направления..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
            </FormField>
            
            <FormField label="Бюджет (₽)" error={errors.budget}>
              <Input
                id="edit-budget"
                type="number"
                value={formData.budget}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  setFormData({...formData, budget: value})
                  validateField('budget', value)
                }}
                placeholder="0"
                className={errors.budget ? 'border-red-500' : ''}
              />
            </FormField>
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
