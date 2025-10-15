"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Search, Edit, Trash2, Mail, Phone } from "lucide-react"
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

  const { data: employees = [], isLoading: loadingEmployees } = useEmployees()
  const { data: directions = [], isLoading: loadingDirections } = useDirections()
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const filteredEmployees = employees.filter(e =>
    e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setFormData({ fullName: "", email: "", phone: "", position: "", directionId: "", defaultHourlyRate: 0 })
    setIsDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone || "",
      position: employee.position,
      directionId: employee.directionId,
      defaultHourlyRate: employee.defaultHourlyRate || 0
    })
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.position || !formData.directionId) return
    createEmployee.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setFormData({ fullName: "", email: "", phone: "", position: "", directionId: "", defaultHourlyRate: 0 })
      }
    })
  }

  const handleEditSubmit = async () => {
    if (!editingEmployee || !formData.fullName || !formData.email || !formData.position || !formData.directionId) return
    updateEmployee.mutate({ id: editingEmployee.id, data: formData }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setEditingEmployee(null)
      }
    })
  }

  const handleDelete = async (employee: Employee) => {
    if (confirm(`Вы уверены, что хотите удалить сотрудника "${employee.fullName}"?`)) {
      deleteEmployee.mutate(employee.id)
    }
  }

  const isLoading = loadingEmployees || loadingDirections

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['PT_Sans']">Сотрудники</h1>
          <p className="text-gray-600 mt-1">Управление сотрудниками компании</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить сотрудника
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Поиск сотрудников..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-green-600" />
                    <div>
                      <CardTitle className="font-['PT_Sans']">{employee.fullName}</CardTitle>
                      <p className="text-sm text-gray-500">{employee.position}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(employee)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{employee.phone}</span>
                  </div>
                )}
                {employee.defaultHourlyRate !== undefined && employee.defaultHourlyRate > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Ставка:</span>
                    <span className="font-semibold ml-2 font-['JetBrains_Mono']">
                      {employee.defaultHourlyRate.toLocaleString('ru-RU')} ₽/ч
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалоги аналогично directions, сокращено для краткости */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">ФИО *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="ivanov@credos.ru"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="position">Должность *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="Инженер ИБ"
                />
              </div>
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hourlyRate">Часовая ставка (₽/ч)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={formData.defaultHourlyRate}
                onChange={(e) => setFormData({...formData, defaultHourlyRate: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createEmployee.isPending}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.fullName || !formData.email || !formData.position || !formData.directionId || createEmployee.isPending}
            >
              {createEmployee.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования (аналогичный) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать сотрудника</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Те же поля что и для создания */}
            <div className="grid gap-2">
              <Label htmlFor="edit-fullName">ФИО *</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="ivanov@credos.ru"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Телефон</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-position">Должность *</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="Инженер ИБ"
                />
              </div>
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-hourlyRate">Часовая ставка (₽/ч)</Label>
              <Input
                id="edit-hourlyRate"
                type="number"
                value={formData.defaultHourlyRate}
                onChange={(e) => setFormData({...formData, defaultHourlyRate: parseFloat(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateEmployee.isPending}>
              Отмена
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={!formData.fullName || !formData.email || !formData.position || !formData.directionId || updateEmployee.isPending}
            >
              {updateEmployee.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

