'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoleInfo {
  name: string;
  description: string;
}

interface PermissionsMatrix {
  roles: Record<string, RoleInfo>;
  matrix: Record<string, {
    info: RoleInfo;
    permissions: string[];
  }>;
  allPermissions: string[];
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-300',
  manager: 'bg-blue-100 text-blue-800 border-blue-300',
  employee: 'bg-green-100 text-green-800 border-green-300',
  viewer: 'bg-gray-100 text-gray-800 border-gray-300',
};

// Группировка прав по категориям
const permissionCategories: Record<string, string[]> = {
  'Направления': ['directions:read', 'directions:create', 'directions:update', 'directions:delete'],
  'Сотрудники': ['employees:read', 'employees:read_all', 'employees:read_own', 'employees:create', 'employees:update', 'employees:update_own', 'employees:delete'],
  'Проекты': ['projects:read', 'projects:read_all', 'projects:read_own', 'projects:create', 'projects:update', 'projects:update_own', 'projects:delete'],
  'Задачи': ['tasks:read', 'tasks:read_all', 'tasks:read_own', 'tasks:create', 'tasks:update', 'tasks:update_own', 'tasks:delete'],
  'Учёт времени': ['time_entries:read', 'time_entries:read_all', 'time_entries:read_own', 'time_entries:create', 'time_entries:create_own', 'time_entries:update', 'time_entries:update_own', 'time_entries:delete', 'time_entries:delete_own'],
  'Отчёты': ['reports:view', 'reports:view_all', 'reports:view_own', 'reports:export'],
  'Управление ролями': ['user_roles:read', 'user_roles:manage'],
};

export function PermissionsMatrixPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [matrix, setMatrix] = useState<PermissionsMatrix | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPermissionsMatrix();
  }, []);

  const fetchPermissionsMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/permissions');
      if (!res.ok) throw new Error('Failed to fetch permissions matrix');
      const data = await res.json();
      setMatrix(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить матрицу прав',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Не удалось загрузить данные
      </div>
    );
  }

  const roles = Object.keys(matrix.roles);

  // Фильтрация категорий по поисковому запросу
  const filteredCategories = Object.entries(permissionCategories).filter(([category, permissions]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.toLowerCase().includes(query) ||
      permissions.some((p) => p.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Карточки с описанием ролей */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card key={role} className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={roleColors[role]}>
                  {matrix.roles[role].name}
                </Badge>
              </CardTitle>
              <CardDescription>{matrix.roles[role].description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Прав: <strong>{matrix.matrix[role].permissions.length}</strong>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Поиск по правам */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по категориям или правам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Матрица прав по категориям */}
      <div className="space-y-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ничего не найдено по запросу "{searchQuery}"
          </div>
        ) : (
          filteredCategories.map(([category, permissions]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
                <CardDescription>
                  {permissions.length} {permissions.length === 1 ? 'право' : 'прав'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Право</th>
                        {roles.map((role) => (
                          <th key={role} className="text-center py-2 px-3">
                            <Badge variant="outline" className={roleColors[role]}>
                              {matrix.roles[role].name}
                            </Badge>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission) => (
                        <tr key={permission} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3 font-mono text-sm">{permission}</td>
                          {roles.map((role) => {
                            const hasPermission = matrix.matrix[role].permissions.includes(permission);
                            return (
                              <td key={role} className="text-center py-2 px-3">
                                {hasPermission ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Легенда */}
      <Card>
        <CardHeader>
          <CardTitle>Легенда</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm">Право предоставлено</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gray-300" />
            <span className="text-sm">Право не предоставлено</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

