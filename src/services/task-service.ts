import { ExecutionContext } from '@/lib/context/execution-context';
import type { TaskFilters, CreateTaskDTO, UpdateTaskDTO } from '@/types/domain';

export class TaskService {
  /**
   * Get all tasks with server-side filtering and pagination
   * Refactored to use Repository Pattern
   */
  static async getAllTasks(ctx: ExecutionContext, filters?: TaskFilters) {
    ctx.logger.info('[TaskService] getAllTasks', { filters });
    await ctx.access.require('tasks:read');

    // ✅ Use repository instead of raw SQL
    const [data, total] = await Promise.all([
      ctx.db.tasks.getAll(ctx, filters),
      ctx.db.tasks.getCount(ctx, filters)
    ]);

    ctx.logger.info('[TaskService] Tasks fetched', {
      count: data.length,
      total
    });

    return { data, total };
  }

  /**
   * Get task by ID
   */
  static async getTaskById(ctx: ExecutionContext, id: string) {
    ctx.logger.info('[TaskService] getTaskById', { id });
    await ctx.access.require('tasks:read');

    return ctx.db.tasks.getById(ctx, id);
  }

  /**
   * Create new task
   */
  static async createTask(ctx: ExecutionContext, data: CreateTaskDTO) {
    ctx.logger.info('[TaskService] createTask', { name: data.name });
    await ctx.access.require('tasks:create');

    const task = await ctx.db.tasks.create(ctx, data);

    ctx.logger.info('[TaskService] Task created', { id: task.id });

    return task;
  }

  /**
   * Update task
   */
  static async updateTask(ctx: ExecutionContext, id: string, data: UpdateTaskDTO) {
    ctx.logger.info('[TaskService] updateTask', { id });
    await ctx.access.require('tasks:update');

    const task = await ctx.db.tasks.update(ctx, id, data);

    ctx.logger.info('[TaskService] Task updated', { id });

    return task;
  }

  /**
   * Delete task
   */
  static async deleteTask(ctx: ExecutionContext, id: string) {
    ctx.logger.info('[TaskService] deleteTask', { id });
    await ctx.access.require('tasks:delete');

    await ctx.db.tasks.delete(ctx, id);

    ctx.logger.info('[TaskService] Task deleted', { id });
  }
}
