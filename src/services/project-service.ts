import { ExecutionContext } from '@/lib/context/execution-context';
import type { ProjectFilters, CreateProjectDTO, UpdateProjectDTO } from '@/types/domain';

export class ProjectService {
  /**
   * Get all projects with server-side filtering and pagination
   * Refactored to use Repository Pattern
   */
  static async getAllProjects(
    ctx: ExecutionContext,
    filters?: ProjectFilters
  ): Promise<{ data: any[]; total: number }> {
    ctx.logger.info('[ProjectService] getAllProjects with server-side filtering', { filters });
    await ctx.access.require('projects:read');

    // ✅ Use repository instead of raw SQL
    const [data, total] = await Promise.all([
      ctx.db.projects.getAll(ctx, filters),
      ctx.db.projects.getCount(ctx, filters)
    ]);

    ctx.logger.info('[ProjectService] Projects fetched', {
      count: data.length,
      total,
      limit: filters?.limit,
      offset: filters?.offset
    });

    return {
      data,
      total
    };
  }

  /**
   * Get project by ID
   */
  static async getProjectById(ctx: ExecutionContext, id: string) {
    ctx.logger.info('[ProjectService] getProjectById', { id });
    await ctx.access.require('projects:read');

    return ctx.db.projects.getById(ctx, id);
  }

  /**
   * Create new project
   */
  static async createProject(
    ctx: ExecutionContext,
    data: CreateProjectDTO
  ) {
    ctx.logger.info('[ProjectService] createProject', { name: data.name });
    await ctx.access.require('projects:create');

    const project = await ctx.db.projects.create(ctx, data);

    ctx.logger.info('[ProjectService] Project created', { id: project.id });

    return project;
  }

  /**
   * Update project
   */
  static async updateProject(
    ctx: ExecutionContext,
    id: string,
    data: UpdateProjectDTO
  ) {
    ctx.logger.info('[ProjectService] updateProject', { id, ...data });
    await ctx.access.require('projects:update');

    const project = await ctx.db.projects.update(ctx, id, data);

    ctx.logger.info('[ProjectService] Project updated', { id });

    return project;
  }

  /**
   * Delete project
   */
  static async deleteProject(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info('[ProjectService] deleteProject', { id });
    await ctx.access.require('projects:delete');

    await ctx.db.projects.delete(ctx, id);

    ctx.logger.info('[ProjectService] Project deleted', { id });
  }
}
