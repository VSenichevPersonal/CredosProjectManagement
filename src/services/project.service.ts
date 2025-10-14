/**
 * @intent: Business logic for project management
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from '@/lib/context/execution-context';
import type { Project } from '@/types/domain';

export interface CreateProjectDTO {
  name: string;
  description?: string;
  directionId: string;
  managerId: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  directionId?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProjectFilters {
  directionId?: string;
  managerId?: string;
  status?: string;
  search?: string;
}

export class ProjectService {

  /**
   * @intent: List projects accessible to current user
   * @precondition: ctx.user is authenticated
   * @postcondition: returns only projects user has access to
   */
  static async getAllProjects(ctx: ExecutionContext, filters?: ProjectFilters): Promise<Project[]> {
    ctx.logger.info("[ProjectService] getAllProjects", { filters })

    // Check permission
    await ctx.access.require('projects:read')

    const projects = await ctx.db.projects.getAll(ctx);
    
    // Применяем фильтры
    let filteredProjects = projects;
    
    if (filters?.directionId) {
      filteredProjects = filteredProjects.filter(p => p.directionId === filters.directionId);
    }
    
    if (filters?.managerId) {
      filteredProjects = filteredProjects.filter(p => p.managerId === filters.managerId);
    }
    
    if (filters?.status) {
      filteredProjects = filteredProjects.filter(p => p.status === filters.status);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    ctx.logger.info("[ProjectService] Projects fetched", { count: filteredProjects.length })
    return filteredProjects;
  }

  /**
   * @intent: Get project by ID
   * @precondition: ctx.user has read permission
   * @postcondition: returns project or throws error
   */
  static async getProjectById(ctx: ExecutionContext, id: string): Promise<Project | null> {
    ctx.logger.info("[ProjectService] getProjectById", { id })

    // Check permission
    await ctx.access.require('projects:read')

    return await ctx.db.projects.getById(ctx, id);
  }

  /**
   * @intent: Create new project
   * @precondition: ctx.user has create permission
   * @postcondition: returns created project
   */
  static async createProject(ctx: ExecutionContext, dto: CreateProjectDTO): Promise<Project> {
    ctx.logger.info("[ProjectService] createProject", { dto })

    // Check permission
    await ctx.access.require('projects:create')

    // Валидация бизнес-правил
    if (dto.endDate && dto.startDate >= dto.endDate) {
      throw new Error('Дата окончания должна быть позже даты начала');
    }

    if (dto.budget && dto.budget < 0) {
      throw new Error('Бюджет не может быть отрицательным');
    }

    // Проверяем существование направления
    const direction = await ctx.db.directions.getById(ctx, dto.directionId);
    if (!direction) {
      throw new Error('Направление не найдено');
    }

    // Проверяем существование менеджера
    const manager = await ctx.db.employees.getById(ctx, dto.managerId);
    if (!manager) {
      throw new Error('Менеджер не найден');
    }

    const project: Project = {
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      directionId: dto.directionId,
      managerId: dto.managerId,
      status: dto.status,
      priority: dto.priority,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalBudget: dto.budget,
      currentSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdProject = await ctx.db.projects.create(ctx, project);
    ctx.logger.info("[ProjectService] Project created", { projectId: createdProject.id })
    return createdProject;
  }

  /**
   * Обновить проект
   */
  async updateProject(ctx: ExecutionContext, id: string, dto: UpdateProjectDTO): Promise<Project> {
    if (!ctx.access.check('projects:update')) {
      throw new Error('Недостаточно прав для обновления проекта');
    }

    const existingProject = await ctx.db.projects.getById(ctx, id);
    if (!existingProject) {
      throw new Error('Проект не найден');
    }

    // Валидация бизнес-правил
    if (dto.endDate && dto.startDate && dto.startDate >= dto.endDate) {
      throw new Error('Дата окончания должна быть позже даты начала');
    }

    if (dto.budget && dto.budget < 0) {
      throw new Error('Бюджет не может быть отрицательным');
    }

    // Проверяем существование направления, если оно обновляется
    if (dto.directionId && dto.directionId !== existingProject.directionId) {
      const direction = await ctx.db.directions.getById(ctx, dto.directionId);
      if (!direction) {
        throw new Error('Направление не найдено');
      }
    }

    // Проверяем существование менеджера, если он обновляется
    if (dto.managerId && dto.managerId !== existingProject.managerId) {
      const manager = await ctx.db.employees.getById(ctx, dto.managerId);
      if (!manager) {
        throw new Error('Менеджер не найден');
      }
    }

    const updatedProject: Project = {
      ...existingProject,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    return await ctx.db.projects.update(ctx, id, updatedProject);
  }

  /**
   * Удалить проект
   */
  async deleteProject(ctx: ExecutionContext, id: string): Promise<void> {
    if (!ctx.access.check('projects:delete')) {
      throw new Error('Недостаточно прав для удаления проекта');
    }

    const project = await ctx.db.projects.getById(ctx, id);
    if (!project) {
      throw new Error('Проект не найден');
    }

    // Проверяем, есть ли активные задачи
    const tasks = await ctx.db.tasks.getByProject(ctx, id);
    const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'todo');
    
    if (activeTasks.length > 0) {
      throw new Error('Нельзя удалить проект с активными задачами');
    }

    await ctx.db.projects.delete(ctx, id);
  }

  /**
   * Получить статистику по проекту
   */
  async getProjectStats(ctx: ExecutionContext, id: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    totalHours: number;
    budgetUsed: number;
    progress: number;
  }> {
    if (!ctx.access.check('projects:read')) {
      throw new Error('Недостаточно прав для просмотра статистики проекта');
    }

    const project = await ctx.db.projects.getById(ctx, id);
    if (!project) {
      throw new Error('Проект не найден');
    }

    const tasks = await ctx.db.tasks.getByProject(ctx, id);
    const timeEntries = await ctx.db.timeEntries.getAll(ctx, { projectId: id });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const budgetUsed = timeEntries.reduce((sum, entry) => sum + (entry.hours * 1000), 0); // Предполагаем 1000 руб/час
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      totalHours,
      budgetUsed,
      progress,
    };
  }
}
