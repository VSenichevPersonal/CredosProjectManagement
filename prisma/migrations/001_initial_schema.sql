-- Initial schema: directions, employees, projects, tasks, time_entries

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Directions
create table if not exists directions (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  description text,
  budget numeric(15,2),
  budget_threshold numeric(15,2),
  color varchar(20) default 'blue',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Employees
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  full_name varchar(255) not null,
  position varchar(200) not null,
  direction_id uuid references directions(id),
  default_hourly_rate numeric(10,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  description text,
  direction_id uuid references directions(id),
  manager_id uuid references employees(id),
  status varchar(20) default 'active',
  priority varchar(20) default 'medium',
  start_date date,
  end_date date,
  total_budget numeric(15,2),
  current_spent numeric(15,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  name varchar(200) not null,
  description text,
  assignee_id uuid references employees(id),
  status varchar(20) default 'todo',
  priority varchar(20) default 'medium',
  estimated_hours numeric(8,2),
  actual_hours numeric(8,2) default 0,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Time entries
create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id),
  project_id uuid references projects(id),
  phase_id uuid,
  date date not null,
  hours numeric(4,2) not null check (hours > 0 and hours <= 24),
  description text,
  status varchar(20) default 'submitted',
  approved_by uuid references employees(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_employees_direction_id on employees(direction_id);
create index if not exists idx_employees_email on employees(email);
create index if not exists idx_projects_direction_id on projects(direction_id);
create index if not exists idx_projects_manager_id on projects(manager_id);
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_assignee_id on tasks(assignee_id);
create index if not exists idx_time_entries_employee_id on time_entries(employee_id);
create index if not exists idx_time_entries_project_id on time_entries(project_id);
create index if not exists idx_time_entries_date on time_entries(date);
create index if not exists idx_time_entries_status on time_entries(status);

