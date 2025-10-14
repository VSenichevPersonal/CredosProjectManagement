// Экспорт всех доменных сервисов
export { ProjectService } from './project.service';
export { TaskService } from './task.service';
export { TimeTrackingService } from './time-tracking.service';
export { EmployeeService } from './employee.service';
export { DirectionService } from './direction.service';

// Экспорт типов DTO
export type { CreateProjectDTO, UpdateProjectDTO, ProjectFilters } from './project.service';
export type { CreateTaskDTO, UpdateTaskDTO, TaskFilters, TaskStats } from './task.service';
export type { TimeEntryFilters, TimeTrackingStats } from './time-tracking.service';
export type { CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeFilters, EmployeeStats } from './employee.service';
export type { CreateDirectionDTO, UpdateDirectionDTO, DirectionFilters, DirectionStats } from './direction.service';
