import { ExecutionContext } from '@/lib/context/execution-context';
import type { TimeEntry, TimeEntryFilters, CreateTimeEntryDTO, UpdateTimeEntryDTO } from '@/types/domain';

/**
 * TimeEntryService - Stub implementation
 * TODO: Refactor to use Repository Pattern
 */
export class TimeEntryService {
  static async getAllTimeEntries(ctx: ExecutionContext, filters?: TimeEntryFilters): Promise<{ data: TimeEntry[]; total: number }> {
    ctx.logger.info('[TimeEntryService] getAllTimeEntries', { filters });
    await ctx.access.require('time_entries:read');

    // Use repository when implemented
    const data = await ctx.db.timeEntries.getAll(ctx, filters);
    
    return {
      data,
      total: data.length
    };
  }

  static async getTimeEntryById(ctx: ExecutionContext, id: string): Promise<TimeEntry | null> {
    await ctx.access.require('time_entries:read');
    return ctx.db.timeEntries.getById(ctx, id);
  }

  static async createTimeEntry(ctx: ExecutionContext, data: CreateTimeEntryDTO): Promise<TimeEntry> {
    await ctx.access.require('time_entries:create');
    return ctx.db.timeEntries.create(ctx, data);
  }

  static async updateTimeEntry(ctx: ExecutionContext, id: string, data: UpdateTimeEntryDTO): Promise<TimeEntry> {
    await ctx.access.require('time_entries:update');
    return ctx.db.timeEntries.update(ctx, id, data);
  }

  static async deleteTimeEntry(ctx: ExecutionContext, id: string): Promise<void> {
    await ctx.access.require('time_entries:delete');
    await ctx.db.timeEntries.delete(ctx, id);
  }

  static async approveTimeEntries(ctx: ExecutionContext, ids: string[]): Promise<void> {
    // TODO: Add approval/rejection permissions to permissions.ts
    // await ctx.access.require('time_entries:approve');
    
    // TODO: Implement batch approval when repository is ready
    // For now, approve each entry individually
    for (const id of ids) {
      await ctx.db.timeEntries.approve(ctx, {
        approved: true
      });
    }
  }
}

