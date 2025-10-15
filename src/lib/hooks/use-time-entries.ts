import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================

export interface TimeEntry {
  id: string;
  employeeId: string;
  projectId: string;
  taskId?: string;
  date: string;
  hours: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  projectName?: string;
  taskTitle?: string;
}

// ============================================================================
// Query Keys
// ============================================================================

export const timeEntryKeys = {
  all: ['time-entries'] as const,
  lists: () => [...timeEntryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...timeEntryKeys.lists(), { filters }] as const,
  details: () => [...timeEntryKeys.all, 'detail'] as const,
  detail: (id: string) => [...timeEntryKeys.details(), id] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useTimeEntries(filters?: {
  employeeId?: string;
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: timeEntryKeys.list(filters || {}),
    queryFn: async (): Promise<{ data: TimeEntry[]; total: number; page?: number; totalPages?: number }> => {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.taskId) params.append('taskId', filters.taskId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/time-entries?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch time entries');
      return response.json();
    },
  });
}

export function useTimeEntry(id: string) {
  return useQuery({
    queryKey: timeEntryKeys.detail(id),
    queryFn: async (): Promise<TimeEntry> => {
      const response = await fetch(`/api/time-entries/${id}`);
      if (!response.ok) throw new Error('Failed to fetch time entry');
      return response.json();
    },
    enabled: !!id,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create time entry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.lists() });
      toast({
        title: 'Успех',
        description: 'Запись времени создана',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message,
      });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeEntry> }) => {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update time entry');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.detail(variables.id) });
      toast({
        title: 'Успех',
        description: 'Запись времени обновлена',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message,
      });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete time entry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.lists() });
      toast({
        title: 'Успех',
        description: 'Запись времени удалена',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message,
      });
    },
  });
}

