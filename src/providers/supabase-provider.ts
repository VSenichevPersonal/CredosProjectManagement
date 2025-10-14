/**
 * SupabaseDatabaseProvider
 * 
 * Implementation of DatabaseProvider interface using Supabase.
 * Handles all database operations for Credos Project Management.
 */

import { createServerClient } from '@/lib/supabase'
import type { DatabaseProvider } from './database-provider.interface'
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

export class SupabaseDatabaseProvider implements DatabaseProvider {
  private supabase = createServerClient()
  
  employees = {
    async getAll(ctx: ExecutionContext): Promise<Employee[]> {
      const { data, error } = await this.supabase
        .from('employees')
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .eq('is_active', true)
        .order('full_name')
      
      if (error) throw new Error(`Failed to fetch employees: ${error.message}`)
      return data.map(mapEmployeeFromDb)
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<Employee | null> {
      const { data, error } = await this.supabase
        .from('employees')
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) return null
      return mapEmployeeFromDb(data)
    },
    
    async getByDirection(ctx: ExecutionContext, directionId: string): Promise<Employee[]> {
      const { data, error } = await this.supabase
        .from('employees')
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .eq('direction_id', directionId)
        .eq('is_active', true)
        .order('full_name')
      
      if (error) throw new Error(`Failed to fetch employees by direction: ${error.message}`)
      return data.map(mapEmployeeFromDb)
    },
    
    async getSubordinates(ctx: ExecutionContext, managerId: string): Promise<Employee[]> {
      const { data, error } = await this.supabase
        .from('employees')
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .eq('manager_id', managerId)
        .eq('is_active', true)
        .order('full_name')
      
      if (error) throw new Error(`Failed to fetch subordinates: ${error.message}`)
      return data.map(mapEmployeeFromDb)
    },
    
    async create(ctx: ExecutionContext, data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
      const { data: result, error } = await this.supabase
        .from('employees')
        .insert({
          email: data.email,
          full_name: data.fullName,
          position: data.position,
          direction_id: data.directionId,
          manager_id: data.managerId,
          hourly_rate: data.hourlyRate,
          is_active: data.isActive
        })
        .select()
        .single()
      
      if (error) throw new Error(`Failed to create employee: ${error.message}`)
      return mapEmployeeFromDb(result)
    },
    
    async update(ctx: ExecutionContext, id: string, data: Partial<Employee>): Promise<Employee> {
      const updateData: any = {}
      if (data.email !== undefined) updateData.email = data.email
      if (data.fullName !== undefined) updateData.full_name = data.fullName
      if (data.position !== undefined) updateData.position = data.position
      if (data.directionId !== undefined) updateData.direction_id = data.directionId
      if (data.managerId !== undefined) updateData.manager_id = data.managerId
      if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate
      if (data.isActive !== undefined) updateData.is_active = data.isActive
      
      const { data: result, error } = await this.supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(`Failed to update employee: ${error.message}`)
      return mapEmployeeFromDb(result)
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      const { error } = await this.supabase
        .from('employees')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete employee: ${error.message}`)
    }
  }
  
  directions = {
    async getAll(ctx: ExecutionContext): Promise<Direction[]> {
      const { data, error } = await this.supabase
        .from('directions')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw new Error(`Failed to fetch directions: ${error.message}`)
      return data.map(mapDirectionFromDb)
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<Direction | null> {
      const { data, error } = await this.supabase
        .from('directions')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) return null
      return mapDirectionFromDb(data)
    },
    
    async create(ctx: ExecutionContext, data: Omit<Direction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Direction> {
      const { data: result, error } = await this.supabase
        .from('directions')
        .insert({
          name: data.name,
          description: data.description,
          color: data.color,
          is_active: data.isActive
        })
        .select()
        .single()
      
      if (error) throw new Error(`Failed to create direction: ${error.message}`)
      return mapDirectionFromDb(result)
    },
    
    async update(ctx: ExecutionContext, id: string, data: Partial<Direction>): Promise<Direction> {
      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.color !== undefined) updateData.color = data.color
      if (data.isActive !== undefined) updateData.is_active = data.isActive
      
      const { data: result, error } = await this.supabase
        .from('directions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(`Failed to update direction: ${error.message}`)
      return mapDirectionFromDb(result)
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      const { error } = await this.supabase
        .from('directions')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete direction: ${error.message}`)
    }
  }
  
  projects = {
    async getAll(ctx: ExecutionContext, filters?: ProjectFilters): Promise<Project[]> {
      let query = this.supabase
        .from('projects')
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
      
      if (filters) {
        if (filters.directionId) query = query.eq('direction_id', filters.directionId)
        if (filters.managerId) query = query.eq('manager_id', filters.managerId)
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.priority) query = query.eq('priority', filters.priority)
        if (filters.dateFrom) query = query.gte('start_date', filters.dateFrom)
        if (filters.dateTo) query = query.lte('end_date', filters.dateTo)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch projects: ${error.message}`)
      return data.map(mapProjectFromDb)
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<Project | null> {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) return null
      return mapProjectFromDb(data)
    },
    
    async getByManager(ctx: ExecutionContext, managerId: string): Promise<Project[]> {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch projects by manager: ${error.message}`)
      return data.map(mapProjectFromDb)
    },
    
    async getByDirection(ctx: ExecutionContext, directionId: string): Promise<Project[]> {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .eq('direction_id', directionId)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch projects by direction: ${error.message}`)
      return data.map(mapProjectFromDb)
    },
    
    async create(ctx: ExecutionContext, data: CreateProjectDTO): Promise<Project> {
      const { data: result, error } = await this.supabase
        .from('projects')
        .insert({
          name: data.name,
          description: data.description,
          direction_id: data.directionId,
          manager_id: data.managerId,
          priority: data.priority,
          start_date: data.startDate,
          end_date: data.endDate,
          budget: data.budget
        })
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .single()
      
      if (error) throw new Error(`Failed to create project: ${error.message}`)
      return mapProjectFromDb(result)
    },
    
    async update(ctx: ExecutionContext, id: string, data: UpdateProjectDTO): Promise<Project> {
      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.directionId !== undefined) updateData.direction_id = data.directionId
      if (data.managerId !== undefined) updateData.manager_id = data.managerId
      if (data.status !== undefined) updateData.status = data.status
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.startDate !== undefined) updateData.start_date = data.startDate
      if (data.endDate !== undefined) updateData.end_date = data.endDate
      if (data.budget !== undefined) updateData.budget = data.budget
      
      const { data: result, error } = await this.supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          direction:directions(*),
          manager:employees!manager_id(*)
        `)
        .single()
      
      if (error) throw new Error(`Failed to update project: ${error.message}`)
      return mapProjectFromDb(result)
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete project: ${error.message}`)
    }
  }
  
  tasks = {
    async getAll(ctx: ExecutionContext, filters?: TaskFilters): Promise<Task[]> {
      let query = this.supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*),
          assignee:employees!assignee_id(*)
        `)
      
      if (filters) {
        if (filters.projectId) query = query.eq('project_id', filters.projectId)
        if (filters.assigneeId) query = query.eq('assignee_id', filters.assigneeId)
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.priority) query = query.eq('priority', filters.priority)
        if (filters.dueDateFrom) query = query.gte('due_date', filters.dueDateFrom)
        if (filters.dueDateTo) query = query.lte('due_date', filters.dueDateTo)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)
      return data.map(mapTaskFromDb)
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<Task | null> {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*),
          assignee:employees!assignee_id(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) return null
      return mapTaskFromDb(data)
    },
    
    async getByProject(ctx: ExecutionContext, projectId: string): Promise<Task[]> {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*),
          assignee:employees!assignee_id(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch tasks by project: ${error.message}`)
      return data.map(mapTaskFromDb)
    },
    
    async getByAssignee(ctx: ExecutionContext, assigneeId: string): Promise<Task[]> {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*),
          assignee:employees!assignee_id(*)
        `)
        .eq('assignee_id', assigneeId)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch tasks by assignee: ${error.message}`)
      return data.map(mapTaskFromDb)
    },
    
    async create(ctx: ExecutionContext, data: CreateTaskDTO): Promise<Task> {
      const { data: result, error } = await this.supabase
        .from('tasks')
        .insert({
          project_id: data.projectId,
          name: data.name,
          description: data.description,
          assignee_id: data.assigneeId,
          priority: data.priority,
          estimated_hours: data.estimatedHours,
          due_date: data.dueDate
        })
        .select(`
          *,
          project:projects(*),
          assignee:employees!assignee_id(*)
        `)
        .single()
      
      if (error) throw new Error(`Failed to create task: ${error.message}`)
      return mapTaskFromDb(result)
    },
    
    async update(ctx: ExecutionContext, id: string, data: UpdateTaskDTO): Promise<Task> {
      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.assigneeId !== undefined) updateData.assignee_id = data.assigneeId
      if (data.status !== undefined) updateData.status = data.status
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours
      if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate
      
      const { data: result, error } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          project:projects(*),
          assignee:employees!assignee_id(*)
        `)
        .single()
      
      if (error) throw new Error(`Failed to update task: ${error.message}`)
      return mapTaskFromDb(result)
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete task: ${error.message}`)
    }
  }
  
  timeEntries = {
    async getAll(ctx: ExecutionContext, filters?: TimeEntryFilters): Promise<TimeEntry[]> {
      let query = this.supabase
        .from('time_entries')
        .select(`
          *,
          employee:employees(*),
          task:tasks(*)
        `)
      
      if (filters) {
        if (filters.employeeId) query = query.eq('employee_id', filters.employeeId)
        if (filters.taskId) query = query.eq('task_id', filters.taskId)
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
        if (filters.dateTo) query = query.lte('date', filters.dateTo)
      }
      
      const { data, error } = await query.order('date', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch time entries: ${error.message}`)
      return data.map(mapTimeEntryFromDb)
    },
    
    async getById(ctx: ExecutionContext, id: string): Promise<TimeEntry | null> {
      const { data, error } = await this.supabase
        .from('time_entries')
        .select(`
          *,
          employee:employees(*),
          task:tasks(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) return null
      return mapTimeEntryFromDb(data)
    },
    
    async getByEmployee(ctx: ExecutionContext, employeeId: string, dateFrom?: string, dateTo?: string): Promise<TimeEntry[]> {
      let query = this.supabase
        .from('time_entries')
        .select(`
          *,
          employee:employees(*),
          task:tasks(*)
        `)
        .eq('employee_id', employeeId)
      
      if (dateFrom) query = query.gte('date', dateFrom)
      if (dateTo) query = query.lte('date', dateTo)
      
      const { data, error } = await query.order('date', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch time entries by employee: ${error.message}`)
      return data.map(mapTimeEntryFromDb)
    },
    
    async getByTask(ctx: ExecutionContext, taskId: string): Promise<TimeEntry[]> {
      const { data, error } = await this.supabase
        .from('time_entries')
        .select(`
          *,
          employee:employees(*),
          task:tasks(*)
        `)
        .eq('task_id', taskId)
        .order('date', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch time entries by task: ${error.message}`)
      return data.map(mapTimeEntryFromDb)
    },
    
    async getPendingApprovals(ctx: ExecutionContext): Promise<TimeEntry[]> {
      const { data, error } = await this.supabase
        .from('time_entries')
        .select(`
          *,
          employee:employees(*),
          task:tasks(*)
        `)
        .eq('status', 'submitted')
        .order('date', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch pending approvals: ${error.message}`)
      return data.map(mapTimeEntryFromDb)
    },
    
    async create(ctx: ExecutionContext, data: CreateTimeEntryDTO): Promise<TimeEntry> {
      const { data: result, error } = await this.supabase
        .from('time_entries')
        .insert({
          employee_id: data.employeeId,
          task_id: data.taskId,
          date: data.date,
          hours: data.hours,
          description: data.description
        })
        .select(`
          *,
          employee:employees(*),
          task:tasks(*)
        `)
        .single()
      
      if (error) throw new Error(`Failed to create time entry: ${error.message}`)
      return mapTimeEntryFromDb(result)
    },
    
    async update(ctx: ExecutionContext, id: string, data: UpdateTimeEntryDTO): Promise<TimeEntry> {
      const updateData: any = {}
      if (data.date !== undefined) updateData.date = data.date
      if (data.hours !== undefined) updateData.hours = data.hours
      if (data.description !== undefined) updateData.description = data.description
      if (data.status !== undefined) updateData.status = data.status
      
      const { data: result, error } = await this.supabase
        .from('time_entries')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          employee:employees(*),
          task:tasks(*)
        `)
        .single()
      
      if (error) throw new Error(`Failed to update time entry: ${error.message}`)
      return mapTimeEntryFromDb(result)
    },
    
    async delete(ctx: ExecutionContext, id: string): Promise<void> {
      const { error } = await this.supabase
        .from('time_entries')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete time entry: ${error.message}`)
    },
    
    async approve(ctx: ExecutionContext, data: ApproveTimeEntryDTO): Promise<void> {
      const { error } = await this.supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: data.approvedBy,
          approved_at: new Date().toISOString()
        })
        .in('id', data.timeEntryIds)
      
      if (error) throw new Error(`Failed to approve time entries: ${error.message}`)
    },
    
    async reject(ctx: ExecutionContext, timeEntryIds: string[], rejectedBy: string, reason: string): Promise<void> {
      const { error } = await this.supabase
        .from('time_entries')
        .update({
          status: 'rejected',
          approved_by: rejectedBy,
          approved_at: new Date().toISOString()
        })
        .in('id', timeEntryIds)
      
      if (error) throw new Error(`Failed to reject time entries: ${error.message}`)
    }
  }
  
  dashboard = {
    async getMetrics(ctx: ExecutionContext) {
      // This would typically use more complex queries with aggregations
      // For now, returning placeholder data
      return {
        totalProjects: 0,
        activeProjects: 0,
        totalEmployees: 0,
        totalHoursThisMonth: 0,
        totalHoursThisWeek: 0,
        pendingApprovals: 0,
        overdueTasks: 0
      }
    },
    
    async getDirectionMetrics(ctx: ExecutionContext) {
      // Placeholder implementation
      return []
    },
    
    async getEmployeeMetrics(ctx: ExecutionContext, employeeId: string) {
      // Placeholder implementation
      return {
        totalHoursThisMonth: 0,
        totalHoursThisWeek: 0,
        activeProjects: 0,
        pendingTimeEntries: 0
      }
    }
  }
  
  utils = {
    async healthCheck(): Promise<boolean> {
      try {
        const { error } = await this.supabase.from('employees').select('id').limit(1)
        return !error
      } catch {
        return false
      }
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

// Helper functions to map database records to domain objects
function mapEmployeeFromDb(db: any): Employee {
  return {
    id: db.id,
    email: db.email,
    fullName: db.full_name,
    position: db.position,
    directionId: db.direction_id,
    direction: db.direction ? mapDirectionFromDb(db.direction) : undefined,
    managerId: db.manager_id,
    manager: db.manager ? mapEmployeeFromDb(db.manager) : undefined,
    hourlyRate: db.hourly_rate,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  }
}

function mapDirectionFromDb(db: any): Direction {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    color: db.color,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  }
}

function mapProjectFromDb(db: any): Project {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    directionId: db.direction_id,
    direction: db.direction ? mapDirectionFromDb(db.direction) : undefined,
    managerId: db.manager_id,
    manager: db.manager ? mapEmployeeFromDb(db.manager) : undefined,
    status: db.status,
    priority: db.priority,
    startDate: db.start_date,
    endDate: db.end_date,
    budget: db.budget,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  }
}

function mapTaskFromDb(db: any): Task {
  return {
    id: db.id,
    projectId: db.project_id,
    project: db.project ? mapProjectFromDb(db.project) : undefined,
    name: db.name,
    description: db.description,
    assigneeId: db.assignee_id,
    assignee: db.assignee ? mapEmployeeFromDb(db.assignee) : undefined,
    status: db.status,
    priority: db.priority,
    estimatedHours: db.estimated_hours,
    actualHours: db.actual_hours,
    dueDate: db.due_date,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  }
}

function mapTimeEntryFromDb(db: any): TimeEntry {
  return {
    id: db.id,
    employeeId: db.employee_id,
    employee: db.employee ? mapEmployeeFromDb(db.employee) : undefined,
    taskId: db.task_id,
    task: db.task ? mapTaskFromDb(db.task) : undefined,
    date: db.date,
    hours: db.hours,
    description: db.description,
    status: db.status,
    approvedBy: db.approved_by,
    approvedAt: db.approved_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  }
}
