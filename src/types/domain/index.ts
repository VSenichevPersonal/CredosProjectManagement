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
  fullName: string // Для интеграции с 1С
  position: string
  directionId: string
  direction?: Direction
  defaultHourlyRate: number // Базовая ставка
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Иерархия сотрудников
export interface EmployeeHierarchy {
  id: string
  employeeId: string
  employee?: Employee
  managerId: string
  manager?: Employee
  level: number
  isDirect: boolean
  createdAt: string
  updatedAt: string
}

// Роли пользователей
export interface UserRole {
  id: string
  employeeId: string
  employee?: Employee
  role: UserRoleType
  grantedBy?: string
  grantedByEmployee?: Employee
  grantedAt: string
  isActive: boolean
}

// Direction domain (ИБ, ПИБ, ТЦ, Аудит, HR, Финансы)
export interface Direction {
  id: string
  name: string
  description?: string
  budget?: number // План бюджета
  budgetThreshold?: number // Лимит превышения (например, 110% от плана)
  color: string // Фиксированный набор цветов
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
  managerId: string // Руководитель проекта
  manager?: Employee
  status: ProjectStatus
  priority: Priority
  startDate?: string
  endDate?: string
  totalBudget?: number // Общий бюджет
  currentSpent: number // Текущие затраты
  createdAt: string
  updatedAt: string
}

// Фазы проекта (опционально)
export interface ProjectPhase {
  id: string
  projectId: string
  project?: Project
  name: string
  description?: string
  phaseOrder: number // Порядок фазы в проекте
  startDate?: string
  endDate?: string
  budget?: number // Бюджет фазы
  status: PhaseStatus
  createdAt: string
  updatedAt: string
}

// Команда проекта
export interface ProjectTeam {
  id: string
  projectId: string
  project?: Project
  employeeId: string
  employee?: Employee
  role: ProjectTeamRole
  allocatedHours?: number // Планируемые часы участия
  actualHours: number // Фактические часы
  joinedAt: string
  leftAt?: string
  isActive: boolean
}

// Ставки по проектам
export interface ProjectHourlyRate {
  id: string
  projectId: string
  project?: Project
  employeeId: string
  employee?: Employee
  hourlyRate: number // Ставка для этого проекта
  effectiveFrom: string
  effectiveTo?: string
  createdBy?: string
  createdByEmployee?: Employee
  createdAt: string
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

// Time Entry domain (трудозатраты) - ОБНОВЛЕНО
export interface TimeEntry {
  id: string
  employeeId: string
  employee?: Employee
  projectId: string
  project?: Project
  phaseId?: string // Опционально
  phase?: ProjectPhase
  date: string
  hours: number // До часов, точность 0.25
  description?: string
  status: TimeEntryStatus
  approvedBy?: string // Руководитель проекта
  approvedByEmployee?: Employee
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

// Групповые утверждения
export interface BatchApproval {
  id: string
  approverId: string
  approver?: Employee
  projectId?: string
  project?: Project
  approvalType: BatchApprovalType
  status: BatchApprovalStatus
  notes?: string
  approvedAt?: string
  rejectedAt?: string
  createdAt: string
}

// Элементы группового утверждения
export interface BatchApprovalItem {
  id: string
  batchId: string
  batch?: BatchApproval
  timeEntryId: string
  timeEntry?: TimeEntry
  status: BatchApprovalStatus
  notes?: string
}

// Enums
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

// Новые типы
export type UserRoleType = 'admin' | 'manager' | 'project_manager' | 'employee' | 'hr' | 'finance'
export type PhaseStatus = 'planned' | 'active' | 'completed' | 'cancelled'
export type ProjectTeamRole = 'member' | 'lead' | 'consultant'
export type BatchApprovalType = 'time_entries' | 'expenses' | 'other'
export type BatchApprovalStatus = 'pending' | 'approved' | 'rejected'

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
export interface CreateDirectionDTO {
  name: string
  description?: string
  budget?: number
  budgetThreshold?: number
  color?: string
  isActive?: boolean
}

export interface UpdateDirectionDTO {
  name?: string
  description?: string
  budget?: number
  budgetThreshold?: number
  color?: string
  isActive?: boolean
}

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
  projectId: string
  phaseId?: string // Опционально
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
  approved: boolean
  rejectionReason?: string
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
