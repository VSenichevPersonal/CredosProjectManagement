/**
 * SimpleDatabaseProvider
 * 
 * Simplified implementation for initial development.
 * Will be replaced with full SupabaseDatabaseProvider later.
 */

import type { ExecutionContext } from '@/lib/context/execution-context'
import type { Employee, Direction, RevenueManual, CreateRevenueManualDTO, SalaryRegister, CreateSalaryRegisterDTO } from '@/types/domain'

export class SimpleDatabaseProvider {
  async _rawQuery<T = any>(_ctx: any, _sql: string, _params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    return { rows: [], rowCount: 0 }
  }

  employees = {
    async getAll(_ctx: ExecutionContext, _filters?: any): Promise<Employee[]> { return [] },
    async getCount(_ctx: ExecutionContext, _filters?: any): Promise<number> { return 0 },
    async getById(_ctx: ExecutionContext, _id: string): Promise<Employee | null> { return null },
    async getByDirection(_ctx: ExecutionContext, _directionId: string): Promise<Employee[]> { return [] },
    async getSubordinates(_ctx: ExecutionContext, _managerId: string): Promise<Employee[]> { return [] },
    async create(_ctx: ExecutionContext, _data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> { throw new Error('Not implemented') },
    async update(_ctx: ExecutionContext, _id: string, _data: Partial<Employee>): Promise<Employee> { throw new Error('Not implemented') },
    async delete(_ctx: ExecutionContext, _id: string): Promise<void> { }
  }

  directions = {
    async getAll(_ctx: ExecutionContext, _filters?: any): Promise<Direction[]> { return [] },
    async getCount(_ctx: ExecutionContext, _filters?: any): Promise<number> { return 0 },
    async getById(_ctx: ExecutionContext, _id: string): Promise<Direction | null> { return null },
    async create(_ctx: ExecutionContext, _data: Omit<Direction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Direction> { throw new Error('Not implemented') },
    async update(_ctx: ExecutionContext, _id: string, _data: Partial<Direction>): Promise<Direction> { throw new Error('Not implemented') },
    async delete(_ctx: ExecutionContext, _id: string): Promise<void> { }
  }

  projects = {
    async getAll(_ctx: ExecutionContext, _filters?: any): Promise<any[]> { return [] },
    async getCount(_ctx: ExecutionContext, _filters?: any): Promise<number> { return 0 },
    async getById(_ctx: ExecutionContext, _id: string): Promise<any | null> { return null },
    async getByManager(_ctx: ExecutionContext, _managerId: string): Promise<any[]> { return [] },
    async getByDirection(_ctx: ExecutionContext, _directionId: string): Promise<any[]> { return [] },
    async create(_ctx: ExecutionContext, _data: any): Promise<any> { throw new Error('Not implemented') },
    async update(_ctx: ExecutionContext, _id: string, _data: any): Promise<any> { throw new Error('Not implemented') },
    async delete(_ctx: ExecutionContext, _id: string): Promise<void> { }
  }

  tasks = {
    async getAll(_ctx: ExecutionContext, _filters?: any): Promise<any[]> { return [] },
    async getCount(_ctx: ExecutionContext, _filters?: any): Promise<number> { return 0 },
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
    },
    salaryRegister: {
      async getAll(_ctx: ExecutionContext): Promise<SalaryRegister[]> {
        return []
      },
      async create(_ctx: ExecutionContext, data: CreateSalaryRegisterDTO): Promise<SalaryRegister> {
        const now = new Date().toISOString()
        return {
          id: crypto.randomUUID(),
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          employeeId: data.employeeId,
          directionId: data.directionId,
          amount: data.amount,
          source: data.source ?? 'manual',
          description: data.description,
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
