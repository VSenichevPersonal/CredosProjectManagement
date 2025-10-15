import type { ExecutionContext } from '@/lib/context/execution-context';

// ============================================================================
// Types
// ============================================================================

export interface EmployeeUtilization {
  employeeId: string;
  employeeName: string;
  position: string;
  totalHours: number;
  capacity: number; // часов в неделю (обычно 40)
  utilization: number; // процент загрузки
  projects: Array<{
    projectId: string;
    projectName: string;
    hours: number;
  }>;
}

export interface ProjectBudgetReport {
  projectId: string;
  projectName: string;
  projectCode?: string;
  status: string;
  budget: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
  isOverBudget: boolean;
  employees: Array<{
    employeeId: string;
    employeeName: string;
    hours: number;
    cost: number;
  }>;
}

// ============================================================================
// Report Service
// ============================================================================

export class ReportService {
  /**
   * Отчёт по загрузке сотрудников
   */
  static async getEmployeeUtilization(
    ctx: ExecutionContext,
    startDate: string,
    endDate: string
  ): Promise<EmployeeUtilization[]> {
    ctx.logger.info('[ReportService] getEmployeeUtilization', { startDate, endDate });
    await ctx.access.require('reports:view' as any);

    // SQL запрос для загрузки сотрудников
    const query = `
      SELECT 
        e.id as employee_id,
        e.full_name as employee_name,
        e.position,
        COALESCE(SUM(te.hours), 0) as total_hours
      FROM employees e
      LEFT JOIN time_entries te ON te.employee_id = e.id 
        AND te.date >= $1 
        AND te.date <= $2
      WHERE e.is_active = true
      GROUP BY e.id, e.full_name, e.position
      ORDER BY total_hours DESC
    `;

    const result = await ctx.db.query(query, [startDate, endDate]);

    // Для каждого сотрудника получаем разбивку по проектам
    const utilizationData: EmployeeUtilization[] = [];

    for (const row of result.rows) {
      // Получить часы по проектам для этого сотрудника
      const projectQuery = `
        SELECT 
          p.id as project_id,
          p.name as project_name,
          SUM(te.hours) as hours
        FROM time_entries te
        JOIN projects p ON p.id = te.project_id
        WHERE te.employee_id = $1
          AND te.date >= $2
          AND te.date <= $3
        GROUP BY p.id, p.name
        ORDER BY hours DESC
      `;

      const projectResult = await ctx.db.query(projectQuery, [
        row.employee_id,
        startDate,
        endDate,
      ]);

      const capacity = 40; // Стандартная рабочая неделя
      const totalHours = parseFloat(row.total_hours);
      const utilization = capacity > 0 ? (totalHours / capacity) * 100 : 0;

      utilizationData.push({
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        position: row.position,
        totalHours,
        capacity,
        utilization: Math.round(utilization * 10) / 10, // Округлить до 1 знака
        projects: projectResult.rows.map((p: any) => ({
          projectId: p.project_id,
          projectName: p.project_name,
          hours: parseFloat(p.hours),
        })),
      });
    }

    return utilizationData;
  }

  /**
   * Отчёт по бюджетам проектов
   */
  static async getProjectBudgetReport(
    ctx: ExecutionContext
  ): Promise<ProjectBudgetReport[]> {
    ctx.logger.info('[ReportService] getProjectBudgetReport');
    await ctx.access.require('reports:view' as any);

    // SQL запрос для бюджетов проектов
    const query = `
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.code as project_code,
        p.status,
        COALESCE(p.total_budget, 0) as budget,
        COALESCE(p.current_spent, 0) as spent
      FROM projects p
      WHERE p.status != 'cancelled'
      ORDER BY p.name
    `;

    const result = await ctx.db.query(query, []);

    const budgetReports: ProjectBudgetReport[] = [];

    for (const row of result.rows) {
      // Получить затраты по сотрудникам для этого проекта
      const employeeQuery = `
        SELECT 
          e.id as employee_id,
          e.full_name as employee_name,
          SUM(te.hours) as hours,
          e.default_hourly_rate as hourly_rate
        FROM time_entries te
        JOIN employees e ON e.id = te.employee_id
        WHERE te.project_id = $1
        GROUP BY e.id, e.full_name, e.default_hourly_rate
        ORDER BY hours DESC
      `;

      const employeeResult = await ctx.db.query(employeeQuery, [row.project_id]);

      const employees = employeeResult.rows.map((emp: any) => {
        const hours = parseFloat(emp.hours);
        const rate = parseFloat(emp.hourly_rate || 0);
        const cost = hours * rate;

        return {
          employeeId: emp.employee_id,
          employeeName: emp.employee_name,
          hours,
          cost,
        };
      });

      // Посчитать общие затраты
      const totalCost = employees.reduce((sum, emp) => sum + emp.cost, 0);

      const budget = parseFloat(row.budget);
      const spent = totalCost; // Используем посчитанные затраты
      const remaining = budget - spent;
      const utilizationPercent = budget > 0 ? (spent / budget) * 100 : 0;
      const isOverBudget = spent > budget;

      budgetReports.push({
        projectId: row.project_id,
        projectName: row.project_name,
        projectCode: row.project_code,
        status: row.status,
        budget,
        spent,
        remaining,
        utilizationPercent: Math.round(utilizationPercent * 10) / 10,
        isOverBudget,
        employees,
      });
    }

    return budgetReports;
  }

  /**
   * Отчёт по времени сотрудника (для него самого)
   */
  static async getMyTimeReport(
    ctx: ExecutionContext,
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalHours: number;
    daysWorked: number;
    avgHoursPerDay: number;
    projects: Array<{
      projectId: string;
      projectName: string;
      hours: number;
      percent: number;
    }>;
  }> {
    ctx.logger.info('[ReportService] getMyTimeReport', { employeeId, startDate, endDate });

    // Проверка что пользователь может видеть свои данные или все
    if (ctx.employeeId !== employeeId && !ctx.access.check('reports:view_all' as any)) {
      throw new Error('Access denied: cannot view other employee reports');
    }

    // Запрос для получения данных
    const query = `
      SELECT 
        COALESCE(SUM(te.hours), 0) as total_hours,
        COUNT(DISTINCT te.date) as days_worked
      FROM time_entries te
      WHERE te.employee_id = $1
        AND te.date >= $2
        AND te.date <= $3
    `;

    const result = await ctx.db.query(query, [employeeId, startDate, endDate]);
    const row = result.rows[0];

    const totalHours = parseFloat(row.total_hours);
    const daysWorked = parseInt(row.days_worked);
    const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

    // Разбивка по проектам
    const projectQuery = `
      SELECT 
        p.id as project_id,
        p.name as project_name,
        SUM(te.hours) as hours
      FROM time_entries te
      JOIN projects p ON p.id = te.project_id
      WHERE te.employee_id = $1
        AND te.date >= $2
        AND te.date <= $3
      GROUP BY p.id, p.name
      ORDER BY hours DESC
    `;

    const projectResult = await ctx.db.query(projectQuery, [employeeId, startDate, endDate]);

    const projects = projectResult.rows.map((p: any) => {
      const hours = parseFloat(p.hours);
      const percent = totalHours > 0 ? (hours / totalHours) * 100 : 0;

      return {
        projectId: p.project_id,
        projectName: p.project_name,
        hours,
        percent: Math.round(percent * 10) / 10,
      };
    });

    return {
      totalHours,
      daysWorked,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      projects,
    };
  }
}

