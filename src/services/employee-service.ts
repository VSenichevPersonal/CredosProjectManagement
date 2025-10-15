import { ExecutionContext } from '@/lib/context/execution-context';
import type { EmployeeFilters } from '@/providers/database-provider.interface';

export class EmployeeService {
  /**
   * Get all employees with server-side filtering and pagination
   * Refactored to use Repository Pattern
   */
  static async getAllEmployees(
    ctx: ExecutionContext,
    filters?: EmployeeFilters
  ) {
    ctx.logger.info('[EmployeeService] getAllEmployees', { filters });
    await ctx.access.require('employees:read');

    // ✅ Use repository instead of raw SQL
    const [data, total] = await Promise.all([
      ctx.db.employees.getAll(ctx, filters),
      ctx.db.employees.getCount(ctx, filters)
    ]);

    ctx.logger.info('[EmployeeService] Employees fetched', {
      count: data.length,
      total
    });

    return { data, total };
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(ctx: ExecutionContext, id: string) {
    ctx.logger.info('[EmployeeService] getEmployeeById', { id });
    await ctx.access.require('employees:read');

    return ctx.db.employees.getById(ctx, id);
  }

  /**
   * Create new employee
   */
  static async createEmployee(ctx: ExecutionContext, data: any) {
    ctx.logger.info('[EmployeeService] createEmployee', { email: data.email });
    await ctx.access.require('employees:create');

    const employee = await ctx.db.employees.create(ctx, {
      email: data.email,
      fullName: data.fullName,
      position: data.position,
      directionId: data.directionId,
      defaultHourlyRate: data.defaultHourlyRate || 0,
      isActive: true
    });

    ctx.logger.info('[EmployeeService] Employee created', { id: employee.id });

    return employee;
  }

  /**
   * Update employee
   */
  static async updateEmployee(ctx: ExecutionContext, id: string, data: any) {
    ctx.logger.info('[EmployeeService] updateEmployee', { id });
    await ctx.access.require('employees:update');

    const employee = await ctx.db.employees.update(ctx, id, data);

    ctx.logger.info('[EmployeeService] Employee updated', { id });

    return employee;
  }

  /**
   * Delete employee (soft delete)
   */
  static async deleteEmployee(ctx: ExecutionContext, id: string) {
    ctx.logger.info('[EmployeeService] deleteEmployee', { id });
    await ctx.access.require('employees:delete');

    await ctx.db.employees.delete(ctx, id);

    ctx.logger.info('[EmployeeService] Employee deleted', { id });
  }
}
