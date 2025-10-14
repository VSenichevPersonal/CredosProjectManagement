# Анализ миграции с Supabase на обычный PostgreSQL

**Дата:** 2025-10-12  
**Статус:** Технически возможно, но требует значительных изменений  
**Сложность:** Средняя/Высокая

---

## 📊 Общая оценка

**✅ Хорошие новости:**
- У вас отличная провайдерная архитектура с абстракцией через репозитории
- Большая часть кода работает с обычным PostgreSQL
- Нет зависимости от Supabase Realtime
- Используются стандартные SQL функции PostgreSQL

**⚠️ Подводные камни:**
- Полная зависимость от Supabase Auth
- RLS политики завязаны на `auth.uid()`
- Используется Supabase Storage для файлов
- Middleware использует Supabase для управления сессиями

---

## 🔍 Детальный анализ зависимостей

### 1. ✅ База данных и запросы (90% готово)

**Что уже хорошо:**
```typescript
// Провайдерная архитектура полностью абстрагирует БД
export class SupabaseDatabaseProvider implements DatabaseProvider {
  // Репозитории легко переписать на другой драйвер
}
```

**Используемые PostgreSQL функции:**
- ✅ Стандартные функции (JSONB, UUID, рекурсивные CTE)
- ✅ Триггеры и хранимые процедуры
- ✅ Row Level Security (RLS) - стандарт PostgreSQL
- ✅ Индексы и оптимизация

**Что нужно изменить:**
- Заменить `@supabase/supabase-js` на `pg` или `node-postgres`
- Переписать репозитории для работы с новым драйвером
- Адаптировать маппинг данных (сейчас зависит от формата Supabase)

---

### 2. ⚠️ Аутентификация (критическая зависимость)

**Текущая реализация:**
```typescript
// middleware.ts
const supabase = createServerClient(...)
const { data: { user } } = await supabase.auth.getUser()

// RLS политики
WHERE auth.uid() = uc.id  -- ❌ Специфично для Supabase
```

**Проблемы:**
1. **Supabase Auth** - полностью управляет пользователями в отдельной схеме `auth`
2. **JWT токены** - Supabase генерирует специальные токены
3. **`auth.uid()`** - функция PostgreSQL, которую предоставляет Supabase
4. **Управление сессиями** - через cookies и Supabase SDK

**Что потребуется:**
- ✅ Внедрить собственный Auth сервис (NextAuth.js, Lucia, Clerk и т.д.)
- ✅ Переписать всю логику аутентификации (login, signup, session)
- ✅ Изменить middleware для работы с новым Auth
- ⚠️ **Переписать ВСЕ RLS политики** (это самое болезненное)

**Пример текущей RLS политики:**
```sql
CREATE POLICY "control_measures_select_policy" ON control_measures
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND auth.uid() = uc.id  -- ❌ Не будет работать
    )
  );
```

**Как нужно будет переделать:**

**Вариант 1: RLS с SET LOCAL (проще)**
```sql
-- Перед каждым запросом
SET LOCAL app.current_user_id = 'user-uuid';

-- В RLS политике
USING (
  EXISTS (
    SELECT 1 FROM users uc
    WHERE control_measures.tenant_id = uc.tenant_id
    AND current_setting('app.current_user_id')::uuid = uc.id
  )
);
```

**Вариант 2: Service Role без RLS (менее безопасно, но проще)**
```typescript
// Убрать RLS, делать фильтрацию на уровне приложения
const { data } = await db
  .select()
  .from('control_measures')
  .where('tenant_id', ctx.user.tenantId)  // Фильтруем в коде
```

---

### 3. ⚠️ File Storage (средняя зависимость)

**Текущая реализация:**
```typescript
// lib/services/storage-service.ts
await supabase.storage
  .from('evidence-files')
  .upload(storagePath, file)

const { data } = await supabase.storage
  .from('evidence-files')
  .createSignedUrl(storagePath, expirySeconds)
```

**Используется:**
- Загрузка файлов
- Signed URLs для безопасного доступа
- RLS на уровне Storage

**Что потребуется:**
- ✅ Выбрать альтернативу: S3, MinIO, локальное хранилище
- ✅ Переписать `StorageService`
- ✅ Настроить генерацию signed URLs (можно через S3 presigned URLs)
- ⚠️ Мигрировать существующие файлы

**Рекомендуемые решения:**
1. **AWS S3** - если идёте в облако
2. **MinIO** - self-hosted S3-совместимое решение
3. **Локальная файловая система** + nginx для отдачи файлов

---

### 4. ✅ RPC функции (минимальная зависимость)

**Используются:**
```typescript
// Вызов PostgreSQL функций через Supabase RPC
await ctx.db.supabase.rpc('calculate_measure_completion', { 
  p_measure_id: measureId 
})

await ctx.db.supabase.rpc('get_subordinate_organizations', {
  org_id: rootId
})
```

**Что потребуется:**
- ✅ Сами функции стандартные PostgreSQL - работают как есть
- ✅ Просто заменить вызов: `SELECT * FROM calculate_measure_completion($1)`
- ✅ Или использовать `pg` драйвер напрямую

---

### 5. ✅ Real-time (не используется)

**Отлично!** Вы не используете Supabase Realtime (подписки, channels), это упрощает миграцию.

---

## 🛠️ План миграции

### Этап 1: Подготовка (1-2 недели)

1. **Выбор технологий:**
   - Auth: NextAuth.js, Lucia или самописный JWT
   - Database: `node-postgres` (`pg`) или `Drizzle ORM`
   - Storage: S3/MinIO/Cloudflare R2
   - Session: Redis или `next-auth` sessions

2. **Настройка инфраструктуры:**
   - Развернуть PostgreSQL (AWS RDS, Google Cloud SQL, или self-hosted)
   - Настроить хранилище файлов
   - Настроить Redis для сессий

### Этап 2: Миграция данных (1 неделя)

1. **Экспорт схемы:**
   ```bash
   # Экспортировать структуру из Supabase
   pg_dump -h supabase-host -U postgres --schema-only > schema.sql
   ```

2. **Очистка схемы:**
   - Удалить Supabase-специфичные расширения
   - Заменить `auth.uid()` в RLS политиках
   - Удалить схему `auth.*` (или адаптировать)

3. **Экспорт данных:**
   ```bash
   # Экспорт данных (без auth схемы)
   pg_dump -h supabase-host -U postgres --data-only --exclude-schema=auth > data.sql
   ```

4. **Миграция файлов:**
   - Скачать все файлы из Supabase Storage
   - Загрузить в новое хранилище
   - Обновить URLs в БД

### Этап 3: Переписать Auth (2-3 недели)

**Вариант A: NextAuth.js (рекомендуется)**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await db
          .select()
          .from('users')
          .where('email', credentials.email)
          .first()
        
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return {
            id: user.id,
            email: user.email,
            tenantId: user.tenant_id,
            organizationId: user.organization_id,
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      session.user.tenantId = token.tenantId
      session.user.organizationId = token.organizationId
      return session
    }
  }
}

export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
```

**Middleware:**
```typescript
// middleware.ts
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
  
  return NextResponse.next()
}
```

### Этап 4: Переписать RLS политики (1-2 недели)

**Новый подход:**

```typescript
// В каждом API route перед запросами
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  // Установить контекст для RLS
  await db.query(`SET LOCAL app.current_user_id = $1`, [session.user.id])
  await db.query(`SET LOCAL app.current_tenant_id = $1`, [session.user.tenantId])
  
  // Теперь RLS политики будут работать
  const data = await db.select().from('control_measures')
}
```

**Обновить все RLS политики:**

```sql
-- Было
WHERE auth.uid() = uc.id

-- Стало
WHERE current_setting('app.current_user_id', true)::uuid = uc.id
```

### Этап 5: Переписать Database Provider (2-3 недели)

```typescript
// providers/postgres-provider.ts
import { Pool } from 'pg'

export class PostgresDatabaseProvider implements DatabaseProvider {
  private pool: Pool
  
  constructor(tenantId?: string) {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    })
    this.tenantId = tenantId
  }
  
  // Переписать все репозитории для работы с pg
}
```

**Или использовать ORM:**

```typescript
// Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres'

export class DrizzleDatabaseProvider implements DatabaseProvider {
  private db = drizzle(pool)
  
  organizations = {
    findMany: async (filters) => {
      return this.db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.tenantId, this.tenantId))
    }
  }
}
```

### Этап 6: Переписать Storage Service (1 неделя)

```typescript
// lib/services/storage-service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class StorageService {
  private static s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  })
  
  static async uploadFile(ctx: ExecutionContext, options: UploadFileOptions) {
    const buffer = await options.file.arrayBuffer()
    
    await this.s3.send(new PutObjectCommand({
      Bucket: 'evidence-files',
      Key: storagePath,
      Body: Buffer.from(buffer),
    }))
    
    // Создать signed URL
    const signedUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: 'evidence-files', Key: storagePath }),
      { expiresIn: 3600 }
    )
    
    return { fileUrl: signedUrl, ... }
  }
}
```

### Этап 7: Тестирование (2-3 недели)

1. Unit тесты для новых провайдеров
2. Интеграционные тесты с тестовой БД
3. E2E тесты всех критических флоу
4. Load testing для проверки производительности

### Этап 8: Развертывание

1. **Soft launch:**
   - Развернуть на staging
   - Протестировать с реальными данными
   
2. **Миграция пользователей:**
   - Экспортировать хеши паролей из Supabase
   - Импортировать в новую систему
   - Отправить письма для сброса паролей (опционально)

3. **Production:**
   - Миграция данных в режиме maintenance
   - Переключение DNS/роутинга
   - Мониторинг

---

## 💰 Оценка трудозатрат

| Этап | Сложность | Время |
|------|-----------|-------|
| Подготовка инфраструктуры | Низкая | 1-2 недели |
| Миграция данных | Средняя | 1 неделя |
| Переписать Auth | Высокая | 2-3 недели |
| Переписать RLS | Высокая | 1-2 недели |
| Переписать Database Provider | Средняя | 2-3 недели |
| Переписать Storage | Низкая | 1 неделя |
| Тестирование | Средняя | 2-3 недели |
| **ИТОГО** | - | **10-17 недель** (2.5-4 месяца) |

**Команда:**
- 1 Backend разработчик (full-time)
- 1 DevOps инженер (part-time)
- 1 QA инженер (part-time на этапе тестирования)

---

## 🎯 Рекомендации

### Вариант 1: Полная миграция (если критично)

**Плюсы:**
- ✅ Полный контроль над инфраструктурой
- ✅ Нет vendor lock-in
- ✅ Возможность оптимизации под ваши нужды
- ✅ Снижение затрат в долгосрочной перспективе (при больших объёмах)

**Минусы:**
- ❌ Высокие трудозатраты (2.5-4 месяца)
- ❌ Риски при миграции
- ❌ Нужна поддержка инфраструктуры

### Вариант 2: Гибридный подход (рекомендуется)

Сохранить Supabase Auth, но перенести данные:

**Что делаем:**
- ✅ Переносим БД на обычный PostgreSQL
- ✅ Оставляем Supabase только для Auth
- ✅ Переносим Storage на S3

**Плюсы:**
- ✅ Меньше трудозатрат (1-2 месяца)
- ✅ Не нужно переписывать RLS политики (можно использовать Supabase client только для auth)
- ✅ Снижение costs на БД и Storage

**Как это работает:**
```typescript
// Два клиента
const supabaseAuth = createClient()  // Только для auth
const postgres = new Pool()          // Основная БД

// В middleware
const { data: { user } } = await supabaseAuth.auth.getUser()

// В запросах
await postgres.query(
  `SET LOCAL app.current_user_id = $1`,
  [user.id]
)
```

### Вариант 3: Остаться на Supabase

Если нет критичных причин мигрировать:

**Альтернатива self-hosted:**
- ✅ Supabase можно развернуть self-hosted (Docker compose)
- ✅ Это даёт контроль, но сохраняет экосистему
- ✅ Относительно простая миграция

---

## 🚨 Главные риски

1. **RLS политики** - самое болезненное место
   - 49+ SQL файлов с триггерами и функциями
   - Везде используется `auth.uid()`
   - Потребуется полная ревизия

2. **Аутентификация** - критичная система
   - Риск потерять доступ пользователей
   - Нужна миграция паролей
   - Сессии нужно инвалидировать

3. **Storage** - миграция файлов
   - Нужно скачать и загрузить все файлы
   - Обновить URLs в БД
   - Обеспечить zero-downtime

4. **Тестирование** - полная регрессия
   - Нужно протестировать ВСЕ функции
   - Auth flow особенно критичен
   - RLS должен работать корректно

---

## ✅ Что делать дальше?

### Шаг 1: Определить причину миграции

Зачем вам нужна миграция?
- 💰 Снижение costs?
- 🔒 Compliance требования?
- 🎯 Больше контроля?
- 📈 Масштабирование?

### Шаг 2: Выбрать стратегию

Рекомендую **Вариант 2 (Гибридный)** как компромисс между трудозатратами и результатом.

### Шаг 3: POC (Proof of Concept)

Прежде чем начинать полную миграцию:
1. Создать тестовую БД на обычном PostgreSQL
2. Мигрировать 1-2 таблицы
3. Переписать 1-2 API endpoint
4. Протестировать RLS политики
5. Оценить реальные трудозатраты

### Шаг 4: Принять решение

После POC будет понятно:
- Реальная сложность миграции
- Подводные камни для вашего проекта
- Точные трудозатраты

---

## 📝 Заключение

**Миграция технически возможна**, благодаря вашей провайдерной архитектуре. Но это **не тривиальная задача**.

**Основные сложности:**
1. ⚠️ Аутентификация и RLS (70% трудозатрат)
2. ⚠️ Миграция файлов и данных (20% трудозатрат)
3. ✅ Database провайдеры (10% трудозатрат)

**Мой совет:**
- Если нет критичной необходимости - оставайтесь на Supabase
- Если есть - начните с POC для оценки рисков
- Рассмотрите гибридный подход (Supabase Auth + обычный PostgreSQL)

Готов помочь с любым из этих вариантов! 🚀

