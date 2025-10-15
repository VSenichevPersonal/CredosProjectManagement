import { ExecutionContext } from '@/lib/context/execution-context';

export interface DirectionFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Direction {
  id: string;
  name: string;
  code?: string;
  description?: string;
  budget?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DirectionService {
  static async getAllDirections(
    ctx: ExecutionContext,
    filters?: DirectionFilters
  ): Promise<{ data: Direction[]; total: number }> {
    ctx.logger.info('[DirectionService] getAllDirections', { filters });
    await ctx.access.require('directions:read');

    const whereClauses: string[] = ['is_active = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      whereClauses.push(
        `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

    const countQuery = `SELECT COUNT(*) as count FROM directions ${whereClause}`;
    const countResult = await ctx.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const dataQuery = `
      SELECT id, name, code, description, budget, is_active as "isActive",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM directions ${whereClause}
      ORDER BY name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await ctx.db.query(dataQuery, [...params, limit, offset]);
    return { data: result.rows, total };
  }

  static async getDirectionById(ctx: ExecutionContext, id: string): Promise<Direction | null> {
    await ctx.access.require('directions:read');
    const query = `SELECT id, name, code, description, budget, is_active as "isActive",
                          created_at as "createdAt", updated_at as "updatedAt"
                   FROM directions WHERE id = $1`;
    const result = await ctx.db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async createDirection(ctx: ExecutionContext, data: any): Promise<Direction> {
    await ctx.access.require('directions:create');
    const query = `
      INSERT INTO directions (name, code, description, budget)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, code, description, budget, is_active as "isActive",
                created_at as "createdAt", updated_at as "updatedAt"
    `;
    const result = await ctx.db.query(query, [data.name, data.code, data.description, data.budget]);
    return result.rows[0];
  }

  static async updateDirection(ctx: ExecutionContext, id: string, data: any): Promise<Direction> {
    await ctx.access.require('directions:update');
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.code !== undefined) {
      setClauses.push(`code = $${paramIndex++}`);
      values.push(data.code);
    }
    if (data.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.budget !== undefined) {
      setClauses.push(`budget = $${paramIndex++}`);
      values.push(data.budget);
    }

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE directions SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, code, description, budget, is_active as "isActive",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    values.push(id);
    const result = await ctx.db.query(query, values);
    return result.rows[0];
  }

  static async deleteDirection(ctx: ExecutionContext, id: string): Promise<void> {
    await ctx.access.require('directions:delete');
    await ctx.db.query('DELETE FROM directions WHERE id = $1', [id]);
  }
}
