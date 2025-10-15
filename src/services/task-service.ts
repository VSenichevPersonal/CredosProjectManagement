import { ExecutionContext } from '@/lib/context/execution-context';

export interface TaskFilters {
  search?: string;
  projectId?: string;
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}

export class TaskService {
  static async getAllTasks(ctx: ExecutionContext, filters?: TaskFilters) {
    ctx.logger.info('[TaskService] getAllTasks', { filters });
    await ctx.access.require('tasks:read');

    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.projectId) {
      whereClauses.push(`project_id = $${paramIndex}`);
      params.push(filters.projectId);
      paramIndex++;
    }

    if (filters?.status) {
      whereClauses.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.priority) {
      whereClauses.push(`priority = $${paramIndex}`);
      params.push(filters.priority);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countQuery = `SELECT COUNT(*) as count FROM tasks ${whereClause}`;
    const countResult = await ctx.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const dataQuery = `
      SELECT id, name, description, project_id as "projectId", assignee_id as "assigneeId",
             status, priority, estimated_hours as "estimatedHours", actual_hours as "actualHours",
             due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"
      FROM tasks ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await ctx.db.query(dataQuery, [...params, limit, offset]);
    return { data: result.rows, total };
  }

  static async getTaskById(ctx: ExecutionContext, id: string) {
    await ctx.access.require('tasks:read');
    const query = `SELECT id, name, description, project_id as "projectId", assignee_id as "assigneeId",
                          status, priority, estimated_hours as "estimatedHours", actual_hours as "actualHours",
                          due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"
                   FROM tasks WHERE id = $1`;
    const result = await ctx.db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async createTask(ctx: ExecutionContext, data: any) {
    await ctx.access.require('tasks:create');
    const query = `
      INSERT INTO tasks (name, description, project_id, assignee_id, status, priority, estimated_hours, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, description, project_id as "projectId", assignee_id as "assigneeId",
                status, priority, estimated_hours as "estimatedHours", actual_hours as "actualHours",
                due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const result = await ctx.db.query(query, [data.name, data.description, data.projectId, data.assigneeId, data.status || 'todo', data.priority || 'medium', data.estimatedHours, data.dueDate]);
    return result.rows[0];
  }

  static async updateTask(ctx: ExecutionContext, id: string, data: any) {
    await ctx.access.require('tasks:update');
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { setClauses.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { setClauses.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.projectId !== undefined) { setClauses.push(`project_id = $${paramIndex++}`); values.push(data.projectId); }
    if (data.assigneeId !== undefined) { setClauses.push(`assignee_id = $${paramIndex++}`); values.push(data.assigneeId); }
    if (data.status !== undefined) { setClauses.push(`status = $${paramIndex++}`); values.push(data.status); }
    if (data.priority !== undefined) { setClauses.push(`priority = $${paramIndex++}`); values.push(data.priority); }
    if (data.estimatedHours !== undefined) { setClauses.push(`estimated_hours = $${paramIndex++}`); values.push(data.estimatedHours); }
    if (data.dueDate !== undefined) { setClauses.push(`due_date = $${paramIndex++}`); values.push(data.dueDate); }
    setClauses.push(`updated_at = NOW()`);

    const query = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
                   RETURNING id, name, description, project_id as "projectId", assignee_id as "assigneeId",
                             status, priority, estimated_hours as "estimatedHours", actual_hours as "actualHours",
                             due_date as "dueDate", created_at as "createdAt", updated_at as "updatedAt"`;
    values.push(id);
    const result = await ctx.db.query(query, values);
    return result.rows[0];
  }

  static async deleteTask(ctx: ExecutionContext, id: string) {
    await ctx.access.require('tasks:delete');
    await ctx.db.query('DELETE FROM tasks WHERE id = $1', [id]);
  }
}
