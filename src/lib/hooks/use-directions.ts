import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Direction {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  budget?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateDirectionInput {
  name: string;
  code?: string;
  description?: string;
  color?: string;
  budget?: number;
}

interface UpdateDirectionInput extends Partial<CreateDirectionInput> {}

export const directionKeys = {
  all: ['directions'] as const,
  lists: () => [...directionKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...directionKeys.lists(), { filters }] as const,
  details: () => [...directionKeys.all, 'detail'] as const,
  detail: (id: string) => [...directionKeys.details(), id] as const,
};

export function useDirections(filters?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: directionKeys.list(filters || {}),
    queryFn: async (): Promise<{ data: Direction[]; total: number; page?: number; totalPages?: number }> => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/directions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch directions');
      return response.json();
    },
  });
}

export function useDirection(id: string) {
  return useQuery({
    queryKey: directionKeys.detail(id),
    queryFn: async (): Promise<Direction> => {
      const response = await fetch(`/api/directions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch direction');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateDirection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDirectionInput): Promise<Direction> => {
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create direction');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: directionKeys.lists() });
      toast({ title: 'Успех', description: 'Направление успешно создано' });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateDirection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDirectionInput }): Promise<Direction> => {
      const response = await fetch(`/api/directions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update direction');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: directionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: directionKeys.detail(variables.id) });
      toast({ title: 'Успех', description: 'Направление успешно обновлено' });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteDirection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/directions/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete direction');
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: directionKeys.lists() });
      const previousDirections = queryClient.getQueryData<Direction[]>(directionKeys.lists());
      if (previousDirections) {
        queryClient.setQueryData<Direction[]>(
          directionKeys.lists(),
          previousDirections.filter((d) => d.id !== id)
        );
      }
      return { previousDirections };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousDirections) {
        queryClient.setQueryData(directionKeys.lists(), context.previousDirections);
      }
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Успех', description: 'Направление успешно удалено' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: directionKeys.lists() });
    },
  });
}

