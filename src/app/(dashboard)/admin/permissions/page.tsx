import { PermissionsMatrixPanel } from '@/components/admin/permissions-matrix-panel';

export default function AdminPermissionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Матрица прав</h1>
        <p className="text-muted-foreground mt-2">
          Обзор прав доступа для каждой роли в системе
        </p>
      </div>

      <PermissionsMatrixPanel />
    </div>
  );
}

