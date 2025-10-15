import { ExecutionContext } from '@/lib/context/execution-context';
import type { DirectionFilters } from '@/providers/database-provider.interface';
import type { Direction } from '@/types/domain';

export class DirectionService {
  /**
   * Get all directions with server-side filtering and pagination
   * Refactored to use Repository Pattern
   */
  static async getAllDirections(
    ctx: ExecutionContext,
    filters?: DirectionFilters
  ): Promise<{ data: Direction[]; total: number }> {
    ctx.logger.info('[DirectionService] getAllDirections', { filters });
    await ctx.access.require('directions:read');

    // ✅ Use repository instead of raw SQL
    const [data, total] = await Promise.all([
      ctx.db.directions.getAll(ctx, filters),
      ctx.db.directions.getCount(ctx, filters)
    ]);

    ctx.logger.info('[DirectionService] Directions fetched', {
      count: data.length,
      total
    });

    return { data, total };
  }

  /**
   * Get direction by ID
   */
  static async getDirectionById(ctx: ExecutionContext, id: string): Promise<Direction | null> {
    ctx.logger.info('[DirectionService] getDirectionById', { id });
    await ctx.access.require('directions:read');

    return ctx.db.directions.getById(ctx, id);
  }

  /**
   * Create new direction
   */
  static async createDirection(ctx: ExecutionContext, data: any): Promise<Direction> {
    ctx.logger.info('[DirectionService] createDirection', { name: data.name });
    await ctx.access.require('directions:create');

    const direction = await ctx.db.directions.create(ctx, {
      name: data.name,
      description: data.description,
      budget: data.budget,
      budgetThreshold: data.budgetThreshold,
      color: data.color || '#000000',
      isActive: true
    });

    ctx.logger.info('[DirectionService] Direction created', { id: direction.id });

    return direction;
  }

  /**
   * Update direction
   */
  static async updateDirection(ctx: ExecutionContext, id: string, data: any): Promise<Direction> {
    ctx.logger.info('[DirectionService] updateDirection', { id });
    await ctx.access.require('directions:update');

    const direction = await ctx.db.directions.update(ctx, id, data);

    ctx.logger.info('[DirectionService] Direction updated', { id });

    return direction;
  }

  /**
   * Delete direction (soft delete)
   */
  static async deleteDirection(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info('[DirectionService] deleteDirection', { id });
    await ctx.access.require('directions:delete');

    await ctx.db.directions.delete(ctx, id);

    ctx.logger.info('[DirectionService] Direction deleted', { id });
  }
}
