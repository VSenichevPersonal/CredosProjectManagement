# Stage 11 Documentation (Legacy)

> **⚠️ Устаревшая документация**  
> Эта документация относится к Stage 11 и сохранена для исторических целей.  
> Актуальная документация находится в [docs/stage-13/](../../stage-13/)

## Содержание

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура Stage 11
- [API_REFERENCE.md](./API_REFERENCE.md) - Справочник API
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Руководство разработчика
- [ADMIN_DICTIONARIES.md](./ADMIN_DICTIONARIES.md) - Административные справочники
- [COMPLIANCE_MODES.md](./COMPLIANCE_MODES.md) - Режимы комплаенса

## Основные изменения в Stage 11

### Режимы исполнения требований
- Strict (строгий) режим - только предложенные шаблоны
- Flexible (гибкий) режим - свободное создание мер

### Новые сущности
- EvidenceType - типы доказательств
- ControlMeasureTemplate - шаблоны мер контроля
- ControlMeasure - меры контроля

### Архитектурные улучшения
- ExecutionContext Pattern
- Provider Pattern
- Domain-Driven Design

## Миграция на Stage 13

См. [Migration Guide](../../stage-13/README.md#migration-from-stage-11)
