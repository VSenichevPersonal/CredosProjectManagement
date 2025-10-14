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
  // Сервисы теперь статические и используют ExecutionContext
  public static projects = ProjectService
  public static tasks = TaskService
  public static timeTracking = TimeTrackingService
  public static employees = EmployeeService
  public static directions = DirectionService

  /**
   * Получить все сервисы как объект
   */
  static getAllServices() {
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
 * Фабрика для создания контейнера сервисов (теперь не нужна)
 */
export function createServiceContainer(databaseProvider: DatabaseProvider): ServiceContainer {
  return ServiceContainer;
}
