# 🗄️ Руководство по управлению базой данных

## Обзор

Система управления БД предоставляет удобные инструменты для разработки и тестирования:
- ✅ **Seed Database** - заполнение тестовыми данными
- ⚠️ **Reset Database** - полная очистка БД

## 🎯 Доступ

### Через Web UI (Admin Panel)
1. Войдите как администратор
2. Перейдите в `/admin`
3. Внизу страницы находится панель "Управление базой данных"

### Через API

#### Seed Database
```bash
POST /api/admin/seed-db
Content-Type: application/json
Cookie: <admin-session>

# Ответ:
{
  "success": true,
  "message": "База данных успешно заполнена тестовыми данными",
  "stats": {
    "directions": 5,
    "employees": 10,
    "projects": 5,
    "tasks": 10,
    "timeEntries": 35
  }
}
```

#### Reset Database
```bash
POST /api/admin/reset-db
Content-Type: application/json
Cookie: <admin-session>

{
  "confirm": "УДАЛИТЬ ВСЕ ДАННЫЕ"
}

# Ответ:
{
  "success": true,
  "message": "База данных полностью очищена",
  "warning": "Все данные удалены! Для восстановления используйте seed.",
  "deletedTables": [
    "time_entries",
    "tasks",
    "projects",
    "user_roles",
    "employees",
    "directions",
    "revenue_manual",
    "salary_register"
  ]
}
```

### Через Shell Scripts

```bash
# Заполнить БД тестовыми данными
./scripts/test-seed-api.sh

# Очистить БД (с подтверждением)
./scripts/test-reset-api.sh
```

## 📊 Тестовые данные

### Seed создаёт:

**Направления (5)**
- Информационная безопасность (IB)
- Промышленная ИБ (PIB)
- Технический консалтинг (CONS)
- Аудит (AUDIT)
- Разработка (DEV)

**Сотрудники (10)**
- admin@credos.ru - Администратор Системы
- ivanov.ii@credos.ru - Руководитель направления ИБ
- petrov.pp@credos.ru - Ведущий специалист по ИБ
- sidorov.ss@credos.ru - Инженер ПИБ
- kuznetsov.ak@credos.ru - Специалист по аудиту
- И ещё 5 сотрудников...

**Проекты (5)**
- Внедрение СЭД (SED-2024)
- Аудит ИБ Банка (AUDIT-BANK)
- Настройка SIEM (SIEM-2024)
- Защита АСУ ТП (PIB-SCADA)
- Пентест веб-приложений (PENTEST-WEB)

**Задачи (10+)**
- Распределены по проектам
- Различные статусы: todo, in_progress, completed
- Различные приоритеты: low, medium, high, critical

**Time Entries (~35)**
- За последние 7 рабочих дней
- 6-8 часов в день на сотрудника
- Связаны с проектами

## ⚠️ Безопасность

### Проверки доступа
- Оба endpoint требуют роль `admin`
- Reset требует явное подтверждение через body
- Все операции логируются

### Рекомендации
- ❌ **НЕ использовать на production!**
- ✅ Использовать только на dev/staging
- ✅ Делать backup перед reset
- ✅ Проверять права доступа

## 🔧 Технические детали

### Архитектура

```
src/app/api/admin/
├── seed-db/route.ts      # API endpoint для seed
└── reset-db/route.ts     # API endpoint для reset

src/components/admin/
└── database-management-panel.tsx  # UI компонент

src/app/(dashboard)/admin/
└── page.tsx              # Админ панель
```

### Особенности seed

1. **Идемпотентность**: Безопасно запускать несколько раз
   - Использует `ON CONFLICT DO UPDATE` или `DO NOTHING`
   - Не создаёт дубликаты

2. **Порядок создания**:
   1. Directions (независимые)
   2. Employees (зависят от directions)
   3. Projects (зависят от directions, employees)
   4. Tasks (зависят от projects, employees)
   5. Time Entries (зависят от employees, projects)

3. **Realistic Data**:
   - Реальные email-адреса в формате @credos.ru
   - Осмысленные названия проектов
   - Случайное распределение времени
   - Только рабочие дни (пн-пт)

### Особенности reset

1. **Cascading Deletes**: Удаление в правильном порядке
   ```sql
   time_entries → tasks → projects → employees → directions
   ```

2. **Foreign Key Safety**: Учитывает все FK constraints

3. **Системные таблицы**: НЕ удаляет auth.user и другие системные

## 🧪 Типичные сценарии использования

### Сценарий 1: Начало разработки
```bash
# 1. Очистить БД от старых данных
./scripts/test-reset-api.sh

# 2. Заполнить свежими тестовыми данными
./scripts/test-seed-api.sh

# 3. Начать разработку с чистого листа
npm run dev
```

### Сценарий 2: Тестирование функционала
```bash
# 1. Seed даёт базовые данные
./scripts/test-seed-api.sh

# 2. Вручную добавить специфичные данные для теста
# через UI или прямые SQL запросы

# 3. Протестировать функционал

# 4. Reset для следующего теста
./scripts/test-reset-api.sh
```

### Сценарий 3: Демо для заказчика
```bash
# 1. Создать презентабельные данные
./scripts/test-seed-api.sh

# 2. Провести демо

# 3. После демо - очистить
./scripts/test-reset-api.sh
```

## 📝 Логирование

Все операции логируются через ExecutionContext:

```typescript
ctx.logger.info('[Admin] Seed DB request')
ctx.logger.warn('[Admin] Reset DB request - DANGEROUS OPERATION')
ctx.logger.info('[Admin] Created 10 employees')
```

## 🐛 Troubleshooting

### Ошибка: "Доступ запрещён"
- Убедитесь, что вошли как admin
- Проверьте роль в таблице `user_roles`

### Ошибка: "Требуется подтверждение операции"
- Для reset нужно отправить `{"confirm": "УДАЛИТЬ ВСЕ ДАННЫЕ"}`

### Ошибка: Foreign key constraint
- Reset удаляет в правильном порядке
- Если ошибка - проверьте новые таблицы с FK

### Seed не создаёт данные
- Возможно данные уже существуют (ON CONFLICT)
- Проверьте логи в консоли

## 🚀 Следующие шаги

### Возможные улучшения:
1. ✨ Добавить разные seed profiles (small/medium/large)
2. ✨ Экспорт/импорт snapshot'ов БД
3. ✨ Partial reset (только определённые таблицы)
4. ✨ Seed с параметрами (количество сотрудников, проектов и т.д.)
5. ✨ UI для просмотра статистики БД

---

**Автор:** AI Assistant  
**Дата:** 2024  
**Версия:** 1.0

