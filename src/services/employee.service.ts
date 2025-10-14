import { ExecutionContext } from '@/lib/context/execution-context';
import { Employee } from '@/types/domain';
import { DatabaseProvider } from '@/providers/database-provider.interface';

export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  hireDate: Date;
  salary?: number;
  phone?: string;
  avatar?: string;
  isActive: boolean;
}

export interface UpdateEmployeeDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
  department?: string;
  hireDate?: Date;
  salary?: number;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface EmployeeFilters {
  department?: string;
  position?: string;
  isActive?: boolean;
  search?: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  averageSalary: number;
  departmentsCount: number;
}

export class EmployeeService {
  constructor(private db: DatabaseProvider) {}

  /**
   * Получить всех сотрудников с фильтрацией
   */
  async getAllEmployees(ctx: ExecutionContext, filters?: EmployeeFilters): Promise<Employee[]> {
    // Проверяем права доступа
    if (!ctx.permissions.includes('employees:read')) {
      throw new Error('Недостаточно прав для просмотра сотрудников');
    }

    const employees = await this.db.employees.getAll(ctx);
    
    // Применяем фильтры
    let filteredEmployees = employees;
    
    if (filters?.department) {
      filteredEmployees = filteredEmployees.filter(e => e.department === filters.department);
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
        e.firstName.toLowerCase().includes(searchLower) ||
        e.lastName.toLowerCase().includes(searchLower) ||
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
    if (!ctx.permissions.includes('employees:read')) {
      throw new Error('Недостаточно прав для просмотра сотрудника');
    }

    return await this.db.employees.getById(ctx, id);
  }

  /**
   * Получить сотрудника по email
   */
  async getEmployeeByEmail(ctx: ExecutionContext, email: string): Promise<Employee | null> {
    if (!ctx.permissions.includes('employees:read')) {
      throw new Error('Недостаточно прав для просмотра сотрудника');
    }

    return await this.db.employees.getByEmail(ctx, email);
  }

  /**
   * Создать нового сотрудника
   */
  async createEmployee(ctx: ExecutionContext, dto: CreateEmployeeDTO): Promise<Employee> {
    if (!ctx.permissions.includes('employees:create')) {
      throw new Error('Недостаточно прав для создания сотрудника');
    }

    // Валидация бизнес-правил
    if (dto.hireDate > new Date()) {
      throw new Error('Дата приема на работу не может быть в будущем');
    }

    if (dto.salary && dto.salary < 0) {
      throw new Error('Зарплата не может быть отрицательной');
    }

    // Проверяем уникальность email
    const existingEmployee = await this.db.employees.getByEmail(ctx, dto.email);
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
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      position: dto.position,
      department: dto.department,
      hireDate: dto.hireDate,
      salary: dto.salary,
      phone: dto.phone,
      avatar: dto.avatar,
      isActive: dto.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.db.employees.create(ctx, employee);
  }

  /**
   * Обновить сотрудника
   */
  async updateEmployee(ctx: ExecutionContext, id: string, dto: UpdateEmployeeDTO): Promise<Employee> {
    if (!ctx.permissions.includes('employees:update')) {
      throw new Error('Недостаточно прав для обновления сотрудника');
    }

    const existingEmployee = await this.db.employees.getById(ctx, id);
    if (!existingEmployee) {
      throw new Error('Сотрудник не найден');
    }

    // Валидация бизнес-правил
    if (dto.hireDate && dto.hireDate > new Date()) {
      throw new Error('Дата приема на работу не может быть в будущем');
    }

    if (dto.salary && dto.salary < 0) {
      throw new Error('Зарплата не может быть отрицательной');
    }

    // Проверяем уникальность email, если он обновляется
    if (dto.email && dto.email !== existingEmployee.email) {
      const existingByEmail = await this.db.employees.getByEmail(ctx, dto.email);
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
    if (!ctx.permissions.includes('employees:delete')) {
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
    const timeEntries = await this.db.timeEntries.getByEmployeeId(ctx, id);
    const pendingTimeEntries = timeEntries.filter(entry => entry.status === 'pending');
    
    if (pendingTimeEntries.length > 0) {
      throw new Error('Нельзя удалить сотрудника с незакрытыми трудозатратами');
    }

    await this.db.employees.delete(ctx, id);
  }

  /**
   * Получить статистику по сотрудникам
   */
  async getEmployeeStats(ctx: ExecutionContext): Promise<EmployeeStats> {
    if (!ctx.permissions.includes('employees:read')) {
      throw new Error('Недостаточно прав для просмотра статистики');
    }

    const employees = await this.db.employees.getAll(ctx);
    
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.isActive).length;
    const inactiveEmployees = totalEmployees - activeEmployees;
    
    const employeesWithSalary = employees.filter(e => e.salary && e.salary > 0);
    const averageSalary = employeesWithSalary.length > 0 
      ? employeesWithSalary.reduce((sum, e) => sum + e.salary!, 0) / employeesWithSalary.length 
      : 0;
    
    const departments = new Set(employees.map(e => e.department));
    const departmentsCount = departments.size;

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      averageSalary,
      departmentsCount,
    };
  }

  /**
   * Получить список отделов
   */
  async getDepartments(ctx: ExecutionContext): Promise<string[]> {
    if (!ctx.permissions.includes('employees:read')) {
      throw new Error('Недостаточно прав для просмотра отделов');
    }

    const employees = await this.db.employees.getAll(ctx);
    const departments = new Set(employees.map(e => e.department));
    return Array.from(departments).sort();
  }

  /**
   * Получить список должностей
   */
  async getPositions(ctx: ExecutionContext): Promise<string[]> {
    if (!ctx.permissions.includes('employees:read')) {
      throw new Error('Недостаточно прав для просмотра должностей');
    }

    const employees = await this.db.employees.getAll(ctx);
    const positions = new Set(employees.map(e => e.position));
    return Array.from(positions).sort();
  }

  /**
   * Получить сотрудников по отделу
   */
  async getEmployeesByDepartment(ctx: ExecutionContext, department: string): Promise<Employee[]> {
    if (!ctx.permissions.includes('employees:read')) {
      throw new Error('Недостаточно прав для просмотра сотрудников');
    }

    const employees = await this.db.employees.getAll(ctx);
    return employees.filter(e => e.department === department && e.isActive);
  }

  /**
   * Активировать/деактивировать сотрудника
   */
  async toggleEmployeeStatus(ctx: ExecutionContext, id: string): Promise<Employee> {
    if (!ctx.permissions.includes('employees:update')) {
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
