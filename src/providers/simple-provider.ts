/**
 * SimpleDatabaseProvider
 * 
 * Simplified implementation for initial development.
 * Will be replaced with full SupabaseDatabaseProvider later.
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

export class SimpleDatabaseProvider {
  employees = {
    async getAll(ctx: ExecutionContext): Promise<Employee[]> {
      // Mock data for now
      return []
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<Employee | null> {
      return null
    },
    
    async getByDirection(ctx: ExecutionContext, directionId: string): Promise<Employee[]> {
      return []
    },
    
    async getSubordinates(ctx: ExecutionContext, managerId: string): Promise<Employee[]> {
      return []
    },
    
    async create(ctx: ExecutionContext, data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
      throw new Error('Not implemented')
    },
    
    async update(ctx: ExecutionContext, id: string, data: Partial<Employee>): Promise<Employee> {
      throw new Error('Not implemented')
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      throw new Error('Not implemented')
    }
  }
  
  directions = {
    async getAll(ctx: ExecutionContext): Promise<Direction[]> {
      // Mock data for now
      return [
        {
          id: '1',
          name: 'Информационная безопасность',
          description: 'Направление ИБ',
          budget: 1000000,
          budgetThreshold: 1100000,
          color: 'blue',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Промышленная ИБ',
          description: 'Направление ПИБ',
          budget: 800000,
          budgetThreshold: 880000,
          color: 'cyan',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<Direction | null> {
      // Mock implementation
      if (id === '1') {
        return {
          id: '1',
          name: 'Информационная безопасность',
          description: 'Направление ИБ',
          budget: 1000000,
          budgetThreshold: 1100000,
          color: 'blue',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      return null
    },
    
    async create(ctx: ExecutionContext, data: Omit<Direction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Direction> {
      throw new Error('Not implemented')
    },
    
    async update(ctx: ExecutionContext, id: string, data: Partial<Direction>): Promise<Direction> {
      throw new Error('Not implemented')
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      throw new Error('Not implemented')
    }
  }
  
  projects = {
    async getAll(ctx: ExecutionContext, filters?: ProjectFilters): Promise<Project[]> {
      return []
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<Project | null> {
      return null
    },
    
    async getByManager(ctx: ExecutionContext, managerId: string): Promise<Project[]> {
      return []
    },
    
    async getByDirection(ctx: ExecutionContext, directionId: string): Promise<Project[]> {
      return []
    },
    
    async create(ctx: ExecutionContext, data: CreateProjectDTO): Promise<Project> {
      throw new Error('Not implemented')
    },
    
    async update(ctx: ExecutionContext, id: string, data: UpdateProjectDTO): Promise<Project> {
      throw new Error('Not implemented')
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      throw new Error('Not implemented')
    }
  }
  
  tasks = {
    async getAll(ctx: ExecutionContext, filters?: TaskFilters): Promise<Task[]> {
      return []
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<Task | null> {
      return null
    },
    
    async getByProject(ctx: ExecutionContext, projectId: string): Promise<Task[]> {
      return []
    },
    
    async getByAssignee(ctx: ExecutionContext, assigneeId: string): Promise<Task[]> {
      return []
    },
    
    async create(ctx: ExecutionContext, data: CreateTaskDTO): Promise<Task> {
      throw new Error('Not implemented')
    },
    
    async update(ctx: ExecutionContext, id: string, data: UpdateTaskDTO): Promise<Task> {
      throw new Error('Not implemented')
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      throw new Error('Not implemented')
    }
  }
  
  timeEntries = {
    async getAll(ctx: ExecutionContext, filters?: TimeEntryFilters): Promise<TimeEntry[]> {
      return []
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<TimeEntry | null> {
      return null
    },
    
    async getByEmployee(ctx: ExecutionContext, employeeId: string, dateFrom?: string, dateTo?: string): Promise<TimeEntry[]> {
      return []
    },
    
    async getByTask(ctx: ExecutionContext, taskId: string): Promise<TimeEntry[]> {
      return []
    },
    
    async getPendingApprovals(ctx: ExecutionContext): Promise<TimeEntry[]> {
      return []
    },
    
    async create(ctx: ExecutionContext, data: CreateTimeEntryDTO): Promise<TimeEntry> {
      throw new Error('Not implemented')
    },
    
    async update(ctx: ExecutionContext, id: string, data: UpdateTimeEntryDTO): Promise<TimeEntry> {
      throw new Error('Not implemented')
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      throw new Error('Not implemented')
    },
    
    async approve(ctx: ExecutionContext, data: ApproveTimeEntryDTO): Promise<void> {
      throw new Error('Not implemented')
    },
    
    async reject(ctx: ExecutionContext, timeEntryIds: string[], rejectedBy: string, reason: string): Promise<void> {
      throw new Error('Not implemented')
    }
  }
  
  dashboard = {
    async getMetrics(ctx: ExecutionContext) {
      return {
        totalProjects: 12,
        activeProjects: 8,
        totalEmployees: 24,
        totalHoursThisMonth: 1247,
        totalHoursThisWeek: 312,
        pendingApprovals: 5,
        overdueTasks: 3
      }
    },
    
    async getDirectionMetrics(ctx: ExecutionContext) {
      return []
    },
    
    async getEmployeeMetrics(ctx: ExecutionContext, employeeId: string) {
      return {
        totalHoursThisMonth: 160,
        totalHoursThisWeek: 40,
        activeProjects: 2,
        pendingTimeEntries: 1
      }
    }
  }
  
  utils = {
    async healthCheck(): Promise<boolean> {
      return true
    },
    
    async getDatabaseStats() {
      return {
        totalRecords: 0,
        lastBackup: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }
}
