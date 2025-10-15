import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  position: string;
  directionId: string;
  defaultHourlyRate?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateEmployeeInput {
  fullName: string;
  email: string;
  phone?: string;
  position: string;
  directionId: string;
  defaultHourlyRate?: number;
}

interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {}

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...employeeKeys.lists(), { filters }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: async (): Promise<Employee[]> => {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async (): Promise<Employee> => {
      const response = await fetch(`/api/employees/${id}`);
      if (!response.ok) throw new Error('Failed to fetch employee');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateEmployeeInput): Promise<Employee> => {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create employee');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast({ title: 'Успех', description: 'Сотрудник успешно создан' });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeeInput }): Promise<Employee> => {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update employee');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
      toast({ title: 'Успех', description: 'Сотрудник успешно обновлён' });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete employee');
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });
      const previousEmployees = queryClient.getQueryData<Employee[]>(employeeKeys.lists());
      if (previousEmployees) {
        queryClient.setQueryData<Employee[]>(
          employeeKeys.lists(),
          previousEmployees.filter((e) => e.id !== id)
        );
      }
      return { previousEmployees };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeKeys.lists(), context.previousEmployees);
      }
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Успех', description: 'Сотрудник успешно удалён' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

