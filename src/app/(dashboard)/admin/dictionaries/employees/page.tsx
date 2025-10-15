"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ColumnDefinition } from "@/types/table"
import { Users } from "lucide-react"
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/lib/hooks/use-employees"
import { useDirections } from "@/lib/hooks/use-directions"

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  position: string;
  directionId: string;
  defaultHourlyRate?: number;
}

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    directionId: "",
    defaultHourlyRate: 0
  })

  const { data: empResult, isLoading: loadingEmployees } = useEmployees({ search: searchQuery, page: currentPage, limit: 20 })
  const { data: dirResult } = useDirections()
  
  const employees = empResult?.data || []
  const directions = dirResult?.data || []
  
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const columns: ColumnDefinition<Employee>[] = [
    { id: "fullName", label: "ФИО", key: "fullName", sortable: true },
    { id: "position", label: "Должность", key: "position" },
    { id: "email", label: "Email", key: "email" },
    { id: "phone", label: "Телефон", key: "phone", render: (v) => v || "—" },
    { id: "defaultHourlyRate", label: "Ставка (₽/ч)", key: "defaultHourlyRate", render: (v) => v ? `${v.toLocaleString('ru-RU')} ₽` : "—" },
  ]

  const handleAdd = () => {
    setFormData({ fullName: "", email: "", phone: "", position: "", directionId: "", defaultHourlyRate: 0 })
    setIsDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({ fullName: employee.fullName, email: employee.email, phone: employee.phone || "", position: employee.position, directionId: employee.directionId, defaultHourlyRate: employee.defaultHourlyRate || 0 })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.position || !formData.directionId) return
    createEmployee.mutate(formData, { onSuccess: () => { setIsDialogOpen(false); setFormData({ fullName: "", email: "", phone: "", position: "", directionId: "", defaultHourlyRate: 0 }) } })
  }

  const handleEditSubmit = async () => {
    if (!editingEmployee || !formData.fullName || !formData.email || !formData.position || !formData.directionId) return
    updateEmployee.mutate({ id: editingEmployee.id, data: formData }, { onSuccess: () => { setIsEditDialogOpen(false); setEditingEmployee(null) } })
  }

  const handleDelete = async (employee: Employee) => {
    if (confirm(`Вы уверены, что хотите удалить сотрудника "${employee.fullName}"?`)) {
      deleteEmployee.mutate(employee.id)
    }
  }

  return (
    <div>
      <UniversalDataTable
        title="Сотрудники"
        description="Управление сотрудниками компании"
        icon={Users}
        data={employees}
        columns={columns}
        isLoading={loadingEmployees}
        searchPlaceholder="Поиск сотрудников..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Создать сотрудника"
        canExport
        exportFilename="employees"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Создать сотрудника</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="fullName">ФИО *</Label><Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Иванов Иван Иванович" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="ivanov@credos.ru" /></div>
              <div className="grid gap-2"><Label htmlFor="phone">Телефон</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+7 (999) 123-45-67" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="position">Должность *</Label><Input id="position" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} placeholder="Инженер ИБ" /></div>
              <div className="grid gap-2"><Label htmlFor="direction">Направление *</Label><Select value={formData.directionId} onValueChange={(v) => setFormData({...formData, directionId: v})}><SelectTrigger id="direction"><SelectValue placeholder="Выберите направление" /></SelectTrigger><SelectContent>{directions.map((dir) => (<SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><Label htmlFor="hourlyRate">Часовая ставка (₽/ч)</Label><Input id="hourlyRate" type="number" value={formData.defaultHourlyRate} onChange={(e) => setFormData({...formData, defaultHourlyRate: parseFloat(e.target.value) || 0})} placeholder="0" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createEmployee.isPending}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={!formData.fullName || !formData.email || !formData.position || !formData.directionId || createEmployee.isPending}>{createEmployee.isPending ? "Создание..." : "Создать"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Редактировать сотрудника</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="edit-fullName">ФИО *</Label><Input id="edit-fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Иванов Иван Иванович" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="edit-email">Email *</Label><Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="ivanov@credos.ru" /></div>
              <div className="grid gap-2"><Label htmlFor="edit-phone">Телефон</Label><Input id="edit-phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+7 (999) 123-45-67" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="edit-position">Должность *</Label><Input id="edit-position" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} placeholder="Инженер ИБ" /></div>
              <div className="grid gap-2"><Label htmlFor="edit-direction">Направление *</Label><Select value={formData.directionId} onValueChange={(v) => setFormData({...formData, directionId: v})}><SelectTrigger id="edit-direction"><SelectValue placeholder="Выберите направление" /></SelectTrigger><SelectContent>{directions.map((dir) => (<SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><Label htmlFor="edit-hourlyRate">Часовая ставка (₽/ч)</Label><Input id="edit-hourlyRate" type="number" value={formData.defaultHourlyRate} onChange={(e) => setFormData({...formData, defaultHourlyRate: parseFloat(e.target.value) || 0})} placeholder="0" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateEmployee.isPending}>Отмена</Button>
            <Button onClick={handleEditSubmit} disabled={!formData.fullName || !formData.email || !formData.position || !formData.directionId || updateEmployee.isPending}>{updateEmployee.isPending ? "Сохранение..." : "Сохранить изменения"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
