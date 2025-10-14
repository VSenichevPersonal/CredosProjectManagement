import { DatabaseProvider } from '@/providers/database-provider.interface';
import { 
  ProjectService, 
  TaskService, 
  TimeTrackingService, 
  EmployeeService, 
  DirectionService 
} from './index';

/**
 * Контейнер сервисов - централизованное управление всеми доменными сервисами
 * Реализует паттерн Dependency Injection
 */
export class ServiceContainer {
  public readonly projects: ProjectService;
  public readonly tasks: TaskService;
  public readonly timeTracking: TimeTrackingService;
  public readonly employees: EmployeeService;
  public readonly directions: DirectionService;

  constructor(databaseProvider: DatabaseProvider) {
    // Инициализируем все сервисы с общим провайдером БД
    this.projects = new ProjectService(databaseProvider);
    this.tasks = new TaskService(databaseProvider);
    this.timeTracking = new TimeTrackingService(databaseProvider);
    this.employees = new EmployeeService(databaseProvider);
    this.directions = new DirectionService(databaseProvider);
  }

  /**
   * Получить все сервисы как объект
   */
  getAllServices() {
    return {
      projects: this.projects,
      tasks: this.tasks,
      timeTracking: this.timeTracking,
      employees: this.employees,
      directions: this.directions,
    };
  }
}

/**
 * Фабрика для создания контейнера сервисов
 */
export function createServiceContainer(databaseProvider: DatabaseProvider): ServiceContainer {
  return new ServiceContainer(databaseProvider);
}
