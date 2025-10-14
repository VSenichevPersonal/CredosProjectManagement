# Authentication & Authorization Guide - Stage 13

Руководство по аутентификации и авторизации в системе IB Compliance Platform.

## Аутентификация

### Supabase Auth

Система использует Supabase Auth для управления пользователями и сессиями.

#### Вход в систему

\`\`\`typescript
// Client-side (app/auth/login/page.tsx)
const supabase = createClient()

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

if (error) {
  console.error('Login failed:', error)
} else {
  // Redirect to dashboard
  window.location.href = '/'
}
\`\`\`

#### Получение текущего пользователя

\`\`\`typescript
// Server-side (lib/auth/get-user.ts)
export async function getCurrentUser(): Promise<ExtendedUser | null> {
  const supabase = await createServerClient()
  
  // Get auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  // Get user data from database
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id, tenant_id, name')
    .eq('id', user.id)
    .single()
  
  // Get subordinate organizations
  const { data: subordinateOrgs } = await supabase
    .rpc('get_subordinate_organizations', {
      org_id: userData.organization_id
    })
  
  return {
    id: user.id,
    email: user.email,
    role: userData.role,
    organizationId: userData.organization_id,
    tenantId: userData.tenant_id,
    fullName: userData.name,
    subordinateOrganizationIds: subordinateOrgs?.map(org => org.id) || []
  }
}
\`\`\`

#### Защита страниц

\`\`\`typescript
// Server Component
export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Render page
  return <Dashboard user={user} />
}
\`\`\`

#### Middleware для обновления сессии

\`\`\`typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
\`\`\`

## Авторизация

### RBAC (Role-Based Access Control)

Система использует иерархическую модель ролей с гранулярными правами.

#### Роли

\`\`\`typescript
export enum Role {
  SUPER_ADMIN = 'super_admin',        // Все права
  REGULATOR_ADMIN = 'regulator_admin', // Управление регулятором
  MINISTRY_USER = 'ministry_user',     // Просмотр подведомственных
  INSTITUTION_USER = 'institution_user', // Работа в своей организации
  CISO = 'ciso',                       // Управление комплаенсом
  AUDITOR = 'auditor'                  // Только чтение
}
\`\`\`

**Иерархия ролей**:
\`\`\`
super_admin (все права)
  ↓
regulator_admin (управление регулятором)
  ↓
ministry_user (просмотр подведомственных)
  ↓
institution_user (работа в своей организации)
  ↓
ciso (управление комплаенсом)
  ↓
auditor (только чтение)
\`\`\`

#### Permissions

\`\`\`typescript
export enum Permission {
  // Requirements
  REQUIREMENT_READ = 'requirement:read',
  REQUIREMENT_CREATE = 'requirement:create',
  REQUIREMENT_UPDATE = 'requirement:update',
  REQUIREMENT_DELETE = 'requirement:delete',
  REQUIREMENT_ASSIGN = 'requirement:assign',
  
  // Organizations
  ORGANIZATION_READ = 'organization:read',
  ORGANIZATION_CREATE = 'organization:create',
  ORGANIZATION_UPDATE = 'organization:update',
  ORGANIZATION_DELETE = 'organization:delete',
  
  // Compliance
  COMPLIANCE_READ = 'compliance:read',
  COMPLIANCE_UPDATE = 'compliance:update',
  COMPLIANCE_APPROVE = 'compliance:approve',
  COMPLIANCE_REJECT = 'compliance:reject',
  
  // Evidence
  EVIDENCE_READ = 'evidence:read',
  EVIDENCE_CREATE = 'evidence:create',
  EVIDENCE_UPDATE = 'evidence:update',
  EVIDENCE_DELETE = 'evidence:delete',
  EVIDENCE_APPROVE = 'evidence:approve',
  
  // Documents
  DOCUMENT_READ = 'document:read',
  DOCUMENT_CREATE = 'document:create',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_DELETE = 'document:delete',
  
  // Dictionaries
  DICTIONARY_MANAGE = 'dictionary:manage',
  
  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  
  // Users
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Audit
  AUDIT_READ = 'audit:read',
}
\`\`\`

#### Mapping ролей к правам

\`\`\`typescript
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // Все права
  
  [Role.REGULATOR_ADMIN]: [
    Permission.REQUIREMENT_READ,
    Permission.REQUIREMENT_CREATE,
    Permission.REQUIREMENT_UPDATE,
    Permission.REQUIREMENT_ASSIGN,
    Permission.ORGANIZATION_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_APPROVE,
    Permission.COMPLIANCE_REJECT,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_CREATE,
    Permission.EVIDENCE_READ,
    Permission.EVIDENCE_APPROVE,
    Permission.DICTIONARY_MANAGE,
    Permission.REPORT_VIEW,
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.AUDIT_READ,
  ],
  
  [Role.MINISTRY_USER]: [
    Permission.REQUIREMENT_READ,
    Permission.ORGANIZATION_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_APPROVE,
    Permission.DOCUMENT_READ,
    Permission.EVIDENCE_READ,
    Permission.REPORT_VIEW,
  ],
  
  [Role.INSTITUTION_USER]: [
    Permission.REQUIREMENT_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_UPDATE,
    Permission.DOCUMENT_READ,
    Permission.EVIDENCE_READ,
  ],
  
  [Role.CISO]: [
    Permission.REQUIREMENT_READ,
    Permission.ORGANIZATION_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_UPDATE,
    Permission.DOCUMENT_READ,
    Permission.EVIDENCE_READ,
    Permission.REPORT_VIEW,
    Permission.DICTIONARY_MANAGE,
  ],
  
  [Role.AUDITOR]: [
    Permission.REQUIREMENT_READ,
    Permission.ORGANIZATION_READ,
    Permission.COMPLIANCE_READ,
    Permission.DOCUMENT_READ,
    Permission.EVIDENCE_READ,
    Permission.REPORT_VIEW,
    Permission.AUDIT_READ,
  ],
}
\`\`\`

### Access Control Service

\`\`\`typescript
export class AccessControlService {
  constructor(
    private user: User | undefined,
    private db: DatabaseProvider,
    private logger: Logger
  ) {}
  
  /**
   * Проверить наличие права
   */
  async require(permission: Permission): Promise<void> {
    if (!this.user) {
      throw new Error('Authentication required')
    }
    
    const hasPermission = await this.hasPermission(permission)
    if (!hasPermission) {
      this.logger.warn('Permission denied', {
        userId: this.user.id,
        permission,
        role: this.user.role
      })
      throw new Error(`Permission denied: ${permission}`)
    }
  }
  
  /**
   * Проверить наличие права (без throw)
   */
  async hasPermission(permission: Permission): Promise<boolean> {
    if (!this.user) return false
    
    const rolePermissions = ROLE_PERMISSIONS[this.user.role as Role]
    return rolePermissions?.includes(permission) || false
  }
  
  /**
   * Проверить доступ к организации
   */
  async canAccessOrganization(organizationId: string): Promise<boolean> {
    if (!this.user) return false
    
    // Super admin видит все
    if (this.user.role === 'super_admin') return true
    
    // Regulator admin видит все в своем тенанте
    if (this.user.role === 'regulator_admin') return true
    
    // Остальные видят свою организацию и подведомственные
    if (!this.user.organizationId) return false
    
    const subordinateIds = this.user.subordinateOrganizationIds || []
    return subordinateIds.includes(organizationId)
  }
  
  /**
   * Проверить возможность редактирования комплаенса
   */
  async canEditCompliance(complianceId: string): Promise<boolean> {
    if (!this.user) return false
    
    // Проверить право
    if (!await this.hasPermission(Permission.COMPLIANCE_UPDATE)) {
      return false
    }
    
    // Получить комплаенс
    const compliance = await this.db.compliance.findById(complianceId)
    if (!compliance) return false
    
    // Проверить доступ к организации
    return this.canAccessOrganization(compliance.organizationId)
  }
}
\`\`\`

### Использование в сервисах

\`\`\`typescript
export class RequirementService {
  static async create(
    ctx: ExecutionContext,
    data: CreateRequirementDTO
  ): Promise<Requirement> {
    // 1. Проверить аутентификацию
    if (!ctx.user) {
      throw new Error('Authentication required')
    }
    
    // 2. Проверить право
    await ctx.access.require(Permission.REQUIREMENT_CREATE)
    
    // 3. Валидация данных
    const validated = validate(createRequirementSchema, data)
    
    // 4. Создать требование
    const requirement = await ctx.db.requirements.create({
      ...validated,
      tenant_id: ctx.tenantId,
      created_by: ctx.user.id
    })
    
    // 5. Audit log
    await ctx.audit.log({
      eventType: 'requirement_created',
      userId: ctx.user.id,
      resourceType: 'requirement',
      resourceId: requirement.id,
      changes: validated
    })
    
    return requirement
  }
}
\`\`\`

## Row Level Security (RLS)

### Tenant Isolation

Все таблицы имеют политику изоляции по tenant_id:

\`\`\`sql
-- Пользователи видят только данные своего тенанта
CREATE POLICY "tenant_isolation" ON requirements
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
\`\`\`

### Organization Hierarchy

Доступ к данным с учетом иерархии организаций:

\`\`\`sql
-- Пользователи видят свою организацию и подведомственные
CREATE POLICY "org_hierarchy_access" ON compliance_records
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM get_subordinate_organizations(
        (SELECT organization_id FROM users WHERE id = auth.uid())
      )
    )
  );
\`\`\`

### Role-Based Policies

Политики на основе ролей:

\`\`\`sql
-- Super admin видит все
CREATE POLICY "super_admin_all_access" ON requirements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Regulator admin может создавать требования
CREATE POLICY "regulator_can_create" ON requirements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'regulator_admin')
    )
  );
\`\`\`

## Audit Logging

Все операции логируются в audit_log:

\`\`\`typescript
await ctx.audit.log({
  eventType: 'requirement_created',
  userId: ctx.user!.id,
  resourceType: 'requirement',
  resourceId: requirement.id,
  changes: data,
  metadata: {
    ip: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent')
  }
})
\`\`\`

## Best Practices

1. **Всегда проверяйте аутентификацию** в начале функции
2. **Проверяйте права** перед выполнением операций
3. **Используйте ExecutionContext** для всех зависимостей
4. **Логируйте все изменения** в audit_log
5. **Применяйте RLS** на уровне БД для дополнительной защиты
6. **Валидируйте данные** на всех уровнях
7. **Используйте типизацию** для предотвращения ошибок

## Troubleshooting

### Ошибка "Authentication required"
- Проверьте, что пользователь вошел в систему
- Проверьте, что сессия не истекла
- Проверьте cookies в браузере

### Ошибка "Permission denied"
- Проверьте роль пользователя
- Проверьте mapping ролей к правам
- Проверьте, что пользователь имеет нужное право

### Ошибка "Access denied to organization"
- Проверьте, что пользователь имеет доступ к организации
- Проверьте иерархию организаций
- Проверьте subordinateOrganizationIds пользователя
