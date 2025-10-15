"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Users, Plus, Search, Edit, Trash2, Mail, Phone } from "lucide-react"
import { useApi } from "@/lib/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import type { Employee } from "@/types/domain"

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [directions, setDirections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  const api = useApi()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [employeesRes, directionsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/directions')
      ])

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data.data || [])
      }

      if (directionsRes.ok) {
        const data = await directionsRes.json()
        setDirections(data.data || [])
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

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      await api.execute('/api/employees', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      toast({
        title: "Успешно!",
        description: "Сотрудник добавлен",
      })

      setIsDialogOpen(false)
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        position: "",
        directionId: "",
        defaultHourlyRate: 0
      })
      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать сотрудника",
      })
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      fullName: employee.fullName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      position: employee.position || "",
      directionId: employee.directionId || "",
      defaultHourlyRate: employee.defaultHourlyRate || 0
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingEmployee) return

    try {
      await api.execute(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })

      toast({
        title: "Успешно!",
        description: "Данные сотрудника обновлены",
      })

      setIsEditDialogOpen(false)
      setEditingEmployee(null)
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        position: "",
        directionId: "",
        defaultHourlyRate: 0
      })
      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить данные сотрудника",
      })
    }
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Удалить сотрудника "${employee.fullName}"?`)) return

    try {
      await api.execute(`/api/employees/${employee.id}`, {
        method: 'DELETE',
      })

      toast({
        title: "Успешно!",
        description: "Сотрудник удален",
      })

      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить сотрудника",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-credos-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка сотрудников...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Сотрудники</h1>
            <p className="text-gray-600 mt-1">Справочник сотрудников компании</p>
          </div>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Добавить сотрудника
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, email или должности..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        <div className="grid gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-credos-muted flex items-center justify-center">
                      <Users className="h-6 w-6 text-credos-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{employee.fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(employee)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{employee.email}</span>
                  </div>
                  {employee.defaultHourlyRate > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-muted-foreground">
                        Ставка: <span className="font-medium">{employee.defaultHourlyRate} ₽/ч</span>
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Сотрудники не найдены</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery ? "Попробуйте изменить поисковый запрос" : "Добавьте первого сотрудника"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Новый сотрудник</DialogTitle>
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
                onChange={(e) => setFormData({...formData, defaultHourlyRate: parseFloat(e.target.value)})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={api.loading}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.fullName || !formData.email || !formData.position || !formData.directionId || api.loading}
            >
              {api.loading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать сотрудника</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={api.loading}>
              Отмена
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={!formData.fullName || !formData.email || !formData.position || !formData.directionId || api.loading}
            >
              {api.loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
