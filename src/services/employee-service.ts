import { ExecutionContext } from '@/lib/context/execution-context';

export interface EmployeeFilters {
  search?: string;
  directionId?: string;
  limit?: number;
  offset?: number;
}

export class EmployeeService {
  static async getAllEmployees(ctx: ExecutionContext, filters?: EmployeeFilters) {
    ctx.logger.info('[EmployeeService] getAllEmployees', { filters });
    await ctx.access.require('employees:read');

    const whereClauses: string[] = ['is_active = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      whereClauses.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR position ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.directionId) {
      whereClauses.push(`direction_id = $${paramIndex}`);
      params.push(filters.directionId);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
    const countQuery = `SELECT COUNT(*) as count FROM employees ${whereClause}`;
    const countResult = await ctx.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const dataQuery = `
      SELECT id, full_name as "fullName", email, phone, position, direction_id as "directionId",
             default_hourly_rate as "defaultHourlyRate", is_active as "isActive",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM employees ${whereClause}
      ORDER BY full_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await ctx.db.query(dataQuery, [...params, limit, offset]);
    return { data: result.rows, total };
  }

  static async getEmployeeById(ctx: ExecutionContext, id: string) {
    await ctx.access.require('employees:read');
    const query = `SELECT id, full_name as "fullName", email, phone, position, direction_id as "directionId",
                          default_hourly_rate as "defaultHourlyRate", is_active as "isActive",
                          created_at as "createdAt", updated_at as "updatedAt"
                   FROM employees WHERE id = $1`;
    const result = await ctx.db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async createEmployee(ctx: ExecutionContext, data: any) {
    await ctx.access.require('employees:create');
    const query = `
      INSERT INTO employees (full_name, email, phone, position, direction_id, default_hourly_rate)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, full_name as "fullName", email, phone, position, direction_id as "directionId",
                default_hourly_rate as "defaultHourlyRate", is_active as "isActive",
                created_at as "createdAt", updated_at as "updatedAt"
    `;
    const result = await ctx.db.query(query, [data.fullName, data.email, data.phone, data.position, data.directionId, data.defaultHourlyRate]);
    return result.rows[0];
  }

  static async updateEmployee(ctx: ExecutionContext, id: string, data: any) {
    await ctx.access.require('employees:update');
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.fullName !== undefined) { setClauses.push(`full_name = $${paramIndex++}`); values.push(data.fullName); }
    if (data.email !== undefined) { setClauses.push(`email = $${paramIndex++}`); values.push(data.email); }
    if (data.phone !== undefined) { setClauses.push(`phone = $${paramIndex++}`); values.push(data.phone); }
    if (data.position !== undefined) { setClauses.push(`position = $${paramIndex++}`); values.push(data.position); }
    if (data.directionId !== undefined) { setClauses.push(`direction_id = $${paramIndex++}`); values.push(data.directionId); }
    if (data.defaultHourlyRate !== undefined) { setClauses.push(`default_hourly_rate = $${paramIndex++}`); values.push(data.defaultHourlyRate); }
    setClauses.push(`updated_at = NOW()`);

    const query = `UPDATE employees SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
                   RETURNING id, full_name as "fullName", email, phone, position, direction_id as "directionId",
                             default_hourly_rate as "defaultHourlyRate", is_active as "isActive",
                             created_at as "createdAt", updated_at as "updatedAt"`;
    values.push(id);
    const result = await ctx.db.query(query, values);
    return result.rows[0];
  }

  static async deleteEmployee(ctx: ExecutionContext, id: string) {
    await ctx.access.require('employees:delete');
    await ctx.db.query('UPDATE employees SET is_active = false WHERE id = $1', [id]);
  }
}
