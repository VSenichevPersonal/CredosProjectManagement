import { ExecutionContext } from '@/lib/context/execution-context';
import { TimeEntry, CreateTimeEntryDTO, UpdateTimeEntryDTO, ApproveTimeEntryDTO } from '@/types/domain';

export interface TimeEntryFilters {
  employeeId?: string;
  projectId?: string;
  // taskId убрано - не используется по требованиям
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

  /**
   * Получить все записи трудозатрат с фильтрацией (для API)
   */
  static async getTimeEntries(ctx: ExecutionContext, filters?: any): Promise<TimeEntry[]> {
    ctx.logger.info("[TimeTrackingService] getTimeEntries", { filters })
    await ctx.access.require('time_entries:read')
    
    const timeEntries = await ctx.db.timeEntries.getAll(ctx);
    
    // Применяем фильтры
    let filteredEntries = timeEntries;
    
    if (filters?.employeeId) {
      filteredEntries = filteredEntries.filter(entry => entry.employeeId === filters.employeeId);
    }
    
    if (filters?.projectId) {
      filteredEntries = filteredEntries.filter(entry => entry.projectId === filters.projectId);
    }
    
    // taskId убрано - не используется по требованиям
    
    if (filters?.dateFrom) {
      filteredEntries = filteredEntries.filter(entry => entry.date >= filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      filteredEntries = filteredEntries.filter(entry => entry.date <= filters.dateTo);
    }
    
    // Убрано поле billable - не нужно по требованиям
    
    ctx.logger.info("[TimeTrackingService] Time entries fetched", { count: filteredEntries.length })
    return filteredEntries;
  }

  /**
   * Создать запись времени (для API)
   */
  static async createTimeEntry(ctx: ExecutionContext, dto: any): Promise<TimeEntry> {
    ctx.logger.info("[TimeTrackingService] createTimeEntry", { dto })
    await ctx.access.require('time_entries:create')
    
    // Валидация бизнес-правил
    if (dto.hours <= 0 || dto.hours > 24) {
      throw new Error('Количество часов должно быть от 0 до 24');
    }

    if (new Date(dto.date) > new Date()) {
      throw new Error('Нельзя указывать трудозатраты на будущую дату');
    }

    const timeEntry: TimeEntry = {
      id: crypto.randomUUID(),
      employeeId: dto.employeeId,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      date: dto.date,
      hours: dto.hours,
      description: dto.description,
      status: 'submitted',
      approvedBy: undefined,
      approvedAt: undefined,
      rejectionReason: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdEntry = await ctx.db.timeEntries.create(ctx, timeEntry);
    ctx.logger.info("[TimeTrackingService] Time entry created", { id: createdEntry.id })
    return createdEntry;
  }

  /**
   * Создать множество записей времени (для API)
   */
  static async createBulkTimeEntries(ctx: ExecutionContext, entries: any[]): Promise<TimeEntry[]> {
    ctx.logger.info("[TimeTrackingService] createBulkTimeEntries", { count: entries.length })
    await ctx.access.require('time_entries:create')
    
    const createdEntries: TimeEntry[] = [];
    
    for (const dto of entries) {
      const entry = await TimeTrackingService.createTimeEntry(ctx, dto);
      createdEntries.push(entry);
    }
    
    ctx.logger.info("[TimeTrackingService] Bulk time entries created", { count: createdEntries.length })
    return createdEntries;
  }

  /**
   * Получить все записи трудозатрат с фильтрацией (legacy)
   */
  static async getAllTimeEntries(ctx: ExecutionContext, filters?: TimeEntryFilters): Promise<TimeEntry[]> {
    ctx.logger.info("[TimeTrackingService] getAllTimeEntries", { filters })
    await ctx.access.require('time_entries:read')

    const timeEntries = await ctx.db.timeEntries.getAll(ctx);
    
    // Применяем фильтры
    let filteredEntries = timeEntries;
    
    if (filters?.employeeId) {
      filteredEntries = filteredEntries.filter(entry => entry.employeeId === filters.employeeId);
    }
    
    if (filters?.projectId) {
      filteredEntries = filteredEntries.filter(entry => entry.projectId === filters.projectId);
    }
    
    // taskId убрано - не используется по требованиям
    
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

    ctx.logger.info("[TimeTrackingService] Time entries fetched", { count: filteredEntries.length })
    return filteredEntries;
  }

  /**
   * Получить записи трудозатрат по сотруднику
   */
  static async getTimeEntriesByEmployee(ctx: ExecutionContext, employeeId: string): Promise<TimeEntry[]> {
    ctx.logger.info("[TimeTrackingService] getTimeEntriesByEmployee", { employeeId })
    await ctx.access.require('time_entries:read')

    // Сотрудник может видеть только свои записи, менеджеры - всех
    if (ctx.user.id !== employeeId && !ctx.access.check('time_entries:read')) {
      throw new Error('Недостаточно прав для просмотра чужих трудозатрат');
    }

    return await ctx.db.timeEntries.getByEmployee(ctx, employeeId);
  }

  /**
   * Получить записи трудозатрат по проекту
   */
  static async getTimeEntriesByProject(ctx: ExecutionContext, projectId: string): Promise<TimeEntry[]> {
    ctx.logger.info("[TimeTrackingService] getTimeEntriesByProject", { projectId })
    await ctx.access.require('time_entries:read')

    return await ctx.db.timeEntries.getByTask(ctx, projectId);
  }

  /**
   * Обновить запись трудозатрат
   */
  static async updateTimeEntry(ctx: ExecutionContext, id: string, dto: UpdateTimeEntryDTO): Promise<TimeEntry> {
    ctx.logger.info("[TimeTrackingService] updateTimeEntry", { id, dto })
    await ctx.access.require('time_entries:update')

    const existingEntry = await ctx.db.timeEntries.getById(ctx, id);
    if (!existingEntry) {
      throw new Error('Запись трудозатрат не найдена');
    }

    // Сотрудник может обновлять только свои записи
    if (ctx.user.id !== existingEntry.employeeId && !ctx.access.check('time_entries:update')) {
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

    if (dto.date && new Date(dto.date) > new Date()) {
      throw new Error('Нельзя указывать трудозатраты на будущую дату');
    }

    const updatedEntry: TimeEntry = {
      ...existingEntry,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    const result = await ctx.db.timeEntries.update(ctx, id, updatedEntry);
    ctx.logger.info("[TimeTrackingService] Time entry updated", { id })
    return result;
  }

  /**
   * Удалить запись трудозатрат
   */
  static async deleteTimeEntry(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info("[TimeTrackingService] deleteTimeEntry", { id })
    await ctx.access.require('time_entries:delete')

    const timeEntry = await ctx.db.timeEntries.getById(ctx, id);
    if (!timeEntry) {
      throw new Error('Запись трудозатрат не найдена');
    }

    // Сотрудник может удалять только свои записи
    if (ctx.user.id !== timeEntry.employeeId && !ctx.access.check('time_entries:delete')) {
      throw new Error('Недостаточно прав для удаления чужих записей');
    }

    // Нельзя удалять уже утвержденные записи
    if (timeEntry.status === 'approved') {
      throw new Error('Нельзя удалять утвержденные записи трудозатрат');
    }

    await ctx.db.timeEntries.delete(ctx, id);
    ctx.logger.info("[TimeTrackingService] Time entry deleted", { id })
  }

  /**
   * Утвердить запись трудозатрат
   */
  static async approveTimeEntry(ctx: ExecutionContext, id: string, dto: ApproveTimeEntryDTO): Promise<TimeEntry> {
    ctx.logger.info("[TimeTrackingService] approveTimeEntry", { id, dto })
    // TODO: Add time_entries:approve permission to permissions.ts
    // await ctx.access.require('time_entries:approve')

    const timeEntry = await ctx.db.timeEntries.getById(ctx, id);
    if (!timeEntry) {
      throw new Error('Запись трудозатрат не найдена');
    }

    if (timeEntry.status !== 'submitted') {
      throw new Error('Можно утверждать только записи со статусом "ожидает"');
    }

    const updatedEntry: TimeEntry = {
      ...timeEntry,
      status: dto.approved ? 'approved' : 'rejected',
      approvedBy: ctx.user.id,
      approvedAt: new Date().toISOString(),
      rejectionReason: dto.approved ? undefined : dto.rejectionReason,
      updatedAt: new Date().toISOString(),
    };

    const result = await ctx.db.timeEntries.update(ctx, id, updatedEntry);
    ctx.logger.info("[TimeTrackingService] Time entry approved/rejected", { id, approved: dto.approved })
    return result;
  }

  /**
   * Получить статистику по трудозатратам
   */
  static async getTimeTrackingStats(ctx: ExecutionContext, filters?: {
    employeeId?: string;
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TimeTrackingStats> {
    ctx.logger.info("[TimeTrackingService] getTimeTrackingStats", { filters })
    await ctx.access.require('time_entries:read')

    const timeEntries = await TimeTrackingService.getAllTimeEntries(ctx, filters);
    
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const approvedHours = timeEntries
      .filter(entry => entry.status === 'approved')
      .reduce((sum, entry) => sum + entry.hours, 0);
    const submittedHours = timeEntries
      .filter(entry => entry.status === 'submitted')
      .reduce((sum, entry) => sum + entry.hours, 0);
    const rejectedHours = timeEntries
      .filter(entry => entry.status === 'rejected')
      .reduce((sum, entry) => sum + entry.hours, 0);

    // Вычисляем среднее количество часов в день
    const dateRange = filters?.dateFrom && filters?.dateTo
      ? Math.ceil((new Date(filters.dateTo).getTime() - new Date(filters.dateFrom).getTime()) / (1000 * 60 * 60 * 24))
      : 30; // По умолчанию за последние 30 дней
    
    const averageHoursPerDay = dateRange > 0 ? totalHours / dateRange : 0;

    const stats = {
      totalHours,
      approvedHours,
      submittedHours: submittedHours,
      rejectedHours,
      averageHoursPerDay,
      totalEntries: timeEntries.length,
    };

    ctx.logger.info("[TimeTrackingService] Stats calculated", stats)
    return stats;
  }

  /**
   * Получить записи для утверждения
   */
  static async getPendingTimeEntries(ctx: ExecutionContext): Promise<TimeEntry[]> {
    ctx.logger.info("[TimeTrackingService] getPendingTimeEntries")
    // TODO: Add time_entries:approve permission to permissions.ts
    // await ctx.access.require('time_entries:approve')

    const allEntries = await ctx.db.timeEntries.getAll(ctx);
    const submittedEntries = allEntries.filter(entry => entry.status === 'submitted');
    
    ctx.logger.info("[TimeTrackingService] Pending entries fetched", { count: submittedEntries.length })
    return submittedEntries;
  }
}