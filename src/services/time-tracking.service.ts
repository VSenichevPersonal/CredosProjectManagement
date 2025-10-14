import { ExecutionContext } from '@/lib/context/execution-context';
import { TimeEntry, CreateTimeEntryDTO, UpdateTimeEntryDTO, ApproveTimeEntryDTO } from '@/types/domain';
import { DatabaseProvider } from '@/providers/database-provider.interface';

export interface TimeEntryFilters {
  employeeId?: string;
  projectId?: string;
  taskId?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface TimeTrackingStats {
  totalHours: number;
  approvedHours: number;
  submittedHours: number;
  rejectedHours: number;
  averageHoursPerDay: number;
  totalEntries: number;
}

export class TimeTrackingService {
  constructor(private db: DatabaseProvider) {}

  /**
   * Получить все записи трудозатрат с фильтрацией
   */
  async getAllTimeEntries(ctx: ExecutionContext, filters?: TimeEntryFilters): Promise<TimeEntry[]> {
    // Проверяем права доступа
    if (!ctx.permissions.includes('time_entries:read')) {
      throw new Error('Недостаточно прав для просмотра трудозатрат');
    }

    const timeEntries = await this.db.timeEntries.getAll(ctx);
    
    // Применяем фильтры
    let filteredEntries = timeEntries;
    
    if (filters?.employeeId) {
      filteredEntries = filteredEntries.filter(entry => entry.employeeId === filters.employeeId);
    }
    
    if (filters?.projectId) {
      filteredEntries = filteredEntries.filter(entry => entry.projectId === filters.projectId);
    }
    
    if (filters?.taskId) {
      filteredEntries = filteredEntries.filter(entry => entry.taskId === filters.taskId);
    }
    
    if (filters?.status) {
      filteredEntries = filteredEntries.filter(entry => entry.status === filters.status);
    }
    
    if (filters?.dateFrom) {
      filteredEntries = filteredEntries.filter(entry => entry.date >= filters.dateFrom!);
    }
    
    if (filters?.dateTo) {
      filteredEntries = filteredEntries.filter(entry => entry.date <= filters.dateTo!);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEntries = filteredEntries.filter(entry => 
        entry.description?.toLowerCase().includes(searchLower)
      );
    }

    return filteredEntries;
  }

  /**
   * Получить записи трудозатрат по сотруднику
   */
  async getTimeEntriesByEmployee(ctx: ExecutionContext, employeeId: string): Promise<TimeEntry[]> {
    if (!ctx.permissions.includes('time_entries:read')) {
      throw new Error('Недостаточно прав для просмотра трудозатрат');
    }

    // Сотрудник может видеть только свои записи, менеджеры - всех
    if (ctx.user.id !== employeeId && !ctx.permissions.includes('time_entries:read_all')) {
      throw new Error('Недостаточно прав для просмотра чужих трудозатрат');
    }

    return await this.db.timeEntries.getByEmployeeId(ctx, employeeId);
  }

  /**
   * Получить записи трудозатрат по проекту
   */
  async getTimeEntriesByProject(ctx: ExecutionContext, projectId: string): Promise<TimeEntry[]> {
    if (!ctx.permissions.includes('time_entries:read')) {
      throw new Error('Недостаточно прав для просмотра трудозатрат');
    }

    return await this.db.timeEntries.getByProjectId(ctx, projectId);
  }

  /**
   * Создать новую запись трудозатрат
   */
  async createTimeEntry(ctx: ExecutionContext, dto: CreateTimeEntryDTO): Promise<TimeEntry> {
    if (!ctx.permissions.includes('time_entries:create')) {
      throw new Error('Недостаточно прав для создания записи трудозатрат');
    }

    // Валидация бизнес-правил
    if (dto.hours <= 0 || dto.hours > 24) {
      throw new Error('Количество часов должно быть от 0 до 24');
    }

    if (new Date(dto.date) > new Date()) {
      throw new Error('Нельзя указывать трудозатраты на будущую дату');
    }

    // Проверяем существование проекта
    const project = await this.db.projects.getById(ctx, dto.projectId);
    if (!project) {
      throw new Error('Проект не найден');
    }

    // Проверяем существование задачи, если указана
    if (dto.taskId) {
      const task = await this.db.tasks.getById(ctx, dto.taskId);
      if (!task) {
        throw new Error('Задача не найдена');
      }
    }

    // Проверяем, что сотрудник существует
    const employee = await this.db.employees.getById(ctx, dto.employeeId);
    if (!employee) {
      throw new Error('Сотрудник не найден');
    }

    // Проверяем дублирование записей на одну дату
    const existingEntries = await this.db.timeEntries.getByEmployeeId(ctx, dto.employeeId);
    const duplicateEntry = existingEntries.find(entry => 
      entry.date === dto.date && 
      entry.projectId === dto.projectId &&
      entry.taskId === dto.taskId
    );

    if (duplicateEntry) {
      throw new Error('Запись трудозатрат на эту дату и проект уже существует');
    }

    const timeEntry: TimeEntry = {
      id: crypto.randomUUID(),
      employeeId: dto.employeeId,
      projectId: dto.projectId,
      taskId: dto.taskId,
      date: dto.date,
      hours: dto.hours,
      description: dto.description,
      status: 'submitted',
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.db.timeEntries.create(ctx, timeEntry);
  }

  /**
   * Обновить запись трудозатрат
   */
  async updateTimeEntry(ctx: ExecutionContext, id: string, dto: UpdateTimeEntryDTO): Promise<TimeEntry> {
    if (!ctx.permissions.includes('time_entries:update')) {
      throw new Error('Недостаточно прав для обновления записи трудозатрат');
    }

    const existingEntry = await this.db.timeEntries.getById(ctx, id);
    if (!existingEntry) {
      throw new Error('Запись трудозатрат не найдена');
    }

    // Сотрудник может обновлять только свои записи
    if (ctx.user.id !== existingEntry.employeeId && !ctx.permissions.includes('time_entries:update_all')) {
      throw new Error('Недостаточно прав для обновления чужих записей');
    }

    // Нельзя обновлять уже утвержденные записи
    if (existingEntry.status === 'approved') {
      throw new Error('Нельзя обновлять утвержденные записи трудозатрат');
    }

    // Валидация бизнес-правил
    if (dto.hours && (dto.hours <= 0 || dto.hours > 24)) {
      throw new Error('Количество часов должно быть от 0 до 24');
    }

    if (dto.date && dto.date > new Date()) {
      throw new Error('Нельзя указывать трудозатраты на будущую дату');
    }

    const updatedEntry: TimeEntry = {
      ...existingEntry,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    return await this.db.timeEntries.update(ctx, id, updatedEntry);
  }

  /**
   * Удалить запись трудозатрат
   */
  async deleteTimeEntry(ctx: ExecutionContext, id: string): Promise<void> {
    if (!ctx.permissions.includes('time_entries:delete')) {
      throw new Error('Недостаточно прав для удаления записи трудозатрат');
    }

    const timeEntry = await this.db.timeEntries.getById(ctx, id);
    if (!timeEntry) {
      throw new Error('Запись трудозатрат не найдена');
    }

    // Сотрудник может удалять только свои записи
    if (ctx.user.id !== timeEntry.employeeId && !ctx.permissions.includes('time_entries:delete_all')) {
      throw new Error('Недостаточно прав для удаления чужих записей');
    }

    // Нельзя удалять уже утвержденные записи
    if (timeEntry.status === 'approved') {
      throw new Error('Нельзя удалять утвержденные записи трудозатрат');
    }

    await this.db.timeEntries.delete(ctx, id);
  }

  /**
   * Утвердить запись трудозатрат
   */
  async approveTimeEntry(ctx: ExecutionContext, id: string, dto: ApproveTimeEntryDTO): Promise<TimeEntry> {
    if (!ctx.permissions.includes('time_entries:approve')) {
      throw new Error('Недостаточно прав для утверждения трудозатрат');
    }

    const timeEntry = await this.db.timeEntries.getById(ctx, id);
    if (!timeEntry) {
      throw new Error('Запись трудозатрат не найдена');
    }

    if (timeEntry.status !== 'pending') {
      throw new Error('Можно утверждать только записи со статусом "ожидает"');
    }

    const updatedEntry: TimeEntry = {
      ...timeEntry,
      status: dto.approved ? 'approved' : 'rejected',
      approvedBy: ctx.user.id,
      approvedAt: new Date().toISOString(),
      rejectionReason: dto.approved ? null : dto.rejectionReason,
      updatedAt: new Date().toISOString(),
    };

    return await this.db.timeEntries.update(ctx, id, updatedEntry);
  }

  /**
   * Получить статистику по трудозатратам
   */
  async getTimeTrackingStats(ctx: ExecutionContext, filters?: {
    employeeId?: string;
    projectId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<TimeTrackingStats> {
    if (!ctx.permissions.includes('time_entries:read')) {
      throw new Error('Недостаточно прав для просмотра статистики');
    }

    const timeEntries = await this.getAllTimeEntries(ctx, filters);
    
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const approvedHours = timeEntries
      .filter(entry => entry.status === 'approved')
      .reduce((sum, entry) => sum + entry.hours, 0);
    const pendingHours = timeEntries
      .filter(entry => entry.status === 'pending')
      .reduce((sum, entry) => sum + entry.hours, 0);
    const rejectedHours = timeEntries
      .filter(entry => entry.status === 'rejected')
      .reduce((sum, entry) => sum + entry.hours, 0);

    // Вычисляем среднее количество часов в день
    const dateRange = filters?.dateFrom && filters?.dateTo 
      ? Math.ceil((filters.dateTo.getTime() - filters.dateFrom.getTime()) / (1000 * 60 * 60 * 24))
      : 30; // По умолчанию за последние 30 дней
    
    const averageHoursPerDay = dateRange > 0 ? totalHours / dateRange : 0;

    return {
      totalHours,
      approvedHours,
      pendingHours,
      rejectedHours,
      averageHoursPerDay,
      totalEntries: timeEntries.length,
    };
  }

  /**
   * Получить записи для утверждения
   */
  async getPendingTimeEntries(ctx: ExecutionContext): Promise<TimeEntry[]> {
    if (!ctx.permissions.includes('time_entries:approve')) {
      throw new Error('Недостаточно прав для просмотра записей на утверждение');
    }

    const allEntries = await this.db.timeEntries.getAll(ctx);
    return allEntries.filter(entry => entry.status === 'pending');
  }
}
