-- Stage 2: Finance schema (orders, services, manual revenues, extra costs, salary registry, allocation rules)

create schema if not exists finance;

-- Orders (заказы) – проект может иметь несколько заказов
create table if not exists finance.customer_order (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  code text,              -- номер/код заказа
  title text not null,    -- краткое наименование
  customer text,          -- контрагент/клиент
  status text default 'active',
  amount_total numeric(15,2),
  currency text default 'RUB',
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_fin_order_project on finance.customer_order(project_id);
create index if not exists idx_fin_order_status on finance.customer_order(status);

-- Order services (услуги/работы в рамках заказа)
create table if not exists finance.order_service (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references finance.customer_order(id) on delete cascade,
  name text not null,
  description text,
  quantity numeric(12,4) default 1,
  unit_price numeric(15,2) default 0,
  amount numeric(15,2) generated always as (coalesce(quantity,1) * coalesce(unit_price,0)) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_fin_service_order on finance.order_service(order_id);

-- Manual revenues (ручные доходы по периодам)
create table if not exists finance.revenue_manual (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  order_id uuid references finance.customer_order(id) on delete set null,
  service_id uuid references finance.order_service(id) on delete set null,
  period_start date not null,
  period_end date not null,
  amount numeric(15,2) not null,
  currency text default 'RUB',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (period_end >= period_start)
);
create index if not exists idx_fin_rev_project_period on finance.revenue_manual(project_id, period_start, period_end);

-- Extra costs (дополнительные прямые затраты вручную)
create table if not exists finance.extra_cost (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  direction_id uuid references directions(id) on delete set null,
  cost_type text,              -- тип/категория затрат
  period_start date not null,
  period_end date not null,
  amount numeric(15,2) not null,
  currency text default 'RUB',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (period_end >= period_start)
);
create index if not exists idx_fin_cost_project_period on finance.extra_cost(project_id, period_start, period_end);
create index if not exists idx_fin_cost_direction on finance.extra_cost(direction_id);

-- Salary registry (реестр зарплат по периодам, пофамильно или по направлениям)
create table if not exists finance.salary_register (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  employee_id uuid references employees(id) on delete set null,
  direction_id uuid references directions(id) on delete set null,
  amount numeric(15,2) not null,
  source text default 'manual',   -- manual/import
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (period_end >= period_start)
);
create index if not exists idx_fin_salary_period on finance.salary_register(period_start, period_end);
create index if not exists idx_fin_salary_employee on finance.salary_register(employee_id);
create index if not exists idx_fin_salary_direction on finance.salary_register(direction_id);

-- Allocation rules (правила распределения затрат/доходов)
-- method: hours, headcount, fixed_percent, by_revenue
-- scope: company, direction, project, order
create table if not exists finance.allocation_rule (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'project',
  scope_id uuid,
  method text not null default 'hours',
  percent numeric(7,4),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_fin_alloc_scope on finance.allocation_rule(scope, scope_id);
create index if not exists idx_fin_alloc_method on finance.allocation_rule(method);
