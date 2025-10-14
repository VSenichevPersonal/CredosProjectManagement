import { ExecutionContext } from '@/lib/context/execution-context';
import { Task } from '@/types/domain';
import { DatabaseProvider } from '@/providers/database-provider.interface';

export interface CreateTaskDTO {
  name: string;
  description?: string;
  projectId: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  dueDate?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface UpdateTaskDTO {
  name?: string;
  description?: string;
  assigneeId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  priority?: string;
  status?: string;
  search?: string;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
}

export class TaskService {
  constructor(private db: DatabaseProvider) {}

  /**
   * Получить все задачи с фильтрацией
   */
  async getAllTasks(ctx: ExecutionContext, filters?: TaskFilters): Promise<Task[]> {
    // Проверяем права доступа
    if (!ctx.permissions.includes('tasks:read')) {
      throw new Error('Недостаточно прав для просмотра задач');
    }

    const tasks = await this.db.tasks.getAll(ctx);
    
    // Применяем фильтры
    let filteredTasks = tasks;
    
    if (filters?.projectId) {
      filteredTasks = filteredTasks.filter(t => t.projectId === filters.projectId);
    }
    
    if (filters?.assigneeId) {
      filteredTasks = filteredTasks.filter(t => t.assigneeId === filters.assigneeId);
    }
    
    if (filters?.priority) {
      filteredTasks = filteredTasks.filter(t => t.priority === filters.priority);
    }
    
    if (filters?.status) {
      filteredTasks = filteredTasks.filter(t => t.status === filters.status);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      );
    }

    return filteredTasks;
  }

  /**
   * Получить задачу по ID
   */
  async getTaskById(ctx: ExecutionContext, id: string): Promise<Task | null> {
    if (!ctx.permissions.includes('tasks:read')) {
      throw new Error('Недостаточно прав для просмотра задачи');
    }

    return await this.db.tasks.getById(ctx, id);
  }

  /**
   * Получить задачи по проекту
   */
  async getTasksByProject(ctx: ExecutionContext, projectId: string): Promise<Task[]> {
    if (!ctx.permissions.includes('tasks:read')) {
      throw new Error('Недостаточно прав для просмотра задач');
    }

    return await this.db.tasks.getByProjectId(ctx, projectId);
  }

  /**
   * Получить задачи сотрудника
   */
  async getTasksByAssignee(ctx: ExecutionContext, assigneeId: string): Promise<Task[]> {
    if (!ctx.permissions.includes('tasks:read')) {
      throw new Error('Недостаточно прав для просмотра задач');
    }

    // Сотрудник может видеть только свои задачи, менеджеры - все
    if (ctx.user.id !== assigneeId && !ctx.permissions.includes('tasks:read_all')) {
      throw new Error('Недостаточно прав для просмотра чужих задач');
    }

    return await this.db.tasks.getByAssigneeId(ctx, assigneeId);
  }

  /**
   * Создать новую задачу
   */
  async createTask(ctx: ExecutionContext, dto: CreateTaskDTO): Promise<Task> {
    if (!ctx.permissions.includes('tasks:create')) {
      throw new Error('Недостаточно прав для создания задачи');
    }

    // Валидация бизнес-правил
    if (dto.estimatedHours && dto.estimatedHours <= 0) {
      throw new Error('Оценочное время должно быть положительным');
    }

    if (dto.dueDate && dto.dueDate < new Date()) {
      throw new Error('Срок выполнения не может быть в прошлом');
    }

    // Проверяем существование проекта
    const project = await this.db.projects.getById(ctx, dto.projectId);
    if (!project) {
      throw new Error('Проект не найден');
    }

    // Проверяем существование исполнителя
    const assignee = await this.db.employees.getById(ctx, dto.assigneeId);
    if (!assignee) {
      throw new Error('Исполнитель не найден');
    }

    // Проверяем, что исполнитель активен
    if (!assignee.isActive) {
      throw new Error('Нельзя назначить задачу неактивному сотруднику');
    }

    const task: Task = {
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      projectId: dto.projectId,
      assigneeId: dto.assigneeId,
      priority: dto.priority,
      estimatedHours: dto.estimatedHours,
      dueDate: dto.dueDate,
      status: dto.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.db.tasks.create(ctx, task);
  }

  /**
   * Обновить задачу
   */
  async updateTask(ctx: ExecutionContext, id: string, dto: UpdateTaskDTO): Promise<Task> {
    if (!ctx.permissions.includes('tasks:update')) {
      throw new Error('Недостаточно прав для обновления задачи');
    }

    const existingTask = await this.db.tasks.getById(ctx, id);
    if (!existingTask) {
      throw new Error('Задача не найдена');
    }

    // Сотрудник может обновлять только свои задачи
    if (ctx.user.id !== existingTask.assigneeId && !ctx.permissions.includes('tasks:update_all')) {
      throw new Error('Недостаточно прав для обновления чужих задач');
    }

    // Валидация бизнес-правил
    if (dto.estimatedHours && dto.estimatedHours <= 0) {
      throw new Error('Оценочное время должно быть положительным');
    }

    if (dto.dueDate && dto.dueDate < new Date()) {
      throw new Error('Срок выполнения не может быть в прошлом');
    }

    // Проверяем существование исполнителя, если он обновляется
    if (dto.assigneeId && dto.assigneeId !== existingTask.assigneeId) {
      const assignee = await this.db.employees.getById(ctx, dto.assigneeId);
      if (!assignee) {
        throw new Error('Исполнитель не найден');
      }

      if (!assignee.isActive) {
        throw new Error('Нельзя назначить задачу неактивному сотруднику');
      }
    }

    const updatedTask: Task = {
      ...existingTask,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    return await this.db.tasks.update(ctx, id, updatedTask);
  }

  /**
   * Удалить задачу
   */
  async deleteTask(ctx: ExecutionContext, id: string): Promise<void> {
    if (!ctx.permissions.includes('tasks:delete')) {
      throw new Error('Недостаточно прав для удаления задачи');
    }

    const task = await this.db.tasks.getById(ctx, id);
    if (!task) {
      throw new Error('Задача не найдена');
    }

    // Проверяем, есть ли трудозатраты по задаче
    const timeEntries = await this.db.timeEntries.getByTaskId(ctx, id);
    if (timeEntries.length > 0) {
      throw new Error('Нельзя удалить задачу с зарегистрированными трудозатратами');
    }

    await this.db.tasks.delete(ctx, id);
  }

  /**
   * Изменить статус задачи
   */
  async updateTaskStatus(ctx: ExecutionContext, id: string, status: Task['status']): Promise<Task> {
    if (!ctx.permissions.includes('tasks:update')) {
      throw new Error('Недостаточно прав для обновления статуса задачи');
    }

    const task = await this.db.tasks.getById(ctx, id);
    if (!task) {
      throw new Error('Задача не найдена');
    }

    // Сотрудник может обновлять только свои задачи
    if (ctx.user.id !== task.assigneeId && !ctx.permissions.includes('tasks:update_all')) {
      throw new Error('Недостаточно прав для обновления статуса задачи');
    }

    const updatedTask: Task = {
      ...task,
      status,
      updatedAt: new Date().toISOString(),
    };

    return await this.db.tasks.update(ctx, id, updatedTask);
  }

  /**
   * Получить статистику по задачам
   */
  async getTaskStats(ctx: ExecutionContext, filters?: {
    projectId?: string;
    assigneeId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<TaskStats> {
    if (!ctx.permissions.includes('tasks:read')) {
      throw new Error('Недостаточно прав для просмотра статистики');
    }

    let tasks = await this.db.tasks.getAll(ctx);
    
    // Применяем фильтры
    if (filters?.projectId) {
      tasks = tasks.filter(t => t.projectId === filters.projectId);
    }
    
    if (filters?.assigneeId) {
      tasks = tasks.filter(t => t.assigneeId === filters.assigneeId);
    }
    
    if (filters?.dateFrom) {
      tasks = tasks.filter(t => t.createdAt >= filters.dateFrom!);
    }
    
    if (filters?.dateTo) {
      tasks = tasks.filter(t => t.createdAt <= filters.dateTo!);
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'todo').length;
    
    // Задачи с просроченным сроком
    const now = new Date();
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    ).length;

    // Среднее время выполнения
    const completedTasksWithDates = tasks.filter(t => 
      t.status === 'done' && t.createdAt && t.updatedAt
    );
    
    const averageCompletionTime = completedTasksWithDates.length > 0
      ? completedTasksWithDates.reduce((sum, t) => {
          const completionTime = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
          return sum + completionTime;
        }, 0) / completedTasksWithDates.length / (1000 * 60 * 60 * 24) // в днях
      : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      averageCompletionTime,
    };
  }

  /**
   * Получить просроченные задачи
   */
  async getOverdueTasks(ctx: ExecutionContext): Promise<Task[]> {
    if (!ctx.permissions.includes('tasks:read')) {
      throw new Error('Недостаточно прав для просмотра задач');
    }

    const tasks = await this.db.tasks.getAll(ctx);
    const now = new Date();
    
    return tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    );
  }

  /**
   * Получить задачи с высоким приоритетом
   */
  async getHighPriorityTasks(ctx: ExecutionContext): Promise<Task[]> {
    if (!ctx.permissions.includes('tasks:read')) {
      throw new Error('Недостаточно прав для просмотра задач');
    }

    const tasks = await this.db.tasks.getAll(ctx);
    
    return tasks.filter(t => 
      (t.priority === 'high' || t.priority === 'critical') && 
      t.status !== 'done'
    );
  }
}
