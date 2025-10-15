/**
 * DatabaseProvider Interface
 * 
 * Defines the contract for database operations in Credos Project Management.
 * This interface allows for easy swapping of database implementations.
 */

import type { ExecutionContext } from '@/lib/context/execution-context'
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
  ApproveTimeEntryDTO
} from '@/types/domain'
import type { RevenueManual, CreateRevenueManualDTO, RevenueFilters, SalaryRegister, CreateSalaryRegisterDTO } from '@/types/domain'

// Фильтры для направлений
export interface DirectionFilters {
  search?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

// Фильтры для сотрудников
export interface EmployeeFilters {
  search?: string
  directionId?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
}

export interface DatabaseProvider {
  /**
   * @internal
   * Raw SQL query execution for complex analytics and reports only.
   * Use repository methods for standard CRUD operations.
   */
  _rawQuery<T = any>(ctx: ExecutionContext, sql: string, params?: any[]): Promise<QueryResult<T>>

  // Employee operations
  employees: {
    getAll(ctx: ExecutionContext, filters?: EmployeeFilters): Promise<Employee[]>
    getCount(ctx: ExecutionContext, filters?: EmployeeFilters): Promise<number>
    getById(ctx: ExecutionContext, id: string): Promise<Employee | null>
    getByDirection(ctx: ExecutionContext, directionId: string): Promise<Employee[]>
    getSubordinates(ctx: ExecutionContext, managerId: string): Promise<Employee[]>
    create(ctx: ExecutionContext, data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee>
    update(ctx: ExecutionContext, id: string, data: Partial<Employee>): Promise<Employee>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
  
  // Finance operations
  finance: {
    revenues: {
      getAll(ctx: ExecutionContext, filters?: RevenueFilters): Promise<RevenueManual[]>
      create(ctx: ExecutionContext, data: CreateRevenueManualDTO): Promise<RevenueManual>
    }
    salaryRegister: {
      getAll(ctx: ExecutionContext): Promise<SalaryRegister[]>
      create(ctx: ExecutionContext, data: CreateSalaryRegisterDTO): Promise<SalaryRegister>
    }
  }

  // Direction operations
  directions: {
    getAll(ctx: ExecutionContext, filters?: DirectionFilters): Promise<Direction[]>
    getCount(ctx: ExecutionContext, filters?: DirectionFilters): Promise<number>
    getById(ctx: ExecutionContext, id: string): Promise<Direction | null>
    create(ctx: ExecutionContext, data: Omit<Direction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Direction>
    update(ctx: ExecutionContext, id: string, data: Partial<Direction>): Promise<Direction>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
  
  // Project operations
  projects: {
    getAll(ctx: ExecutionContext, filters?: ProjectFilters): Promise<Project[]>
    getCount(ctx: ExecutionContext, filters?: ProjectFilters): Promise<number>
    getById(ctx: ExecutionContext, id: string): Promise<Project | null>
    getByManager(ctx: ExecutionContext, managerId: string): Promise<Project[]>
    getByDirection(ctx: ExecutionContext, directionId: string): Promise<Project[]>
    create(ctx: ExecutionContext, data: CreateProjectDTO): Promise<Project>
    update(ctx: ExecutionContext, id: string, data: UpdateProjectDTO): Promise<Project>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
  
  // Task operations
  tasks: {
    getAll(ctx: ExecutionContext, filters?: TaskFilters): Promise<Task[]>
    getCount(ctx: ExecutionContext, filters?: TaskFilters): Promise<number>
    getById(ctx: ExecutionContext, id: string): Promise<Task | null>
    getByProject(ctx: ExecutionContext, projectId: string): Promise<Task[]>
    getByAssignee(ctx: ExecutionContext, assigneeId: string): Promise<Task[]>
    create(ctx: ExecutionContext, data: CreateTaskDTO): Promise<Task>
    update(ctx: ExecutionContext, id: string, data: UpdateTaskDTO): Promise<Task>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
  
  // Time Entry operations
  timeEntries: {
    getAll(ctx: ExecutionContext, filters?: TimeEntryFilters): Promise<TimeEntry[]>
    getById(ctx: ExecutionContext, id: string): Promise<TimeEntry | null>
    getByEmployee(ctx: ExecutionContext, employeeId: string, dateFrom?: string, dateTo?: string): Promise<TimeEntry[]>
    getByTask(ctx: ExecutionContext, taskId: string): Promise<TimeEntry[]>
    getPendingApprovals(ctx: ExecutionContext): Promise<TimeEntry[]>
    create(ctx: ExecutionContext, data: CreateTimeEntryDTO): Promise<TimeEntry>
    update(ctx: ExecutionContext, id: string, data: UpdateTimeEntryDTO): Promise<TimeEntry>
    delete(ctx: ExecutionContext, id: string): Promise<void>
    approve(ctx: ExecutionContext, data: ApproveTimeEntryDTO): Promise<void>
    reject(ctx: ExecutionContext, timeEntryIds: string[], rejectedBy: string, reason: string): Promise<void>
  }
  
  // Dashboard and analytics
  dashboard: {
    getMetrics(ctx: ExecutionContext): Promise<{
      totalProjects: number
      activeProjects: number
      totalEmployees: number
      totalHoursThisMonth: number
      totalHoursThisWeek: number
      pendingApprovals: number
      overdueTasks: number
    }>
    getDirectionMetrics(ctx: ExecutionContext): Promise<any[]>
    getEmployeeMetrics(ctx: ExecutionContext, employeeId: string): Promise<{
      totalHoursThisMonth: number
      totalHoursThisWeek: number
      activeProjects: number
      pendingTimeEntries: number
    }>
  }
  
  // Utility operations
  utils: {
    healthCheck(): Promise<boolean>
    getDatabaseStats(): Promise<{
      totalRecords: number
      lastBackup: string
      version: string
    }>
  }
}
