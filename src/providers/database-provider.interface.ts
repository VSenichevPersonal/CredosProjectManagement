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

export interface DatabaseProvider {
  // Employee operations
  employees: {
    getAll(ctx: ExecutionContext): Promise<Employee[]>
    getById(ctx: ExecutionContext, id: string): Promise<Employee | null>
    getByDirection(ctx: ExecutionContext, directionId: string): Promise<Employee[]>
    getSubordinates(ctx: ExecutionContext, managerId: string): Promise<Employee[]>
    create(ctx: ExecutionContext, data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee>
    update(ctx: ExecutionContext, id: string, data: Partial<Employee>): Promise<Employee>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
  
  // Direction operations
  directions: {
    getAll(ctx: ExecutionContext): Promise<Direction[]>
    getById(ctx: ExecutionContext, id: string): Promise<Direction | null>
    create(ctx: ExecutionContext, data: Omit<Direction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Direction>
    update(ctx: ExecutionContext, id: string, data: Partial<Direction>): Promise<Direction>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
  
  // Project operations
  projects: {
    getAll(ctx: ExecutionContext, filters?: ProjectFilters): Promise<Project[]>
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
