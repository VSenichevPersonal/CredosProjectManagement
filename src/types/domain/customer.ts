/**
 * Customer (Клиент) domain types
 */

export interface Customer {
  id: string;
  name: string;
  legalName?: string;
  inn?: string;
  kpp?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDTO {
  name: string;
  legalName?: string;
  inn?: string;
  kpp?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
}

export interface UpdateCustomerDTO {
  name?: string;
  legalName?: string;
  inn?: string;
  kpp?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CustomerFilters {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

