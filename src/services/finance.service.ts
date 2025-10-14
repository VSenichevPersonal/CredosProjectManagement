import type { ExecutionContext } from '@/lib/context/execution-context'
import type { RevenueManual, CreateRevenueManualDTO, RevenueFilters } from '@/types/domain'

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
}
