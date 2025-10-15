import { Pool, PoolClient } from 'pg';
import type {
  DatabaseProvider,
  DirectionFilters,
  EmployeeFilters,
  QueryResult,
} from './database-provider.interface';
import type {
  Employee,
  Direction,
  Project,
  Task,
  TimeEntry,
  ProjectFilters,
  TaskFilters,
  TimeEntryFilters,
  CreateProjectDTO,
  UpdateProjectDTO,
  CreateTaskDTO,
  UpdateTaskDTO,
  CreateTimeEntryDTO,
  UpdateTimeEntryDTO,
  ApproveTimeEntryDTO,
  RevenueManual,
  CreateRevenueManualDTO,
  RevenueFilters,
  SalaryRegister,
  CreateSalaryRegisterDTO,
} from '@/types/domain';
import type { ExecutionContext } from '@/lib/context/execution-context';

/**
 * PostgreSQL Database Provider
 * Использует прямое подключение к PostgreSQL через pg
 */
export class PostgresDatabaseProvider implements DatabaseProvider {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  async _rawQuery<T = any>(ctx: ExecutionContext, sql: string, params: any[] = []): Promise<QueryResult<T>> {
    ctx.logger.debug('[PostgresProvider] _rawQuery', { sql: sql.substring(0, 100) });
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0
      };
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // DIRECTIONS
  // ============================================================================

  directions = {
    getAll: async (ctx: ExecutionContext, filters?: DirectionFilters): Promise<Direction[]> => {
      let query = 'SELECT * FROM directions WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters?.isActive !== undefined) {
        query += ` AND is_active = $${paramCount}`;
        params.push(filters.isActive);
        paramCount++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this._rawQuery<Direction>(ctx, query, params);
      return result.rows;
    },

    getCount: async (ctx: ExecutionContext, filters?: DirectionFilters): Promise<number> => {
      let query = 'SELECT COUNT(*) as count FROM directions WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters?.isActive !== undefined) {
        query += ` AND is_active = $${paramCount}`;
        params.push(filters.isActive);
      }

      const result = await this._rawQuery<{ count: string }>(ctx, query, params);
      return parseInt(result.rows[0]?.count || '0');
    },

    getById: async (ctx: ExecutionContext, id: string): Promise<Direction | null> => {
      const result = await this._rawQuery<Direction>(ctx, 'SELECT * FROM directions WHERE id = $1', [id]);
      return result.rows[0] || null;
    },

    create: async (ctx: ExecutionContext, data: any): Promise<Direction> => {
      const query = `
        INSERT INTO directions (name, code, description, color, budget, budget_threshold, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await this._rawQuery<Direction>(ctx, query, [
        data.name,
        data.code,
        data.description,
        data.color,
        data.budget || 0,
        data.budgetThreshold || 0,
        data.isActive !== false,
      ]);
      return result.rows[0];
    },

    update: async (ctx: ExecutionContext, id: string, data: any): Promise<Direction> => {
      const fields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        params.push(data.name);
      }
      if (data.code !== undefined) {
        fields.push(`code = $${paramCount++}`);
        params.push(data.code);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        params.push(data.description);
      }
      if (data.color !== undefined) {
        fields.push(`color = $${paramCount++}`);
        params.push(data.color);
      }
      if (data.budget !== undefined) {
        fields.push(`budget = $${paramCount++}`);
        params.push(data.budget);
      }
      if (data.budgetThreshold !== undefined) {
        fields.push(`budget_threshold = $${paramCount++}`);
        params.push(data.budgetThreshold);
      }
      if (data.isActive !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        params.push(data.isActive);
      }

      fields.push(`updated_at = NOW()`);
      params.push(id);

      const query = `UPDATE directions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await this._rawQuery<Direction>(ctx, query, params);
      return result.rows[0];
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      await this._rawQuery(ctx, 'DELETE FROM directions WHERE id = $1', [id]);
    },
  };

  // ============================================================================
  // EMPLOYEES
  // ============================================================================

  employees = {
    getAll: async (ctx: ExecutionContext, filters?: EmployeeFilters): Promise<Employee[]> => {
      let query = 'SELECT * FROM employees WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR position ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters?.directionId) {
        query += ` AND direction_id = $${paramCount}`;
        params.push(filters.directionId);
        paramCount++;
      }

      if (filters?.isActive !== undefined) {
        query += ` AND is_active = $${paramCount}`;
        params.push(filters.isActive);
        paramCount++;
      }

      query += ' ORDER BY full_name';

      if (filters?.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this._rawQuery<Employee>(ctx, query, params);
      return result.rows;
    },

    getCount: async (ctx: ExecutionContext, filters?: EmployeeFilters): Promise<number> => {
      let query = 'SELECT COUNT(*) as count FROM employees WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters?.directionId) {
        query += ` AND direction_id = $${paramCount}`;
        params.push(filters.directionId);
        paramCount++;
      }

      if (filters?.isActive !== undefined) {
        query += ` AND is_active = $${paramCount}`;
        params.push(filters.isActive);
      }

      const result = await this._rawQuery<{ count: string }>(ctx, query, params);
      return parseInt(result.rows[0]?.count || '0');
    },

    getById: async (ctx: ExecutionContext, id: string): Promise<Employee | null> => {
      const result = await this._rawQuery<Employee>(ctx, 'SELECT * FROM employees WHERE id = $1', [id]);
      return result.rows[0] || null;
    },

    getByEmail: async (ctx: ExecutionContext, email: string): Promise<Employee | null> => {
      const result = await this._rawQuery<Employee>(ctx, 'SELECT * FROM employees WHERE email = $1', [email]);
      return result.rows[0] || null;
    },

    getByDirection: async (ctx: ExecutionContext, directionId: string): Promise<Employee[]> => {
      const result = await this._rawQuery<Employee>(
        ctx,
        'SELECT * FROM employees WHERE direction_id = $1 ORDER BY full_name',
        [directionId]
      );
      return result.rows;
    },

    getSubordinates: async (ctx: ExecutionContext, managerId: string): Promise<Employee[]> => {
      // Assuming there's a manager_id field or we use project assignments
      // For now, return empty array (implement based on your schema)
      return [];
    },

    create: async (ctx: ExecutionContext, data: any): Promise<Employee> => {
      const query = `
        INSERT INTO employees (email, full_name, position, direction_id, default_hourly_rate, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await this._rawQuery<Employee>(ctx, query, [
        data.email,
        data.fullName,
        data.position,
        data.directionId,
        data.defaultHourlyRate || 0,
        data.isActive !== false,
      ]);
      return result.rows[0];
    },

    update: async (ctx: ExecutionContext, id: string, data: any): Promise<Employee> => {
      const fields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        params.push(data.email);
      }
      if (data.fullName !== undefined) {
        fields.push(`full_name = $${paramCount++}`);
        params.push(data.fullName);
      }
      if (data.position !== undefined) {
        fields.push(`position = $${paramCount++}`);
        params.push(data.position);
      }
      if (data.directionId !== undefined) {
        fields.push(`direction_id = $${paramCount++}`);
        params.push(data.directionId);
      }
      if (data.defaultHourlyRate !== undefined) {
        fields.push(`default_hourly_rate = $${paramCount++}`);
        params.push(data.defaultHourlyRate);
      }
      if (data.isActive !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        params.push(data.isActive);
      }

      fields.push(`updated_at = NOW()`);
      params.push(id);

      const query = `UPDATE employees SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await this._rawQuery<Employee>(ctx, query, params);
      return result.rows[0];
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      await this._rawQuery(ctx, 'DELETE FROM employees WHERE id = $1', [id]);
    },
  };

  // ============================================================================
  // PROJECTS
  // ============================================================================

  projects = {
    getAll: async (ctx: ExecutionContext, filters?: ProjectFilters): Promise<Project[]> => {
      let query = 'SELECT * FROM projects WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters?.directionId) {
        query += ` AND direction_id = $${paramCount}`;
        params.push(filters.directionId);
        paramCount++;
      }

      if (filters?.managerId) {
        query += ` AND manager_id = $${paramCount}`;
        params.push(filters.managerId);
        paramCount++;
      }

      if (filters?.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters?.priority) {
        query += ` AND priority = $${paramCount}`;
        params.push(filters.priority);
        paramCount++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this._rawQuery<Project>(ctx, query, params);
      return result.rows;
    },

    getCount: async (ctx: ExecutionContext, filters?: ProjectFilters): Promise<number> => {
      let query = 'SELECT COUNT(*) as count FROM projects WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters?.directionId) {
        query += ` AND direction_id = $${paramCount}`;
        params.push(filters.directionId);
        paramCount++;
      }

      if (filters?.managerId) {
        query += ` AND manager_id = $${paramCount}`;
        params.push(filters.managerId);
        paramCount++;
      }

      if (filters?.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      const result = await this._rawQuery<{ count: string }>(ctx, query, params);
      return parseInt(result.rows[0]?.count || '0');
    },

    getById: async (ctx: ExecutionContext, id: string): Promise<Project | null> => {
      const result = await this._rawQuery<Project>(ctx, 'SELECT * FROM projects WHERE id = $1', [id]);
      return result.rows[0] || null;
    },

    getByManager: async (ctx: ExecutionContext, managerId: string): Promise<Project[]> => {
      const result = await this._rawQuery<Project>(
        ctx,
        'SELECT * FROM projects WHERE manager_id = $1 ORDER BY created_at DESC',
        [managerId]
      );
      return result.rows;
    },

    getByDirection: async (ctx: ExecutionContext, directionId: string): Promise<Project[]> => {
      const result = await this._rawQuery<Project>(
        ctx,
        'SELECT * FROM projects WHERE direction_id = $1 ORDER BY created_at DESC',
        [directionId]
      );
      return result.rows;
    },

    create: async (ctx: ExecutionContext, data: CreateProjectDTO): Promise<Project> => {
      const query = `
        INSERT INTO projects (
          name, code, description, direction_id, manager_id,
          status, priority, start_date, end_date, total_budget, current_spent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)
        RETURNING *
      `;
      const result = await this._rawQuery<Project>(ctx, query, [
        data.name,
        data.code || null,
        data.description || null,
        data.directionId,
        data.managerId || null,
        data.status || 'planning',
        data.priority || 'medium',
        data.startDate || null,
        data.endDate || null,
        data.totalBudget || 0,
      ]);
      return result.rows[0];
    },

    update: async (ctx: ExecutionContext, id: string, data: UpdateProjectDTO): Promise<Project> => {
      const fields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        params.push(data.name);
      }
      if (data.code !== undefined) {
        fields.push(`code = $${paramCount++}`);
        params.push(data.code);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        params.push(data.description);
      }
      if (data.directionId !== undefined) {
        fields.push(`direction_id = $${paramCount++}`);
        params.push(data.directionId);
      }
      if (data.managerId !== undefined) {
        fields.push(`manager_id = $${paramCount++}`);
        params.push(data.managerId);
      }
      if (data.status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        params.push(data.status);
      }
      if (data.priority !== undefined) {
        fields.push(`priority = $${paramCount++}`);
        params.push(data.priority);
      }
      if (data.startDate !== undefined) {
        fields.push(`start_date = $${paramCount++}`);
        params.push(data.startDate);
      }
      if (data.endDate !== undefined) {
        fields.push(`end_date = $${paramCount++}`);
        params.push(data.endDate);
      }
      if (data.totalBudget !== undefined) {
        fields.push(`total_budget = $${paramCount++}`);
        params.push(data.totalBudget);
      }

      fields.push(`updated_at = NOW()`);
      params.push(id);

      const query = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await this._rawQuery<Project>(ctx, query, params);
      return result.rows[0];
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      await this._rawQuery(ctx, 'DELETE FROM projects WHERE id = $1', [id]);
    },
  };

  // ============================================================================
  // TASKS
  // ============================================================================

  tasks = {
    getAll: async (ctx: ExecutionContext, filters?: TaskFilters): Promise<Task[]> => {
      let query = 'SELECT * FROM tasks WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters?.projectId) {
        query += ` AND project_id = $${paramCount}`;
        params.push(filters.projectId);
        paramCount++;
      }

      if (filters?.assigneeId) {
        query += ` AND assignee_id = $${paramCount}`;
        params.push(filters.assigneeId);
        paramCount++;
      }

      if (filters?.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters?.priority) {
        query += ` AND priority = $${paramCount}`;
        params.push(filters.priority);
        paramCount++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this._rawQuery<Task>(ctx, query, params);
      return result.rows;
    },

    getCount: async (ctx: ExecutionContext, filters?: TaskFilters): Promise<number> => {
      let query = 'SELECT COUNT(*) as count FROM tasks WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.search) {
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters?.projectId) {
        query += ` AND project_id = $${paramCount}`;
        params.push(filters.projectId);
        paramCount++;
      }

      if (filters?.assigneeId) {
        query += ` AND assignee_id = $${paramCount}`;
        params.push(filters.assigneeId);
        paramCount++;
      }

      if (filters?.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      const result = await this._rawQuery<{ count: string }>(ctx, query, params);
      return parseInt(result.rows[0]?.count || '0');
    },

    getById: async (ctx: ExecutionContext, id: string): Promise<Task | null> => {
      const result = await this._rawQuery<Task>(ctx, 'SELECT * FROM tasks WHERE id = $1', [id]);
      return result.rows[0] || null;
    },

    getByProject: async (ctx: ExecutionContext, projectId: string): Promise<Task[]> => {
      const result = await this._rawQuery<Task>(
        ctx,
        'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      );
      return result.rows;
    },

    getByAssignee: async (ctx: ExecutionContext, assigneeId: string): Promise<Task[]> => {
      const result = await this._rawQuery<Task>(
        ctx,
        'SELECT * FROM tasks WHERE assignee_id = $1 ORDER BY created_at DESC',
        [assigneeId]
      );
      return result.rows;
    },

    create: async (ctx: ExecutionContext, data: CreateTaskDTO): Promise<Task> => {
      const query = `
        INSERT INTO tasks (
          project_id, name, description, assignee_id,
          status, priority, estimated_hours, due_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const result = await this._rawQuery<Task>(ctx, query, [
        data.projectId,
        data.name,
        data.description || null,
        data.assigneeId || null,
        data.status || 'todo',
        data.priority || 'medium',
        data.estimatedHours || null,
        data.dueDate || null,
      ]);
      return result.rows[0];
    },

    update: async (ctx: ExecutionContext, id: string, data: UpdateTaskDTO): Promise<Task> => {
      const fields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        params.push(data.name);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        params.push(data.description);
      }
      if (data.projectId !== undefined) {
        fields.push(`project_id = $${paramCount++}`);
        params.push(data.projectId);
      }
      if (data.assigneeId !== undefined) {
        fields.push(`assignee_id = $${paramCount++}`);
        params.push(data.assigneeId);
      }
      if (data.status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        params.push(data.status);
      }
      if (data.priority !== undefined) {
        fields.push(`priority = $${paramCount++}`);
        params.push(data.priority);
      }
      if (data.estimatedHours !== undefined) {
        fields.push(`estimated_hours = $${paramCount++}`);
        params.push(data.estimatedHours);
      }
      if (data.actualHours !== undefined) {
        fields.push(`actual_hours = $${paramCount++}`);
        params.push(data.actualHours);
      }
      if (data.dueDate !== undefined) {
        fields.push(`due_date = $${paramCount++}`);
        params.push(data.dueDate);
      }

      fields.push(`updated_at = NOW()`);
      params.push(id);

      const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await this._rawQuery<Task>(ctx, query, params);
      return result.rows[0];
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      await this._rawQuery(ctx, 'DELETE FROM tasks WHERE id = $1', [id]);
    },
  };

  // ============================================================================
  // TIME ENTRIES
  // ============================================================================

  timeEntries = {
    getAll: async (ctx: ExecutionContext, filters?: TimeEntryFilters): Promise<TimeEntry[]> => {
      let query = 'SELECT * FROM time_entries WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters?.employeeId) {
        query += ` AND employee_id = $${paramCount}`;
        params.push(filters.employeeId);
        paramCount++;
      }

      if (filters?.projectId) {
        query += ` AND project_id = $${paramCount}`;
        params.push(filters.projectId);
        paramCount++;
      }

      if (filters?.dateFrom) {
        query += ` AND date >= $${paramCount}`;
        params.push(filters.dateFrom);
        paramCount++;
      }

      if (filters?.dateTo) {
        query += ` AND date <= $${paramCount}`;
        params.push(filters.dateTo);
        paramCount++;
      }

      if (filters?.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      query += ' ORDER BY date DESC, created_at DESC';

      if (filters?.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this._rawQuery<TimeEntry>(ctx, query, params);
      return result.rows;
    },

    getById: async (ctx: ExecutionContext, id: string): Promise<TimeEntry | null> => {
      const result = await this._rawQuery<TimeEntry>(ctx, 'SELECT * FROM time_entries WHERE id = $1', [id]);
      return result.rows[0] || null;
    },

    getByEmployee: async (ctx: ExecutionContext, employeeId: string): Promise<TimeEntry[]> => {
      const result = await this._rawQuery<TimeEntry>(
        ctx,
        'SELECT * FROM time_entries WHERE employee_id = $1 ORDER BY date DESC',
        [employeeId]
      );
      return result.rows;
    },

    getByTask: async (ctx: ExecutionContext, taskId: string): Promise<TimeEntry[]> => {
      const result = await this._rawQuery<TimeEntry>(
        ctx,
        'SELECT * FROM time_entries WHERE task_id = $1 ORDER BY date DESC',
        [taskId]
      );
      return result.rows;
    },

    getPendingApprovals: async (ctx: ExecutionContext): Promise<TimeEntry[]> => {
      const result = await this._rawQuery<TimeEntry>(
        ctx,
        "SELECT * FROM time_entries WHERE status = 'submitted' ORDER BY date DESC"
      );
      return result.rows;
    },

    create: async (ctx: ExecutionContext, data: CreateTimeEntryDTO): Promise<TimeEntry> => {
      const query = `
        INSERT INTO time_entries (employee_id, project_id, date, hours, description, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await this._rawQuery<TimeEntry>(ctx, query, [
        data.employeeId,
        data.projectId,
        data.date,
        data.hours,
        data.description || null,
        'submitted',
      ]);
      return result.rows[0];
    },

    update: async (ctx: ExecutionContext, id: string, data: UpdateTimeEntryDTO): Promise<TimeEntry> => {
      const fields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.hours !== undefined) {
        fields.push(`hours = $${paramCount++}`);
        params.push(data.hours);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        params.push(data.description);
      }
      if (data.status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        params.push(data.status);
      }

      fields.push(`updated_at = NOW()`);
      params.push(id);

      const query = `UPDATE time_entries SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await this._rawQuery<TimeEntry>(ctx, query, params);
      return result.rows[0];
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      await this._rawQuery(ctx, 'DELETE FROM time_entries WHERE id = $1', [id]);
    },

    approve: async (ctx: ExecutionContext, data: ApproveTimeEntryDTO): Promise<void> => {
      // TODO: Implement batch approval
      throw new Error('Not implemented');
    },

    reject: async (ctx: ExecutionContext, ids: string[], approverId: string, reason: string): Promise<void> => {
      const query = `
        UPDATE time_entries 
        SET status = 'rejected', 
            updated_at = NOW()
        WHERE id = ANY($1)
      `;
      await this._rawQuery(ctx, query, [ids]);
    },
  };

  // ============================================================================
  // FINANCE (Stubs)
  // ============================================================================

  finance = {
    revenues: {
      getAll: async (ctx: ExecutionContext, filters?: RevenueFilters): Promise<RevenueManual[]> => {
        return [];
      },
      create: async (ctx: ExecutionContext, data: CreateRevenueManualDTO): Promise<RevenueManual> => {
        throw new Error('Not implemented');
      },
    },
    salaryRegister: {
      getAll: async (ctx: ExecutionContext): Promise<SalaryRegister[]> => {
        return [];
      },
      create: async (ctx: ExecutionContext, data: CreateSalaryRegisterDTO): Promise<SalaryRegister> => {
        throw new Error('Not implemented');
      },
    },
  };

  // ============================================================================
  // DASHBOARD (Stub)
  // ============================================================================

  dashboard = {
    getMetrics: async (ctx: ExecutionContext) => {
      return {
        totalProjects: 0,
        activeProjects: 0,
        totalEmployees: 0,
        totalHoursThisMonth: 0,
        totalHoursThisWeek: 0,
        pendingApprovals: 0,
        overdueTasks: 0,
      };
    },
    getDirectionMetrics: async (ctx: ExecutionContext): Promise<any[]> => {
      return [];
    },
    getEmployeeMetrics: async (ctx: ExecutionContext, employeeId: string) => {
      return {
        totalHoursThisMonth: 0,
        totalHoursThisWeek: 0,
        activeProjects: 0,
        pendingTimeEntries: 0,
      };
    },
  };

  // ============================================================================
  // UTILS (Stub)
  // ============================================================================

  utils = {
    healthCheck: async (): Promise<boolean> => {
      try {
        const client = await this.pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
      } catch {
        return false;
      }
    },
    getDatabaseStats: async (): Promise<{ totalRecords: number; lastBackup: string; version: string }> => {
      return {
        totalRecords: 0,
        lastBackup: new Date().toISOString(),
        version: '1.0.0',
      };
    },
  };
}

