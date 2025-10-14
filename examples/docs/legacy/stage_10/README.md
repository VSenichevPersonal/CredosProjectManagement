# Stage 10 Documentation (Legacy)

> **⚠️ Устаревшая документация**  
> Эта документация относится к Stage 10 и сохранена для исторических целей.  
> Актуальная документация находится в [docs/stage-13/](../../stage-13/)

## Содержание

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура Stage 10
- [API_INDEX.md](./API_INDEX.md) - Индекс API endpoints
- [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md) - Индекс компонентов
- [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) - Онбординг разработчика
- [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md) - Мультитенантная архитектура
- [COMPLIANCE_MODES_GUIDE.md](./COMPLIANCE_MODES_GUIDE.md) - Руководство по режимам комплаенса

## Основные возможности Stage 10

### Мультитенантность
- Изоляция данных по tenant_id
- Иерархия организаций
- RBAC система

### Основные модули
- Управление требованиями
- Управление комплаенсом
- Управление доказательствами
- Управление организациями
- Административная панель

## История изменений

- **Stage 9 → Stage 10**: Добавлена мультитенантность, RBAC
- **Stage 10 → Stage 11**: Режимы исполнения, шаблоны мер контроля
- **Stage 11 → Stage 13**: Supabase refactoring, repository pattern

## Миграция на Stage 13

См. [Migration Guide](../../stage-13/README.md)
