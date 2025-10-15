/**
 * Activity (Вид деятельности) domain types
 */

export interface Activity {
  id: string;
  name: string;
  description?: string;
  color: string;
  defaultHourlyRate: number;
  isBillable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityDTO {
  name: string;
  description?: string;
  color?: string;
  defaultHourlyRate?: number;
  isBillable?: boolean;
}

export interface UpdateActivityDTO {
  name?: string;
  description?: string;
  color?: string;
  defaultHourlyRate?: number;
  isBillable?: boolean;
  isActive?: boolean;
}

export interface ActivityFilters {
  search?: string;
  isBillable?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

