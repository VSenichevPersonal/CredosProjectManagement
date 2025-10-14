import type { ExecutionContext } from '@/lib/context/execution-context'
import type { RevenueManual, CreateRevenueManualDTO, RevenueFilters, SalaryRegister, CreateSalaryRegisterDTO } from '@/types/domain'

export class FinanceService {
  static async getRevenues(ctx: ExecutionContext, filters?: RevenueFilters): Promise<RevenueManual[]> {
    await ctx.access.require('projects:read')
    return await ctx.db.finance.revenues.getAll(ctx, filters)
  }

  static async createRevenue(ctx: ExecutionContext, dto: CreateRevenueManualDTO): Promise<RevenueManual> {
    await ctx.access.require('projects:update')
    if (new Date(dto.periodStart) > new Date(dto.periodEnd)) {
      throw new Error('periodStart не может быть позже periodEnd')
    }
    if (dto.amount <= 0) {
      throw new Error('Сумма должна быть больше 0')
    }
    return await ctx.db.finance.revenues.create(ctx, dto)
  }

  static async getSalaryRegister(ctx: ExecutionContext): Promise<SalaryRegister[]> {
    await ctx.access.require('employees:read')
    return await ctx.db.finance.salaryRegister.getAll(ctx)
  }

  static async createSalaryEntry(ctx: ExecutionContext, dto: CreateSalaryRegisterDTO): Promise<SalaryRegister> {
    await ctx.access.require('employees:update')
    if (new Date(dto.periodStart) > new Date(dto.periodEnd)) {
      throw new Error('periodStart не может быть позже periodEnd')
    }
    if (dto.amount <= 0) {
      throw new Error('Сумма должна быть больше 0')
    }
    return await ctx.db.finance.salaryRegister.create(ctx, dto)
  }
}
