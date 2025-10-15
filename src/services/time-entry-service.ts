import { ExecutionContext } from '@/lib/context/execution-context';
import { DatabaseProvider } from '@/providers/database-provider';

export interface TimeEntry {
  id: string;
  employeeId: string;
  projectId: string;
  taskId: string;
  date: string;
  hours: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimeEntryInput {
  employeeId: string;
  projectId: string;
  taskId: string;
  date: string;
  hours: number;
  description?: string;
}

export interface UpdateTimeEntryInput {
  hours?: number;
  description?: string;
}

export class TimeEntryService {
  private db: DatabaseProvider;
  private logger: ExecutionContext['logger'];

  constructor(context: ExecutionContext) {
    this.db = context.db;
    this.logger = context.logger;
  }

  async getAllEntries(): Promise<TimeEntry[]> {
    this.logger.debug('Fetching all time entries');
    
    const query = `
      SELECT 
        id, 
        employee_id as "employeeId",
        project_id as "projectId",
        task_id as "taskId",
        date,
        hours,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM time_entries
      ORDER BY date DESC, created_at DESC
    `;

    const result = await this.db.query(query);
    this.logger.info('Fetched time entries', { count: result.rows.length });
    
    return result.rows;
  }

  async getEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> {
    this.logger.debug('Fetching time entries by employee', { employeeId });
    
    const query = `
      SELECT 
        id, 
        employee_id as "employeeId",
        project_id as "projectId",
        task_id as "taskId",
        date,
        hours,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM time_entries
      WHERE employee_id = $1
      ORDER BY date DESC, created_at DESC
    `;

    const result = await this.db.query(query, [employeeId]);
    this.logger.info('Fetched time entries by employee', { 
      employeeId, 
      count: result.rows.length 
    });
    
    return result.rows;
  }

  async getEntriesByEmployeeAndDateRange(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<TimeEntry[]> {
    this.logger.debug('Fetching time entries by date range', { 
      employeeId, 
      startDate, 
      endDate 
    });
    
    const query = `
      SELECT 
        id, 
        employee_id as "employeeId",
        project_id as "projectId",
        task_id as "taskId",
        date,
        hours,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM time_entries
      WHERE employee_id = $1 
        AND date >= $2 
        AND date <= $3
      ORDER BY date ASC, created_at DESC
    `;

    const result = await this.db.query(query, [employeeId, startDate, endDate]);
    this.logger.info('Fetched time entries by date range', { 
      employeeId, 
      startDate,
      endDate,
      count: result.rows.length 
    });
    
    return result.rows;
  }

  async getEntryByDateAndTask(
    employeeId: string,
    date: string,
    taskId: string
  ): Promise<TimeEntry | null> {
    this.logger.debug('Fetching time entry by date and task', { 
      employeeId, 
      date, 
      taskId 
    });
    
    const query = `
      SELECT 
        id, 
        employee_id as "employeeId",
        project_id as "projectId",
        task_id as "taskId",
        date,
        hours,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM time_entries
      WHERE employee_id = $1 
        AND date = $2 
        AND task_id = $3
      LIMIT 1
    `;

    const result = await this.db.query(query, [employeeId, date, taskId]);
    
    return result.rows[0] || null;
  }

  async createEntry(input: CreateTimeEntryInput): Promise<TimeEntry> {
    this.logger.info('Creating time entry', input);
    
    const query = `
      INSERT INTO time_entries (
        employee_id, 
        project_id, 
        task_id, 
        date, 
        hours, 
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id, 
        employee_id as "employeeId",
        project_id as "projectId",
        task_id as "taskId",
        date,
        hours,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      input.employeeId,
      input.projectId,
      input.taskId,
      input.date,
      input.hours,
      input.description || null,
    ];

    const result = await this.db.query(query, values);
    this.logger.info('Time entry created', { id: result.rows[0].id });
    
    return result.rows[0];
  }

  async updateEntry(id: string, input: UpdateTimeEntryInput): Promise<TimeEntry> {
    this.logger.info('Updating time entry', { id, ...input });
    
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.hours !== undefined) {
      setClauses.push(`hours = $${paramIndex++}`);
      values.push(input.hours);
    }

    if (input.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE time_entries
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, 
        employee_id as "employeeId",
        project_id as "projectId",
        task_id as "taskId",
        date,
        hours,
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    values.push(id);

    const result = await this.db.query(query, values);
    this.logger.info('Time entry updated', { id });
    
    return result.rows[0];
  }

  async deleteEntry(id: string): Promise<void> {
    this.logger.info('Deleting time entry', { id });
    
    const query = 'DELETE FROM time_entries WHERE id = $1';
    await this.db.query(query, [id]);
    
    this.logger.info('Time entry deleted', { id });
  }
}

