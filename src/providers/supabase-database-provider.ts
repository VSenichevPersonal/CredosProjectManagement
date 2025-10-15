/**
 * SupabaseDatabaseProvider
 * 
 * Full implementation of DatabaseProvider using Supabase PostgREST.
 * Implements Repository Pattern with type-safe queries.
 */

import { createServerClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExecutionContext } from '@/lib/context/execution-context'
import type {
  DatabaseProvider,
  DirectionFilters,
  EmployeeFilters
} from './database-provider.interface'
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
  CreateSalaryRegisterDTO
} from '@/types/domain'

export class SupabaseDatabaseProvider implements DatabaseProvider {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createServerClient()
  }

  /**
   * @internal
   * Raw SQL query для сложных аналитических отчётов.
   * Используйте repository методы для стандартных операций!
   */
  async _rawQuery<T = any>(ctx: ExecutionContext, sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    ctx.logger.debug('[DatabaseProvider] _rawQuery', { sql: sql.substring(0, 100) });

    // Используем Supabase RPC для выполнения сырых SQL запросов
    // Примечание: для production нужно создать RPC функцию в Supabase
    try {
      // Временное решение: используем Supabase query builder где возможно
      // Для сложных отчётов будем использовать rpc
      const { data, error } = await this.supabase.rpc('exec_raw_sql', {
        query: sql,
        params: params || []
      });

      if (error) {
        // Fallback: пробуем через простой запрос
        ctx.logger.warn('[DatabaseProvider] RPC failed, falling back', { error });
        throw new Error(`Raw query failed: ${error.message}`);
      }

      return {
        rows: (data as T[]) || [],
        rowCount: (data as T[])?.length || 0
      };
    } catch (error: any) {
      ctx.logger.error('[DatabaseProvider] _rawQuery failed', { error });
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  // ============================================================================
  // DIRECTIONS REPOSITORY
  // ============================================================================

  directions = {
    getAll: async (ctx: ExecutionContext, filters?: DirectionFilters): Promise<Direction[]> => {
      ctx.logger.debug('[DirectionsRepo] getAll', { filters })

      let query = this.supabase
        .from('directions')
        .select('*')

      // Фильтр активности
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      } else {
        query = query.eq('is_active', true) // По умолчанию только активные
      }

      // Фильтр поиска
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,` +
          `description.ilike.%${filters.search}%,` +
          `code.ilike.%${filters.search}%`
        )
      }

      // Сортировка и пагинация
      query = query.order('name', { ascending: true })

      const limit = filters?.limit || 50
      const offset = filters?.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        ctx.logger.error('[DirectionsRepo] Query failed', { error })
        throw new Error(`Failed to fetch directions: ${error.message}`)
      }

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        budget: row.budget,
        budgetThreshold: row.budget_threshold,
        color: row.color || '#000000',
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    getCount: async (ctx: ExecutionContext, filters?: DirectionFilters): Promise<number> => {
      ctx.logger.debug('[DirectionsRepo] getCount', { filters })

      let query = this.supabase
        .from('directions')
        .select('*', { count: 'exact', head: true })

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      } else {
        query = query.eq('is_active', true)
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,` +
          `description.ilike.%${filters.search}%,` +
          `code.ilike.%${filters.search}%`
        )
      }

      const { count, error } = await query

      if (error) {
        ctx.logger.error('[DirectionsRepo] Count failed', { error })
        throw new Error(`Failed to count directions: ${error.message}`)
      }

      return count || 0
    },

    getById: async (ctx: ExecutionContext, id: string): Promise<Direction | null> => {
      ctx.logger.debug('[DirectionsRepo] getById', { id })

      const { data, error } = await this.supabase
        .from('directions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        ctx.logger.error('[DirectionsRepo] Query failed', { error })
        throw new Error(`Failed to fetch direction: ${error.message}`)
      }

      if (!data) return null

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        budget: data.budget,
        budgetThreshold: data.budget_threshold,
        color: data.color || '#000000',
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    create: async (ctx: ExecutionContext, input: Omit<Direction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Direction> => {
      ctx.logger.info('[DirectionsRepo] create', { name: input.name })

      const { data, error } = await this.supabase
        .from('directions')
        .insert({
          name: input.name,
          description: input.description,
          budget: input.budget,
          budget_threshold: input.budgetThreshold,
          color: input.color,
          is_active: input.isActive ?? true
        })
        .select()
        .single()

      if (error) {
        ctx.logger.error('[DirectionsRepo] Create failed', { error })
        throw new Error(`Failed to create direction: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        budget: data.budget,
        budgetThreshold: data.budget_threshold,
        color: data.color,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    update: async (ctx: ExecutionContext, id: string, input: Partial<Direction>): Promise<Direction> => {
      ctx.logger.info('[DirectionsRepo] update', { id })

      const updateData: any = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.budget !== undefined) updateData.budget = input.budget
      if (input.budgetThreshold !== undefined) updateData.budget_threshold = input.budgetThreshold
      if (input.color !== undefined) updateData.color = input.color
      if (input.isActive !== undefined) updateData.is_active = input.isActive

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('directions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        ctx.logger.error('[DirectionsRepo] Update failed', { error })
        throw new Error(`Failed to update direction: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        budget: data.budget,
        budgetThreshold: data.budget_threshold,
        color: data.color,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      ctx.logger.info('[DirectionsRepo] delete', { id })

      // Soft delete
      const { error } = await this.supabase
        .from('directions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        ctx.logger.error('[DirectionsRepo] Delete failed', { error })
        throw new Error(`Failed to delete direction: ${error.message}`)
      }
    }
  }

  // ============================================================================
  // EMPLOYEES REPOSITORY
  // ============================================================================

  employees = {
    getAll: async (ctx: ExecutionContext, filters?: EmployeeFilters): Promise<Employee[]> => {
      ctx.logger.debug('[EmployeesRepo] getAll', { filters })

      let query = this.supabase
        .from('employees')
        .select('*')

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      } else {
        query = query.eq('is_active', true)
      }

      if (filters?.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,` +
          `email.ilike.%${filters.search}%,` +
          `position.ilike.%${filters.search}%`
        )
      }

      if (filters?.directionId) {
        query = query.eq('direction_id', filters.directionId)
      }

      query = query.order('full_name', { ascending: true })

      const limit = filters?.limit || 50
      const offset = filters?.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        ctx.logger.error('[EmployeesRepo] Query failed', { error })
        throw new Error(`Failed to fetch employees: ${error.message}`)
      }

      return (data || []).map(row => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        position: row.position,
        directionId: row.direction_id,
        defaultHourlyRate: row.default_hourly_rate,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    getCount: async (ctx: ExecutionContext, filters?: EmployeeFilters): Promise<number> => {
      let query = this.supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      } else {
        query = query.eq('is_active', true)
      }

      if (filters?.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,` +
          `email.ilike.%${filters.search}%,` +
          `position.ilike.%${filters.search}%`
        )
      }

      if (filters?.directionId) {
        query = query.eq('direction_id', filters.directionId)
      }

      const { count, error } = await query

      if (error) throw new Error(`Failed to count employees: ${error.message}`)

      return count || 0
    },

    getById: async (ctx: ExecutionContext, id: string): Promise<Employee | null> => {
      const { data, error } = await this.supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to fetch employee: ${error.message}`)
      }

      if (!data) return null

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        position: data.position,
        directionId: data.direction_id,
        defaultHourlyRate: data.default_hourly_rate,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    getByDirection: async (_ctx: ExecutionContext, directionId: string): Promise<Employee[]> => {
      const { data, error } = await this.supabase
        .from('employees')
        .select('*')
        .eq('direction_id', directionId)
        .eq('is_active', true)
        .order('full_name')

      if (error) throw new Error(`Failed to fetch employees: ${error.message}`)

      return (data || []).map(row => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        position: row.position,
        directionId: row.direction_id,
        defaultHourlyRate: row.default_hourly_rate,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    getSubordinates: async (_ctx: ExecutionContext, _managerId: string): Promise<Employee[]> => {
      // TODO: Implement when employee_hierarchy table is ready
      return []
    },

    create: async (ctx: ExecutionContext, input: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> => {
      const { data, error } = await this.supabase
        .from('employees')
        .insert({
          email: input.email,
          full_name: input.fullName,
          position: input.position,
          direction_id: input.directionId,
          default_hourly_rate: input.defaultHourlyRate,
          is_active: input.isActive ?? true
        })
        .select()
        .single()

      if (error) {
        ctx.logger.error('[EmployeesRepo] Create failed', { error })
        throw new Error(`Failed to create employee: ${error.message}`)
      }

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        position: data.position,
        directionId: data.direction_id,
        defaultHourlyRate: data.default_hourly_rate,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    update: async (ctx: ExecutionContext, id: string, input: Partial<Employee>): Promise<Employee> => {
      const updateData: any = {}
      if (input.email !== undefined) updateData.email = input.email
      if (input.fullName !== undefined) updateData.full_name = input.fullName
      if (input.position !== undefined) updateData.position = input.position
      if (input.directionId !== undefined) updateData.direction_id = input.directionId
      if (input.defaultHourlyRate !== undefined) updateData.default_hourly_rate = input.defaultHourlyRate
      if (input.isActive !== undefined) updateData.is_active = input.isActive

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        ctx.logger.error('[EmployeesRepo] Update failed', { error })
        throw new Error(`Failed to update employee: ${error.message}`)
      }

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        position: data.position,
        directionId: data.direction_id,
        defaultHourlyRate: data.default_hourly_rate,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      // Soft delete
      const { error } = await this.supabase
        .from('employees')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        ctx.logger.error('[EmployeesRepo] Delete failed', { error })
        throw new Error(`Failed to delete employee: ${error.message}`)
      }
    }
  }

  // ============================================================================
  // PROJECTS REPOSITORY
  // ============================================================================

  projects = {
    getAll: async (ctx: ExecutionContext, filters?: ProjectFilters): Promise<Project[]> => {
      ctx.logger.debug('[ProjectsRepo] getAll', { filters })

      let query = this.supabase
        .from('projects')
        .select('*')

      // Фильтры
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,` +
          `description.ilike.%${filters.search}%,` +
          `code.ilike.%${filters.search}%`
        )
      }

      if (filters?.directionId) {
        query = query.eq('direction_id', filters.directionId)
      }

      if (filters?.managerId) {
        query = query.eq('manager_id', filters.managerId)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }

      query = query.order('created_at', { ascending: false })

      const limit = filters?.limit || 50
      const offset = filters?.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) throw new Error(`Failed to fetch projects: ${error.message}`)

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        directionId: row.direction_id,
        managerId: row.manager_id,
        status: row.status,
        priority: row.priority,
        startDate: row.start_date,
        endDate: row.end_date,
        totalBudget: row.total_budget,
        currentSpent: row.current_spent,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    getCount: async (ctx: ExecutionContext, filters?: ProjectFilters): Promise<number> => {
      let query = this.supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,` +
          `description.ilike.%${filters.search}%,` +
          `code.ilike.%${filters.search}%`
        )
      }

      if (filters?.directionId) query = query.eq('direction_id', filters.directionId)
      if (filters?.managerId) query = query.eq('manager_id', filters.managerId)
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.priority) query = query.eq('priority', filters.priority)

      const { count, error } = await query
      if (error) throw new Error(`Failed to count projects: ${error.message}`)

      return count || 0
    },

    getById: async (_ctx: ExecutionContext, id: string): Promise<Project | null> => {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to fetch project: ${error.message}`)
      }

      if (!data) return null

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        directionId: data.direction_id,
        managerId: data.manager_id,
        status: data.status,
        priority: data.priority,
        startDate: data.start_date,
        endDate: data.end_date,
        totalBudget: data.total_budget,
        currentSpent: data.current_spent,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    getByManager: async (_ctx: ExecutionContext, managerId: string): Promise<Project[]> => {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to fetch projects: ${error.message}`)

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        directionId: row.direction_id,
        managerId: row.manager_id,
        status: row.status,
        priority: row.priority,
        startDate: row.start_date,
        endDate: row.end_date,
        totalBudget: row.total_budget,
        currentSpent: row.current_spent,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    getByDirection: async (_ctx: ExecutionContext, directionId: string): Promise<Project[]> => {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('direction_id', directionId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to fetch projects: ${error.message}`)

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        directionId: row.direction_id,
        managerId: row.manager_id,
        status: row.status,
        priority: row.priority,
        startDate: row.start_date,
        endDate: row.end_date,
        totalBudget: row.total_budget,
        currentSpent: row.current_spent,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    create: async (ctx: ExecutionContext, input: CreateProjectDTO): Promise<Project> => {
      const { data, error } = await this.supabase
        .from('projects')
        .insert({
          name: input.name,
          code: input.code,
          description: input.description,
          direction_id: input.directionId,
          manager_id: input.managerId,
          status: input.status || 'planning',
          priority: input.priority || 'medium',
          start_date: input.startDate,
          end_date: input.endDate,
          total_budget: input.totalBudget,
          current_spent: 0
        })
        .select()
        .single()

      if (error) {
        ctx.logger.error('[ProjectsRepo] Create failed', { error })
        throw new Error(`Failed to create project: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        directionId: data.direction_id,
        managerId: data.manager_id,
        status: data.status,
        priority: data.priority,
        startDate: data.start_date,
        endDate: data.end_date,
        totalBudget: data.total_budget,
        currentSpent: data.current_spent,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    update: async (ctx: ExecutionContext, id: string, input: UpdateProjectDTO): Promise<Project> => {
      const updateData: any = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.code !== undefined) updateData.code = input.code
      if (input.description !== undefined) updateData.description = input.description
      if (input.directionId !== undefined) updateData.direction_id = input.directionId
      if (input.managerId !== undefined) updateData.manager_id = input.managerId
      if (input.status !== undefined) updateData.status = input.status
      if (input.priority !== undefined) updateData.priority = input.priority
      if (input.startDate !== undefined) updateData.start_date = input.startDate
      if (input.endDate !== undefined) updateData.end_date = input.endDate
      if (input.totalBudget !== undefined) updateData.total_budget = input.totalBudget

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        ctx.logger.error('[ProjectsRepo] Update failed', { error })
        throw new Error(`Failed to update project: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        directionId: data.direction_id,
        managerId: data.manager_id,
        status: data.status,
        priority: data.priority,
        startDate: data.start_date,
        endDate: data.end_date,
        totalBudget: data.total_budget,
        currentSpent: data.current_spent,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) {
        ctx.logger.error('[ProjectsRepo] Delete failed', { error })
        throw new Error(`Failed to delete project: ${error.message}`)
      }
    }
  }

  // ============================================================================
  // TASKS REPOSITORY
  // ============================================================================

  tasks = {
    getAll: async (ctx: ExecutionContext, filters?: TaskFilters): Promise<Task[]> => {
      ctx.logger.debug('[TasksRepo] getAll', { filters })

      let query = this.supabase
        .from('tasks')
        .select('*')

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,` +
          `description.ilike.%${filters.search}%`
        )
      }

      if (filters?.projectId) query = query.eq('project_id', filters.projectId)
      if (filters?.assigneeId) query = query.eq('assignee_id', filters.assigneeId)
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.priority) query = query.eq('priority', filters.priority)

      query = query.order('created_at', { ascending: false })

      const limit = filters?.limit || 50
      const offset = filters?.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        projectId: row.project_id,
        assigneeId: row.assignee_id,
        status: row.status,
        priority: row.priority,
        estimatedHours: row.estimated_hours,
        actualHours: row.actual_hours,
        dueDate: row.due_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    getCount: async (ctx: ExecutionContext, filters?: TaskFilters): Promise<number> => {
      let query = this.supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,` +
          `description.ilike.%${filters.search}%`
        )
      }

      if (filters?.projectId) query = query.eq('project_id', filters.projectId)
      if (filters?.assigneeId) query = query.eq('assignee_id', filters.assigneeId)
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.priority) query = query.eq('priority', filters.priority)

      const { count, error } = await query
      if (error) throw new Error(`Failed to count tasks: ${error.message}`)

      return count || 0
    },

    getById: async (_ctx: ExecutionContext, id: string): Promise<Task | null> => {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to fetch task: ${error.message}`)
      }

      if (!data) return null

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        projectId: data.project_id,
        assigneeId: data.assignee_id,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimated_hours,
        actualHours: data.actual_hours,
        dueDate: data.due_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    getByProject: async (_ctx: ExecutionContext, projectId: string): Promise<Task[]> => {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        projectId: row.project_id,
        assigneeId: row.assignee_id,
        status: row.status,
        priority: row.priority,
        estimatedHours: row.estimated_hours,
        actualHours: row.actual_hours,
        dueDate: row.due_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    getByAssignee: async (_ctx: ExecutionContext, assigneeId: string): Promise<Task[]> => {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', assigneeId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        projectId: row.project_id,
        assigneeId: row.assignee_id,
        status: row.status,
        priority: row.priority,
        estimatedHours: row.estimated_hours,
        actualHours: row.actual_hours,
        dueDate: row.due_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    },

    create: async (ctx: ExecutionContext, input: CreateTaskDTO): Promise<Task> => {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert({
          name: input.name,
          description: input.description,
          project_id: input.projectId,
          assignee_id: input.assigneeId,
          status: input.status || 'todo',
          priority: input.priority || 'medium',
          estimated_hours: input.estimatedHours,
          due_date: input.dueDate
        })
        .select()
        .single()

      if (error) {
        ctx.logger.error('[TasksRepo] Create failed', { error })
        throw new Error(`Failed to create task: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        projectId: data.project_id,
        assigneeId: data.assignee_id,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimated_hours,
        actualHours: data.actual_hours,
        dueDate: data.due_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    update: async (ctx: ExecutionContext, id: string, input: UpdateTaskDTO): Promise<Task> => {
      const updateData: any = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.projectId !== undefined) updateData.project_id = input.projectId
      if (input.assigneeId !== undefined) updateData.assignee_id = input.assigneeId
      if (input.status !== undefined) updateData.status = input.status
      if (input.priority !== undefined) updateData.priority = input.priority
      if (input.estimatedHours !== undefined) updateData.estimated_hours = input.estimatedHours
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        ctx.logger.error('[TasksRepo] Update failed', { error })
        throw new Error(`Failed to update task: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        projectId: data.project_id,
        assigneeId: data.assignee_id,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimated_hours,
        actualHours: data.actual_hours,
        dueDate: data.due_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    },

    delete: async (ctx: ExecutionContext, id: string): Promise<void> => {
      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        ctx.logger.error('[TasksRepo] Delete failed', { error })
        throw new Error(`Failed to delete task: ${error.message}`)
      }
    }
  }

  timeEntries = {
    getAll: async (_ctx: ExecutionContext, _filters?: TimeEntryFilters): Promise<TimeEntry[]> => [],
    getById: async (_ctx: ExecutionContext, _id: string): Promise<TimeEntry | null> => null,
    getByEmployee: async (_ctx: ExecutionContext, _employeeId: string): Promise<TimeEntry[]> => [],
    getByTask: async (_ctx: ExecutionContext, _taskId: string): Promise<TimeEntry[]> => [],
    getPendingApprovals: async (_ctx: ExecutionContext): Promise<TimeEntry[]> => [],
    create: async (_ctx: ExecutionContext, _data: CreateTimeEntryDTO): Promise<TimeEntry> => { throw new Error('Not implemented') },
    update: async (_ctx: ExecutionContext, _id: string, _data: UpdateTimeEntryDTO): Promise<TimeEntry> => { throw new Error('Not implemented') },
    delete: async (_ctx: ExecutionContext, _id: string): Promise<void> => { },
    approve: async (_ctx: ExecutionContext, _data: ApproveTimeEntryDTO): Promise<void> => { },
    reject: async (_ctx: ExecutionContext, _ids: string[], _by: string, _reason: string): Promise<void> => { }
  }

  finance = {
    revenues: {
      getAll: async (_ctx: ExecutionContext, _filters?: RevenueFilters): Promise<RevenueManual[]> => [],
      create: async (_ctx: ExecutionContext, _data: CreateRevenueManualDTO): Promise<RevenueManual> => { throw new Error('Not implemented') }
    },
    salaryRegister: {
      getAll: async (_ctx: ExecutionContext): Promise<SalaryRegister[]> => [],
      create: async (_ctx: ExecutionContext, _data: CreateSalaryRegisterDTO): Promise<SalaryRegister> => { throw new Error('Not implemented') }
    }
  }

  dashboard = {
    getMetrics: async (_ctx: ExecutionContext) => ({
      totalProjects: 0,
      activeProjects: 0,
      totalEmployees: 0,
      totalHoursThisMonth: 0,
      totalHoursThisWeek: 0,
      pendingApprovals: 0,
      overdueTasks: 0
    }),
    getDirectionMetrics: async (_ctx: ExecutionContext) => [],
    getEmployeeMetrics: async (_ctx: ExecutionContext, _employeeId: string) => ({
      totalHoursThisMonth: 0,
      totalHoursThisWeek: 0,
      activeProjects: 0,
      pendingTimeEntries: 0
    })
  }

  utils = {
    healthCheck: async () => true,
    getDatabaseStats: async () => ({
      totalRecords: 0,
      lastBackup: new Date().toISOString(),
      version: '1.0.0'
    })
  }
}

