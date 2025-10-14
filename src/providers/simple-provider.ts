/**
 * SimpleDatabaseProvider
 * 
 * Simplified implementation for initial development.
 * Will be replaced with full SupabaseDatabaseProvider later.
 */

import type { ExecutionContext } from '@/lib/context/execution-context'
import type { Employee, Direction, RevenueManual, CreateRevenueManualDTO } from '@/types/domain'

export class SimpleDatabaseProvider {
  employees = {
    async getAll(_ctx: ExecutionContext): Promise<Employee[]> { return [] },
    async getById(_ctx: ExecutionContext, _id: string): Promise<Employee | null> { return null },
    async getByDirection(_ctx: ExecutionContext, _directionId: string): Promise<Employee[]> { return [] },
    async getSubordinates(_ctx: ExecutionContext, _managerId: string): Promise<Employee[]> { return [] },
    async create(_ctx: ExecutionContext, _data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> { throw new Error('Not implemented') },
    async update(_ctx: ExecutionContext, _id: string, _data: Partial<Employee>): Promise<Employee> { throw new Error('Not implemented') },
    async delete(_ctx: ExecutionContext, _id: string): Promise<void> { }
  }

  directions = {
    async getAll(_ctx: ExecutionContext): Promise<Direction[]> { return [] },
    async getById(_ctx: ExecutionContext, _id: string): Promise<Direction | null> { return null },
    async create(_ctx: ExecutionContext, _data: Omit<Direction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Direction> { throw new Error('Not implemented') },
    async update(_ctx: ExecutionContext, _id: string, _data: Partial<Direction>): Promise<Direction> { throw new Error('Not implemented') },
    async delete(_ctx: ExecutionContext, _id: string): Promise<void> { }
  }

  projects = {
    async getAll(_ctx: ExecutionContext): Promise<any[]> { return [] },
    async getById(_ctx: ExecutionContext, _id: string): Promise<any | null> { return null },
    async getByManager(_ctx: ExecutionContext, _managerId: string): Promise<any[]> { return [] },
    async getByDirection(_ctx: ExecutionContext, _directionId: string): Promise<any[]> { return [] },
    async create(_ctx: ExecutionContext, _data: any): Promise<any> { throw new Error('Not implemented') },
    async update(_ctx: ExecutionContext, _id: string, _data: any): Promise<any> { throw new Error('Not implemented') },
    async delete(_ctx: ExecutionContext, _id: string): Promise<void> { }
  }

  tasks = {
    async getAll(_ctx: ExecutionContext): Promise<any[]> { return [] },
    async getById(_ctx: ExecutionContext, _id: string): Promise<any | null> { return null },
    async getByProject(_ctx: ExecutionContext, _projectId: string): Promise<any[]> { return [] },
    async getByAssignee(_ctx: ExecutionContext, _assigneeId: string): Promise<any[]> { return [] },
    async create(_ctx: ExecutionContext, _data: any): Promise<any> { throw new Error('Not implemented') },
    async update(_ctx: ExecutionContext, _id: string, _data: any): Promise<any> { throw new Error('Not implemented') },
    async delete(_ctx: ExecutionContext, _id: string): Promise<void> { }
  }

  timeEntries = {
    async getAll(_ctx: ExecutionContext): Promise<any[]> { return [] },
    async getById(_ctx: ExecutionContext, _id: string): Promise<any | null> { return null },
    async getByEmployee(_ctx: ExecutionContext): Promise<any[]> { return [] },
    async getByTask(_ctx: ExecutionContext): Promise<any[]> { return [] },
    async getPendingApprovals(_ctx: ExecutionContext): Promise<any[]> { return [] },
    async create(_ctx: ExecutionContext, _data: any): Promise<any> { throw new Error('Not implemented') },
    async update(_ctx: ExecutionContext, _id: string, _data: any): Promise<any> { throw new Error('Not implemented') },
    async delete(_ctx: ExecutionContext, _id: string): Promise<void> { },
    async approve(_ctx: ExecutionContext, _data: any): Promise<void> { },
    async reject(_ctx: ExecutionContext): Promise<void> { }
  }

  finance = {
    revenues: {
      async getAll(_ctx: ExecutionContext): Promise<RevenueManual[]> {
        return []
      },
      async create(_ctx: ExecutionContext, data: CreateRevenueManualDTO): Promise<RevenueManual> {
        const now = new Date().toISOString()
        return {
          id: crypto.randomUUID(),
          projectId: data.projectId,
          orderId: data.orderId,
          serviceId: data.serviceId,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          amount: data.amount,
          currency: data.currency ?? 'RUB',
          notes: data.notes,
          createdAt: now,
          updatedAt: now
        }
      }
    }
  }

  dashboard = {
    async getMetrics() { return { totalProjects: 0, activeProjects: 0, totalEmployees: 0, totalHoursThisMonth: 0, totalHoursThisWeek: 0, pendingApprovals: 0, overdueTasks: 0 } },
    async getDirectionMetrics() { return [] },
    async getEmployeeMetrics() { return { totalHoursThisMonth: 0, totalHoursThisWeek: 0, activeProjects: 0, pendingTimeEntries: 0 } },
  }

  utils = {
    async healthCheck() { return true },
    async getDatabaseStats() { return { totalRecords: 0, lastBackup: new Date().toISOString(), version: '0.0.1' } }
  }
}
