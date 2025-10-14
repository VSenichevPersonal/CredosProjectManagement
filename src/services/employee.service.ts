import { ExecutionContext } from '@/lib/context/execution-context';
import { Employee } from '@/types/domain';
import { DatabaseProvider } from '@/providers/database-provider.interface';

export interface CreateEmployeeDTO {
  fullName: string;
  email: string;
  position: string;
  directionId: string;
  defaultHourlyRate?: number;
  isActive?: boolean;
}

export interface UpdateEmployeeDTO {
  fullName?: string;
  email?: string;
  position?: string;
  directionId?: string;
  defaultHourlyRate?: number;
  isActive?: boolean;
}

export interface EmployeeFilters {
  directionId?: string;
  position?: string;
  isActive?: boolean;
  search?: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  averageRate: number;
  directionsCount: number;
}

export class EmployeeService {
  constructor(private db: DatabaseProvider) {}

  /**
   * Получить всех сотрудников с фильтрацией
   */
  async getAllEmployees(ctx: ExecutionContext, filters?: EmployeeFilters): Promise<Employee[]> {
    // Проверяем права доступа
    if (!ctx.access.check('employees:read')) {
      throw new Error('Недостаточно прав для просмотра сотрудников');
    }

    const employees = await this.db.employees.getAll(ctx);
    
    // Применяем фильтры
    let filteredEmployees = employees;
    
    if (filters?.directionId) {
      filteredEmployees = filteredEmployees.filter(e => e.directionId === filters.directionId);
    }
    
    if (filters?.position) {
      filteredEmployees = filteredEmployees.filter(e => e.position === filters.position);
    }
    
    if (filters?.isActive !== undefined) {
      filteredEmployees = filteredEmployees.filter(e => e.isActive === filters.isActive);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(e => 
        e.fullName.toLowerCase().includes(searchLower) ||
        e.email.toLowerCase().includes(searchLower) ||
        e.position.toLowerCase().includes(searchLower)
      );
    }

    return filteredEmployees;
  }

  /**
   * Получить сотрудника по ID
   */
  async getEmployeeById(ctx: ExecutionContext, id: string): Promise<Employee | null> {
    if (!ctx.access.check('employees:read')) {
      throw new Error('Недостаточно прав для просмотра сотрудника');
    }

    return await this.db.employees.getById(ctx, id);
  }

  /**
   * Получить сотрудника по email
   */
  async getEmployeeByEmail(ctx: ExecutionContext, email: string): Promise<Employee | null> {
    if (!ctx.access.check('employees:read')) {
      throw new Error('Недостаточно прав для просмотра сотрудника');
    }

    // TODO: Реализовать getByEmail в провайдере
    const employees = await this.db.employees.getAll(ctx);
    return employees.find(e => e.email === email) || null;
  }

  /**
   * Создать нового сотрудника
   */
  async createEmployee(ctx: ExecutionContext, dto: CreateEmployeeDTO): Promise<Employee> {
    if (!ctx.access.check('employees:create')) {
      throw new Error('Недостаточно прав для создания сотрудника');
    }

    // Валидация бизнес-правил
    if (dto.defaultHourlyRate && dto.defaultHourlyRate < 0) {
      throw new Error('Почасовая ставка не может быть отрицательной');
    }

    // Проверяем уникальность email
    const employees = await this.db.employees.getAll(ctx);
    const existingEmployee = employees.find(e => e.email === dto.email);
    if (existingEmployee) {
      throw new Error('Сотрудник с таким email уже существует');
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      throw new Error('Некорректный формат email');
    }

    const employee: Employee = {
      id: crypto.randomUUID(),
      fullName: dto.fullName,
      email: dto.email,
      position: dto.position,
      directionId: dto.directionId,
      defaultHourlyRate: dto.defaultHourlyRate ?? 0,
      isActive: dto.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.db.employees.create(ctx, employee);
  }

  /**
   * Обновить сотрудника
   */
  async updateEmployee(ctx: ExecutionContext, id: string, dto: UpdateEmployeeDTO): Promise<Employee> {
    if (!ctx.access.check('employees:update')) {
      throw new Error('Недостаточно прав для обновления сотрудника');
    }

    const existingEmployee = await this.db.employees.getById(ctx, id);
    if (!existingEmployee) {
      throw new Error('Сотрудник не найден');
    }

    // Валидация бизнес-правил
    if (dto.defaultHourlyRate && dto.defaultHourlyRate < 0) {
      throw new Error('Почасовая ставка не может быть отрицательной');
    }

    // Проверяем уникальность email, если он обновляется
    if (dto.email && dto.email !== existingEmployee.email) {
      const employees = await this.db.employees.getAll(ctx);
      const existingByEmail = employees.find(e => e.email === dto.email);
      if (existingByEmail) {
        throw new Error('Сотрудник с таким email уже существует');
      }

      // Валидация email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email)) {
        throw new Error('Некорректный формат email');
      }
    }

    const updatedEmployee: Employee = {
      ...existingEmployee,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    return await this.db.employees.update(ctx, id, updatedEmployee);
  }

  /**
   * Удалить сотрудника
   */
  async deleteEmployee(ctx: ExecutionContext, id: string): Promise<void> {
    if (!ctx.access.check('employees:delete')) {
      throw new Error('Недостаточно прав для удаления сотрудника');
    }

    const employee = await this.db.employees.getById(ctx, id);
    if (!employee) {
      throw new Error('Сотрудник не найден');
    }

    // Проверяем, есть ли активные проекты у сотрудника
    const projects = await this.db.projects.getAll(ctx);
    const activeProjects = projects.filter(p => 
      p.managerId === id && (p.status === 'active' || p.status === 'planning')
    );
    
    if (activeProjects.length > 0) {
      throw new Error('Нельзя удалить сотрудника с активными проектами');
    }

    // Проверяем, есть ли незакрытые трудозатраты
    const timeEntries = await this.db.timeEntries.getByEmployee(ctx, id);
    const pendingTimeEntries = timeEntries.filter(entry => entry.status === 'submitted');
    
    if (pendingTimeEntries.length > 0) {
      throw new Error('Нельзя удалить сотрудника с незакрытыми трудозатратами');
    }

    await this.db.employees.delete(ctx, id);
  }

  /**
   * Получить статистику по сотрудникам
   */
  async getEmployeeStats(ctx: ExecutionContext): Promise<EmployeeStats> {
    if (!ctx.access.check('employees:read')) {
      throw new Error('Недостаточно прав для просмотра статистики');
    }

    const employees = await this.db.employees.getAll(ctx);
    
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.isActive).length;
    const inactiveEmployees = totalEmployees - activeEmployees;
    
    const employeesWithRate = employees.filter(e => e.defaultHourlyRate && e.defaultHourlyRate > 0);
    const averageRate = employeesWithRate.length > 0
      ? employeesWithRate.reduce((sum, e) => sum + e.defaultHourlyRate!, 0) / employeesWithRate.length
      : 0;
    
    const directions = new Set(employees.map(e => e.directionId));
    const directionsCount = directions.size;

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      averageRate,
      directionsCount,
    };
  }

  /**
   * Получить список отделов
   */
  async getDirections(ctx: ExecutionContext): Promise<string[]> {
    if (!ctx.access.check('employees:read')) {
      throw new Error('Недостаточно прав для просмотра направлений');
    }

    const employees = await this.db.employees.getAll(ctx);
    const directions = new Set(employees.map(e => e.directionId));
    return Array.from(directions).sort();
  }

  /**
   * Получить список должностей
   */
  async getPositions(ctx: ExecutionContext): Promise<string[]> {
    if (!ctx.access.check('employees:read')) {
      throw new Error('Недостаточно прав для просмотра должностей');
    }

    const employees = await this.db.employees.getAll(ctx);
    const positions = new Set(employees.map(e => e.position));
    return Array.from(positions).sort();
  }

  /**
   * Получить сотрудников по отделу
   */
  async getEmployeesByDirection(ctx: ExecutionContext, directionId: string): Promise<Employee[]> {
    if (!ctx.access.check('employees:read')) {
      throw new Error('Недостаточно прав для просмотра сотрудников');
    }

    const employees = await this.db.employees.getAll(ctx);
    return employees.filter(e => e.directionId === directionId && e.isActive);
  }

  /**
   * Активировать/деактивировать сотрудника
   */
  async toggleEmployeeStatus(ctx: ExecutionContext, id: string): Promise<Employee> {
    if (!ctx.access.check('employees:update')) {
      throw new Error('Недостаточно прав для изменения статуса сотрудника');
    }

    const employee = await this.db.employees.getById(ctx, id);
    if (!employee) {
      throw new Error('Сотрудник не найден');
    }

    const updatedEmployee: Employee = {
      ...employee,
      isActive: !employee.isActive,
      updatedAt: new Date().toISOString(),
    };

    return await this.db.employees.update(ctx, id, updatedEmployee);
  }
}
