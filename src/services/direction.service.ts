import { ExecutionContext } from '@/lib/context/execution-context';
import { Direction } from '@/types/domain';
import { DatabaseProvider } from '@/providers/database-provider.interface';

export interface CreateDirectionDTO {
  name: string;
  description?: string;
  managerId: string;
  budget?: number;
  isActive: boolean;
}

export interface UpdateDirectionDTO {
  name?: string;
  description?: string;
  managerId?: string;
  budget?: number;
  isActive?: boolean;
}

export interface DirectionFilters {
  isActive?: boolean;
  search?: string;
}

export interface DirectionStats {
  totalDirections: number;
  activeDirections: number;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
}

export class DirectionService {
  constructor(private db: DatabaseProvider) {}

  /**
   * Получить все направления с фильтрацией
   */
  async getAllDirections(ctx: ExecutionContext, filters?: DirectionFilters): Promise<Direction[]> {
    // Проверяем права доступа
    if (!ctx.permissions.includes('directions:read')) {
      throw new Error('Недостаточно прав для просмотра направлений');
    }

    const directions = await this.db.directions.getAll(ctx);
    
    // Применяем фильтры
    let filteredDirections = directions;
    
    if (filters?.isActive !== undefined) {
      filteredDirections = filteredDirections.filter(d => d.isActive === filters.isActive);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDirections = filteredDirections.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower)
      );
    }

    return filteredDirections;
  }

  /**
   * Получить направление по ID
   */
  async getDirectionById(ctx: ExecutionContext, id: string): Promise<Direction | null> {
    if (!ctx.permissions.includes('directions:read')) {
      throw new Error('Недостаточно прав для просмотра направления');
    }

    return await this.db.directions.getById(ctx, id);
  }

  /**
   * Создать новое направление
   */
  async createDirection(ctx: ExecutionContext, dto: CreateDirectionDTO): Promise<Direction> {
    if (!ctx.permissions.includes('directions:create')) {
      throw new Error('Недостаточно прав для создания направления');
    }

    // Валидация бизнес-правил
    if (dto.budget && dto.budget < 0) {
      throw new Error('Бюджет не может быть отрицательным');
    }

    // Проверяем существование менеджера
    const manager = await this.db.employees.getById(ctx, dto.managerId);
    if (!manager) {
      throw new Error('Менеджер не найден');
    }

    // Проверяем, что менеджер активен
    if (!manager.isActive) {
      throw new Error('Нельзя назначить неактивного сотрудника менеджером направления');
    }

    const direction: Direction = {
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      managerId: dto.managerId,
      budget: dto.budget,
      isActive: dto.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.db.directions.create(ctx, direction);
  }

  /**
   * Обновить направление
   */
  async updateDirection(ctx: ExecutionContext, id: string, dto: UpdateDirectionDTO): Promise<Direction> {
    if (!ctx.permissions.includes('directions:update')) {
      throw new Error('Недостаточно прав для обновления направления');
    }

    const existingDirection = await this.db.directions.getById(ctx, id);
    if (!existingDirection) {
      throw new Error('Направление не найдено');
    }

    // Валидация бизнес-правил
    if (dto.budget && dto.budget < 0) {
      throw new Error('Бюджет не может быть отрицательным');
    }

    // Проверяем существование менеджера, если он обновляется
    if (dto.managerId && dto.managerId !== existingDirection.managerId) {
      const manager = await this.db.employees.getById(ctx, dto.managerId);
      if (!manager) {
        throw new Error('Менеджер не найден');
      }

      if (!manager.isActive) {
        throw new Error('Нельзя назначить неактивного сотрудника менеджером направления');
      }
    }

    const updatedDirection: Direction = {
      ...existingDirection,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    return await this.db.directions.update(ctx, id, updatedDirection);
  }

  /**
   * Удалить направление
   */
  async deleteDirection(ctx: ExecutionContext, id: string): Promise<void> {
    if (!ctx.permissions.includes('directions:delete')) {
      throw new Error('Недостаточно прав для удаления направления');
    }

    const direction = await this.db.directions.getById(ctx, id);
    if (!direction) {
      throw new Error('Направление не найдено');
    }

    // Проверяем, есть ли активные проекты в этом направлении
    const projects = await this.db.projects.getAll(ctx);
    const activeProjects = projects.filter(p => 
      p.directionId === id && (p.status === 'active' || p.status === 'planning')
    );
    
    if (activeProjects.length > 0) {
      throw new Error('Нельзя удалить направление с активными проектами');
    }

    await this.db.directions.delete(ctx, id);
  }

  /**
   * Получить статистику по направлениям
   */
  async getDirectionStats(ctx: ExecutionContext): Promise<DirectionStats> {
    if (!ctx.permissions.includes('directions:read')) {
      throw new Error('Недостаточно прав для просмотра статистики');
    }

    const directions = await this.db.directions.getAll(ctx);
    const projects = await this.db.projects.getAll(ctx);
    const timeEntries = await this.db.timeEntries.getAll(ctx);

    const totalDirections = directions.length;
    const activeDirections = directions.filter(d => d.isActive).length;
    
    // Вычисляем бюджет
    const totalBudget = directions.reduce((sum, d) => sum + (d.budget || 0), 0);
    
    // Вычисляем использованный бюджет (предполагаем 1000 руб/час)
    const usedBudget = timeEntries
      .filter(entry => entry.status === 'approved')
      .reduce((sum, entry) => sum + (entry.hours * 1000), 0);
    
    const remainingBudget = totalBudget - usedBudget;

    return {
      totalDirections,
      activeDirections,
      totalBudget,
      usedBudget,
      remainingBudget,
    };
  }

  /**
   * Получить статистику по конкретному направлению
   */
  async getDirectionStatsById(ctx: ExecutionContext, id: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalHours: number;
    budgetUsed: number;
    budgetRemaining: number;
    progress: number;
  }> {
    if (!ctx.permissions.includes('directions:read')) {
      throw new Error('Недостаточно прав для просмотра статистики направления');
    }

    const direction = await this.db.directions.getById(ctx, id);
    if (!direction) {
      throw new Error('Направление не найдено');
    }

    const projects = await this.db.projects.getAll(ctx);
    const directionProjects = projects.filter(p => p.directionId === id);
    
    const timeEntries = await this.db.timeEntries.getAll(ctx);
    const directionTimeEntries = timeEntries.filter(entry => {
      const project = projects.find(p => p.id === entry.projectId);
      return project?.directionId === id;
    });

    const totalProjects = directionProjects.length;
    const activeProjects = directionProjects.filter(p => p.status === 'active').length;
    const completedProjects = directionProjects.filter(p => p.status === 'completed').length;
    
    const totalHours = directionTimeEntries
      .filter(entry => entry.status === 'approved')
      .reduce((sum, entry) => sum + entry.hours, 0);
    
    const budgetUsed = totalHours * 1000; // Предполагаем 1000 руб/час
    const budgetRemaining = (direction.budget || 0) - budgetUsed;
    
    const progress = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalHours,
      budgetUsed,
      budgetRemaining,
      progress,
    };
  }

  /**
   * Получить проекты по направлению
   */
  async getProjectsByDirection(ctx: ExecutionContext, directionId: string): Promise<any[]> {
    if (!ctx.permissions.includes('directions:read')) {
      throw new Error('Недостаточно прав для просмотра проектов направления');
    }

    const projects = await this.db.projects.getAll(ctx);
    return projects.filter(p => p.directionId === directionId);
  }

  /**
   * Активировать/деактивировать направление
   */
  async toggleDirectionStatus(ctx: ExecutionContext, id: string): Promise<Direction> {
    if (!ctx.permissions.includes('directions:update')) {
      throw new Error('Недостаточно прав для изменения статуса направления');
    }

    const direction = await this.db.directions.getById(ctx, id);
    if (!direction) {
      throw new Error('Направление не найдено');
    }

    const updatedDirection: Direction = {
      ...direction,
      isActive: !direction.isActive,
      updatedAt: new Date().toISOString(),
    };

    return await this.db.directions.update(ctx, id, updatedDirection);
  }

  /**
   * Получить активные направления
   */
  async getActiveDirections(ctx: ExecutionContext): Promise<Direction[]> {
    if (!ctx.permissions.includes('directions:read')) {
      throw new Error('Недостаточно прав для просмотра направлений');
    }

    const directions = await this.db.directions.getAll(ctx);
    return directions.filter(d => d.isActive);
  }
}
