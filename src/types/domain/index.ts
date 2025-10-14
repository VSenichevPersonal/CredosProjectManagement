/**
 * Domain Types for Credos Project Management
 * 
 * Core business entities and their relationships.
 * These types represent the business domain and are used across the application.
 */

// Employee domain
export interface Employee {
  id: string
  email: string
  fullName: string
  position: string
  directionId: string
  direction?: Direction
  managerId?: string
  manager?: Employee
  hourlyRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Direction domain (ИБ, ПИБ, ТЦ, Аудит, HR, Финансы)
export interface Direction {
  id: string
  name: string
  description?: string
  managerId: string
  manager?: Employee
  budget?: number
  color: string // Business color from tailwind config
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Project domain
export interface Project {
  id: string
  name: string
  description?: string
  directionId: string
  direction?: Direction
  managerId: string
  manager?: Employee
  status: ProjectStatus
  priority: Priority
  startDate?: string
  endDate?: string
  budget?: number
  createdAt: string
  updatedAt: string
}

// Task domain
export interface Task {
  id: string
  projectId: string
  project?: Project
  name: string
  description?: string
  assigneeId: string
  assignee?: Employee
  status: TaskStatus
  priority: Priority
  estimatedHours?: number
  actualHours?: number
  dueDate?: string
  createdAt: string
  updatedAt: string
}

// Time Entry domain (трудозатраты)
export interface TimeEntry {
  id: string
  employeeId: string
  employee?: Employee
  taskId: string
  task?: Task
  date: string
  hours: number
  description?: string
  status: TimeEntryStatus
  approvedBy?: string
  approvedByEmployee?: Employee
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

// Enums
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

// Extended types with computed fields
export interface ProjectWithMetrics extends Project {
  totalTasks: number
  completedTasks: number
  totalHours: number
  progressPercentage: number
}

export interface EmployeeWithMetrics extends Employee {
  totalHoursThisMonth: number
  totalHoursThisWeek: number
  activeProjects: number
  pendingTimeEntries: number
}

export interface DirectionWithMetrics extends Direction {
  totalProjects: number
  activeProjects: number
  totalEmployees: number
  totalHoursThisMonth: number
}

// DTOs for API operations
export interface CreateProjectDTO {
  name: string
  description?: string
  directionId: string
  managerId: string
  priority: Priority
  startDate?: string
  endDate?: string
  budget?: number
}

export interface UpdateProjectDTO {
  name?: string
  description?: string
  directionId?: string
  managerId?: string
  status?: ProjectStatus
  priority?: Priority
  startDate?: string
  endDate?: string
  budget?: number
}

export interface CreateTaskDTO {
  projectId: string
  name: string
  description?: string
  assigneeId: string
  priority: Priority
  estimatedHours?: number
  dueDate?: string
}

export interface UpdateTaskDTO {
  name?: string
  description?: string
  assigneeId?: string
  status?: TaskStatus
  priority?: Priority
  estimatedHours?: number
  actualHours?: number
  dueDate?: string
}

export interface CreateTimeEntryDTO {
  employeeId: string
  taskId: string
  date: string
  hours: number
  description?: string
}

export interface UpdateTimeEntryDTO {
  date?: string
  hours?: number
  description?: string
  status?: TimeEntryStatus
}

export interface ApproveTimeEntryDTO {
  timeEntryIds: string[]
  approvedBy: string
  notes?: string
}

// Filters for queries
export interface ProjectFilters {
  directionId?: string
  managerId?: string
  status?: ProjectStatus
  priority?: Priority
  dateFrom?: string
  dateTo?: string
}

export interface TaskFilters {
  projectId?: string
  assigneeId?: string
  status?: TaskStatus
  priority?: Priority
  dueDateFrom?: string
  dueDateTo?: string
}

export interface TimeEntryFilters {
  employeeId?: string
  taskId?: string
  projectId?: string
  status?: TimeEntryStatus
  dateFrom?: string
  dateTo?: string
}

// Dashboard metrics
export interface DashboardMetrics {
  totalProjects: number
  activeProjects: number
  totalEmployees: number
  totalHoursThisMonth: number
  totalHoursThisWeek: number
  pendingApprovals: number
  overdueTasks: number
  directionMetrics: DirectionWithMetrics[]
}
