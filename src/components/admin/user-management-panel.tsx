'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Shield, 
  Loader2, 
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  fullName: string;
  position: string;
  directionId: string;
  direction?: {
    id: string;
    name: string;
  };
  defaultHourlyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Direction {
  id: string;
  name: string;
}

interface UserRole {
  id: string;
  role: string;
  isActive: boolean;
  grantedBy: string;
  grantedAt: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-300',
  manager: 'bg-blue-100 text-blue-800 border-blue-300',
  employee: 'bg-green-100 text-green-800 border-green-300',
  viewer: 'bg-gray-100 text-gray-800 border-gray-300',
};

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  employee: 'Сотрудник',
  viewer: 'Наблюдатель',
};

export function UserManagementPanel() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialogs state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  
  // Selected employee
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeRoles, setEmployeeRoles] = useState<UserRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    position: '',
    directionId: '',
    defaultHourlyRate: 0,
  });

  // Загрузка сотрудников
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/employees${query}`);
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data.data || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список сотрудников',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка направлений
  const fetchDirections = async () => {
    try {
      const res = await fetch('/api/directions');
      if (!res.ok) throw new Error('Failed to fetch directions');
      const data = await res.json();
      setDirections(data.data || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить направления',
        variant: 'destructive',
      });
    }
  };

  // Загрузка ролей сотрудника
  const fetchEmployeeRoles = async (employeeId: string) => {
    setLoadingRoles(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/roles`);
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setEmployeeRoles(data.roles || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить роли сотрудника',
        variant: 'destructive',
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDirections();
  }, [searchQuery]);

  // Создание сотрудника
  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to create employee');
      }
      
      toast({
        title: 'Успешно',
        description: 'Сотрудник создан',
      });
      
      setCreateDialogOpen(false);
      setFormData({
        fullName: '',
        email: '',
        position: '',
        directionId: '',
        defaultHourlyRate: 0,
      });
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать сотрудника',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Обновление сотрудника
  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to update employee');
      }
      
      toast({
        title: 'Успешно',
        description: 'Сотрудник обновлён',
      });
      
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить сотрудника',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Удаление сотрудника
  const handleDelete = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to delete employee');
      }
      
      toast({
        title: 'Успешно',
        description: 'Сотрудник удалён (деактивирован)',
      });
      
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить сотрудника',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Назначить роль
  const handleAssignRole = async (role: string) => {
    if (!selectedEmployee) return;
    
    setLoadingRoles(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to assign role');
      }
      
      toast({
        title: 'Успешно',
        description: `Роль "${roleLabels[role]}" назначена`,
      });
      
      fetchEmployeeRoles(selectedEmployee.id);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось назначить роль',
        variant: 'destructive',
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  // Отозвать роль
  const handleRevokeRole = async (role: string) => {
    if (!selectedEmployee) return;
    
    setLoadingRoles(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/roles?role=${role}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to revoke role');
      }
      
      toast({
        title: 'Успешно',
        description: `Роль "${roleLabels[role]}" отозвана`,
      });
      
      fetchEmployeeRoles(selectedEmployee.id);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отозвать роль',
        variant: 'destructive',
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  // Открыть диалог редактирования
  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      fullName: employee.fullName,
      email: employee.email,
      position: employee.position,
      directionId: employee.directionId,
      defaultHourlyRate: employee.defaultHourlyRate,
    });
    setEditDialogOpen(true);
  };

  // Открыть диалог ролей
  const openRolesDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    fetchEmployeeRoles(employee.id);
    setRolesDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Поиск и кнопка создания */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, email или должности..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить сотрудника
        </Button>
      </div>

      {/* Таблица сотрудников */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Должность</TableHead>
              <TableHead>Направление</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Сотрудники не найдены
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.fullName}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.direction?.name || '—'}</TableCell>
                  <TableCell>
                    {employee.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Активен
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Неактивен
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRolesDialog(employee)}
                      title="Управление ролями"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(employee)}
                      title="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setDeleteDialogOpen(true);
                      }}
                      title="Удалить"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Диалог создания сотрудника */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
            <DialogDescription>
              Создание нового сотрудника в системе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">ФИО</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ivanov@company.ru"
              />
            </div>
            <div>
              <Label htmlFor="position">Должность</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Специалист"
              />
            </div>
            <div>
              <Label htmlFor="directionId">Направление</Label>
              <Select
                value={formData.directionId}
                onValueChange={(value) => setFormData({ ...formData, directionId: value })}
              >
                <SelectTrigger id="directionId">
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
            <div>
              <Label htmlFor="hourlyRate">Базовая ставка (₽/час)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={formData.defaultHourlyRate}
                onChange={(e) =>
                  setFormData({ ...formData, defaultHourlyRate: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования сотрудника */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать сотрудника</DialogTitle>
            <DialogDescription>
              Изменение данных сотрудника
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-fullName">ФИО</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-position">Должность</Label>
              <Input
                id="edit-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-directionId">Направление</Label>
              <Select
                value={formData.directionId}
                onValueChange={(value) => setFormData({ ...formData, directionId: value })}
              >
                <SelectTrigger id="edit-directionId">
                  <SelectValue />
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
            <div>
              <Label htmlFor="edit-hourlyRate">Базовая ставка (₽/час)</Label>
              <Input
                id="edit-hourlyRate"
                type="number"
                value={formData.defaultHourlyRate}
                onChange={(e) =>
                  setFormData({ ...formData, defaultHourlyRate: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить сотрудника?</DialogTitle>
            <DialogDescription>
              Вы уверены что хотите удалить (деактивировать) сотрудника{' '}
              <strong>{selectedEmployee?.fullName}</strong>?
              <br />
              <br />
              Это действие установит is_active = false. Восстановить можно через редактирование.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог управления ролями */}
      <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Управление ролями</DialogTitle>
            <DialogDescription>
              Сотрудник: <strong>{selectedEmployee?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingRoles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {(['admin', 'manager', 'employee', 'viewer'] as const).map((role) => {
                  const hasRole = employeeRoles.some((r) => r.role === role && r.isActive);
                  return (
                    <div
                      key={role}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={roleColors[role]}>
                          {roleLabels[role]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {hasRole ? 'Назначена' : 'Не назначена'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={hasRole ? 'destructive' : 'default'}
                        onClick={() => (hasRole ? handleRevokeRole(role) : handleAssignRole(role))}
                        disabled={loadingRoles}
                      >
                        {hasRole ? 'Отозвать' : 'Назначить'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setRolesDialogOpen(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

