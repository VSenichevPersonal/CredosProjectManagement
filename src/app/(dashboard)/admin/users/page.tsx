import { UserManagementPanel } from '@/components/admin/user-management-panel';

export default function AdminUsersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управление пользователями</h1>
        <p className="text-muted-foreground mt-2">
          Создание, редактирование и управление ролями сотрудников
        </p>
      </div>

      <UserManagementPanel />
    </div>
  );
}

