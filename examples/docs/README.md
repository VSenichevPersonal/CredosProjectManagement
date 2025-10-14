# Документация проекта IB Compliance Platform

## Структура документации

### 📁 stage-16/ - 🆕 Текущая стадия разработки ✨
Актуальная документация для Stage 16 (октябрь 2025):
- **[README.md](./stage-16/README.md)** - Обзор Stage 16 и roadmap
- **[ARCHITECTURE.md](./stage-16/ARCHITECTURE.md)** - Архитектура системы
- **[CONTROL_MEASURES_TAXONOMY.md](./stage-16/CONTROL_MEASURES_TAXONOMY.md)** - Типизация мер (Drata/Vanta/ФСТЭК)
- **[TABLE_STANDARDIZATION_PLAN.md](./stage-16/TABLE_STANDARDIZATION_PLAN.md)** - Стандартизация таблиц
- **[STANDARD_PAGE_LAYOUT.md](./stage-16/STANDARD_PAGE_LAYOUT.md)** - Стандартный layout страниц
- **[UI_IMPROVEMENTS_MEASURES.md](./stage-16/UI_IMPROVEMENTS_MEASURES.md)** - Улучшения UI мер
- **[EVIDENCE_LOADING_FLOW.md](./stage-16/EVIDENCE_LOADING_FLOW.md)** - Загрузка доказательств
- **[NAVIGATION_UX_ANALYSIS.md](./stage-16/NAVIGATION_UX_ANALYSIS.md)** - Анализ навигации
- **[ADMIN_DICTIONARIES_AUDIT.md](./stage-16/ADMIN_DICTIONARIES_AUDIT.md)** - Аудит справочников
- **[ui-patterns.md](./stage-16/ui-patterns.md)** - UI паттерны и компоненты

### 📁 legacy/ - Устаревшая документация 📦
Документы из предыдущих стадий разработки:
- **[stage-14/](./legacy/stage-14/)** - Stage 14 (Continuous Compliance, октябрь 2025)
- **[stage-13/](./legacy/stage-13/)** - Stage 13 (Supabase refactoring, январь 2025)
- **[stage-11/](./legacy/stage-11/)** - Stage 11 (режимы исполнения)
- **[stage_10/](./legacy/stage_10/)** - Stage 10 (стабилизация)
- **[stage_9/](./legacy/stage_9/)** - Stage 9 (мультитенантность)
- Решённые проблемы и исторические отчёты

### 📄 README_FOR_LLM.md
Принципы разработки для LLM и разработчиков (актуальный, требует обновления для Stage 15)

---

## 🚀 Быстрый старт

**Для новых разработчиков:**
1. **Читайте:** [stage-15/README.md](stage-15/README.md) - обзор текущей версии
2. **Изучите:** [stage-15/ARCHITECTURE.md](stage-15/ARCHITECTURE.md) - архитектура
3. **Следуйте:** [README_FOR_LLM.md](README_FOR_LLM.md) - принципы разработки

**Для работы с конкретными фичами:**
- **Таблицы:** [stage-15/TABLE_STANDARDIZATION_PLAN.md](stage-15/TABLE_STANDARDIZATION_PLAN.md)
- **Страницы:** [stage-15/STANDARD_PAGE_LAYOUT.md](stage-15/STANDARD_PAGE_LAYOUT.md)
- **UI паттерны:** [stage-15/ui-patterns.md](stage-15/ui-patterns.md)
- **Меры контроля:** [stage-15/UI_IMPROVEMENTS_MEASURES.md](stage-15/UI_IMPROVEMENTS_MEASURES.md)

---

## 📅 История стадий

- **STAGE 16** (Октябрь 2025) - **ТЕКУЩАЯ** - Control Taxonomy, Advanced Features 🚀
- **STAGE 15** (12-13 октября 2025) - Enhanced UX, Table Standardization → [legacy/stage-15/](./legacy/stage-15/)
- **STAGE 14** (Октябрь 2025) - Continuous Compliance → [legacy/stage-14/](./legacy/stage-14/)
- **STAGE 13** (Январь 2025) - Supabase refactoring → [legacy/stage-13/](./legacy/stage-13/)
- **STAGE 11** (Январь 2025) - Режимы исполнения → [legacy/stage-11/](./legacy/stage-11/)
- **STAGE 10** (Январь 2025) - Стабилизация → [legacy/stage_10/](./legacy/stage_10/)
- **STAGE 9** (Декабрь 2024) - Мультитенантность → [legacy/stage_9/](./legacy/stage_9/)
- **STAGE 1-8** - Базовая функциональность и MVP

---

## 🆕 Что нового в STAGE 15

### UI/UX Улучшения
- ✅ **Card-based меры** - expandable карточки вместо таблиц
- ✅ **Inline actions** - загрузка доказательств прямо в карточке меры
- ✅ **Progress bars** - визуальный прогресс для каждой меры
- ✅ **Аналитическая вкладка "Доказательства"** - переиспользование и статистика
- ✅ **Справочник по доказательствам** - инструкции для исполнителей

### Стандартизация
- ✅ **UniversalDataTable** - универсальный компонент для всех таблиц
- ✅ **Пагинация** везде (10, 20, 50, 100, Все)
- ✅ **Сортировка** по всем колонкам
- ✅ **Настройка колонок** с сохранением
- ✅ **Resizable колонки** - изменение ширины мышкой
- ✅ **Drag-and-drop** - изменение порядка колонок
- ✅ **Расширенные фильтры** - select, date, boolean
- ✅ **Импорт/Экспорт** - CSV для всех таблиц

### Архитектура
- ✅ **One Source of Truth** - никаких дублей UI
- ✅ **Component-First** - страница = только данные
- ✅ **DRY принцип** - ~1000 строк дублей удалено
- ✅ **Batch Loading** - 3x улучшение производительности

### Чистка кода
- ✅ **Упрощённая навигация** - 20 пунктов вместо 30 (-33%)
- ✅ **Стандартный layout** - все страницы-списки ~15 строк
- ✅ **Убраны устаревшие компоненты** - verification_methods и др.

---

## Что было в STAGE 14 (архив)

### Архитектурные изменения
- ✅ **Repository Pattern** - изоляция логики доступа к данным
- ✅ **Mappers** - преобразование между БД и доменными моделями
- ✅ **Типизированные DTO** - для всех операций
- ✅ **Централизованная обработка ошибок**
- ✅ **Улучшенное логирование**

### Новая функциональность
- ✅ **Версионирование документов** - полная история изменений
- ✅ **Diff-сравнение документов** - визуальное сравнение версий
- ✅ **Анализ документов через AI** - автоматический анализ
- ✅ **Отслеживание актуальности** - контроль актуальности документов
- ✅ **Workflow одобрения доказательств** - процесс одобрения
- ✅ **Связь доказательств с контролями** - многие-ко-многим
- ✅ **Правила применимости** - динамическая оценка применимости
- ✅ **Юридические ссылки** - связь со статьями законов
- ✅ **Расширенная аналитика** - новые метрики и отчеты

### Производительность
- ✅ Оптимизированные индексы БД
- ✅ Pagination для больших списков
- ✅ Кэширование через SWR
- ✅ Ранний выход в функциях

### Безопасность
- ✅ RLS на всех таблицах
- ✅ Гранулярные права доступа (30+ permissions)
- ✅ Audit log для всех операций
- ✅ Валидация на всех уровнях

---

## Статус документации

**Последнее обновление:** Январь 2025  
**Текущая стадия:** STAGE_13  
**Статус:** Активная разработка

---

## Контакты

Для вопросов и предложений обращайтесь к команде разработки.
