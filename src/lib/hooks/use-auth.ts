import { useQuery } from '@tanstack/react-query';
import { type UserRole, type Permission } from '@/lib/access-control/permissions';

// ============================================================================
// Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  employeeId: string;
  roles: UserRole[];
  permissions: Permission[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Получить текущего пользователя и его права
 */
export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async (): Promise<AuthUser> => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to fetch current user');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: false, // Не пытаемся повторно если 401
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    
    // Role checks
    isAdmin: user?.roles.includes('admin') ?? false,
    isManager: user?.roles.includes('manager') ?? false,
    isEmployee: user?.roles.includes('employee') ?? false,
    isViewer: user?.roles.includes('viewer') ?? false,
    
    // Helper functions
    hasRole: (role: UserRole) => user?.roles.includes(role) ?? false,
    hasPermission: (permission: Permission) => user?.permissions.includes(permission) ?? false,
    hasAnyPermission: (permissions: Permission[]) => 
      permissions.some(p => user?.permissions.includes(p) ?? false),
    hasAllPermissions: (permissions: Permission[]) => 
      permissions.every(p => user?.permissions.includes(p) ?? false),
    
    // Entity access checks
    canReadAllEmployees: () => user?.permissions.includes('employees:read_all') ?? false,
    canCreateProject: () => user?.permissions.includes('projects:create') ?? false,
    canDeleteTask: () => user?.permissions.includes('tasks:delete') ?? false,
    canViewAllReports: () => user?.permissions.includes('reports:view_all') ?? false,
    canManageRoles: () => user?.permissions.includes('user_roles:manage') ?? false,
  };
}

/**
 * HOC для защиты компонентов по роли
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: P) {
    const { hasRole, isLoading } = useAuth();

    if (isLoading) {
      return <div>Загрузка...</div> as any;
    }

    if (!hasRole(requiredRole)) {
      return (fallback || <div>Доступ запрещён</div>) as any;
    }

    return <Component {...props} />;
  };
}

/**
 * HOC для защиты компонентов по разрешению
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: Permission,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission, isLoading } = useAuth();

    if (isLoading) {
      return <div>Загрузка...</div>;
    }

    if (!hasPermission(requiredPermission)) {
      return fallback || <div>Доступ запрещён</div>;
    }

    return <Component {...props} />;
  };
}

/**
 * Компонент для условного рендеринга по роли
 */
export function RequireRole({ 
  role, 
  children, 
  fallback 
}: { 
  role: UserRole; 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) return null;
  if (!hasRole(role)) return fallback || null;
  
  return <>{children}</>;
}

/**
 * Компонент для условного рендеринга по разрешению
 */
export function RequirePermission({ 
  permission, 
  children, 
  fallback 
}: { 
  permission: Permission; 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) return null;
  if (!hasPermission(permission)) return fallback || null;
  
  return <>{children}</>;
}

/**
 * Компонент: показывать только админам
 */
export function AdminOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) {
  return <RequireRole role="admin" fallback={fallback}>{children}</RequireRole>;
}

/**
 * Компонент: показывать только менеджерам и админам
 */
export function ManagerOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) {
  const { isAdmin, isManager, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAdmin && !isManager) return fallback || null;
  
  return <>{children}</>;
}

