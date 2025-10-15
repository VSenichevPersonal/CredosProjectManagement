import { ExecutionContext } from '@/lib/context/execution-context';

export interface ProjectFilters {
  search?: string;
  directionId?: string;
  managerId?: string;
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}

export interface Project {
  id: string;
  name: string;
  code?: string;
  description?: string;
  directionId: string;
  managerId?: string;
  status: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  currentSpent?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  code?: string;
  description?: string;
  directionId: string;
  managerId?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export class ProjectService {
  /**
   * Get all projects with server-side filtering and pagination
   */
  static async getAllProjects(
    ctx: ExecutionContext,
    filters?: ProjectFilters
  ): Promise<{ data: Project[]; total: number }> {
    ctx.logger.info('[ProjectService] getAllProjects with server-side filtering', { filters });

    await ctx.access.require('projects:read');

    // Build WHERE clauses
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Search filter (ILIKE for case-insensitive search)
    if (filters?.search) {
      whereClauses.push(
        `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Direction filter
    if (filters?.directionId) {
      whereClauses.push(`direction_id = $${paramIndex}`);
      params.push(filters.directionId);
      paramIndex++;
    }

    // Manager filter
    if (filters?.managerId) {
      whereClauses.push(`manager_id = $${paramIndex}`);
      params.push(filters.managerId);
      paramIndex++;
    }

    // Status filter
    if (filters?.status) {
      whereClauses.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    // Priority filter
    if (filters?.priority) {
      whereClauses.push(`priority = $${paramIndex}`);
      params.push(filters.priority);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM projects
      ${whereClause}
    `;

    const countResult = await ctx.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Get paginated data
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const dataQuery = `
      SELECT 
        id,
        name,
        code,
        description,
        direction_id as "directionId",
        manager_id as "managerId",
        status,
        priority,
        start_date as "startDate",
        end_date as "endDate",
        total_budget as "totalBudget",
        current_spent as "currentSpent",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM projects
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await ctx.db.query(dataQuery, [...params, limit, offset]);

    ctx.logger.info('[ProjectService] Projects fetched', {
      count: dataResult.rows.length,
      total,
      limit,
      offset,
    });

    return {
      data: dataResult.rows,
      total,
    };
  }

  /**
   * Get project by ID
   */
  static async getProjectById(ctx: ExecutionContext, id: string): Promise<Project | null> {
    ctx.logger.info('[ProjectService] getProjectById', { id });

    await ctx.access.require('projects:read');

    const query = `
      SELECT 
        id,
        name,
        code,
        description,
        direction_id as "directionId",
        manager_id as "managerId",
        status,
        priority,
        start_date as "startDate",
        end_date as "endDate",
        total_budget as "totalBudget",
        current_spent as "currentSpent",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM projects
      WHERE id = $1
    `;

    const result = await ctx.db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create new project
   */
  static async createProject(
    ctx: ExecutionContext,
    data: CreateProjectInput
  ): Promise<Project> {
    ctx.logger.info('[ProjectService] createProject', { name: data.name });

    await ctx.access.require('projects:create');

    const query = `
      INSERT INTO projects (
        name,
        code,
        description,
        direction_id,
        manager_id,
        status,
        priority,
        start_date,
        end_date,
        total_budget,
        current_spent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id,
        name,
        code,
        description,
        direction_id as "directionId",
        manager_id as "managerId",
        status,
        priority,
        start_date as "startDate",
        end_date as "endDate",
        total_budget as "totalBudget",
        current_spent as "currentSpent",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      data.name,
      data.code || null,
      data.description || null,
      data.directionId,
      data.managerId || null,
      data.status || 'planning',
      data.priority || 'medium',
      data.startDate || null,
      data.endDate || null,
      data.totalBudget || null,
      0, // current_spent
    ];

    const result = await ctx.db.query(query, values);
    ctx.logger.info('[ProjectService] Project created', { id: result.rows[0].id });

    return result.rows[0];
  }

  /**
   * Update project
   */
  static async updateProject(
    ctx: ExecutionContext,
    id: string,
    data: UpdateProjectInput
  ): Promise<Project> {
    ctx.logger.info('[ProjectService] updateProject', { id, ...data });

    await ctx.access.require('projects:update');

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
    if (data.directionId !== undefined) {
      setClauses.push(`direction_id = $${paramIndex++}`);
      values.push(data.directionId);
    }
    if (data.managerId !== undefined) {
      setClauses.push(`manager_id = $${paramIndex++}`);
      values.push(data.managerId);
    }
    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }
    if (data.startDate !== undefined) {
      setClauses.push(`start_date = $${paramIndex++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      setClauses.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
    }
    if (data.totalBudget !== undefined) {
      setClauses.push(`total_budget = $${paramIndex++}`);
      values.push(data.totalBudget);
    }

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE projects
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        name,
        code,
        description,
        direction_id as "directionId",
        manager_id as "managerId",
        status,
        priority,
        start_date as "startDate",
        end_date as "endDate",
        total_budget as "totalBudget",
        current_spent as "currentSpent",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    values.push(id);

    const result = await ctx.db.query(query, values);
    ctx.logger.info('[ProjectService] Project updated', { id });

    return result.rows[0];
  }

  /**
   * Delete project
   */
  static async deleteProject(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info('[ProjectService] deleteProject', { id });

    await ctx.access.require('projects:delete');

    const query = 'DELETE FROM projects WHERE id = $1';
    await ctx.db.query(query, [id]);

    ctx.logger.info('[ProjectService] Project deleted', { id });
  }
}

