export interface Tag {
  id: string;
  name: string;
  color: string; // Hex color code, e.g. #3B82F6
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TagFilters {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateTagDTO {
  name: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTagDTO {
  name?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

