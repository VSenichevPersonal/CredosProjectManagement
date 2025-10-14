# 🔌 API Reference

## 📋 Обзор

**Base URL**: `https://your-app.railway.app/api`  
**Content-Type**: `application/json`  
**Authentication**: Bearer Token (планируется)

---

## 🎯 Общие принципы

### 1. RESTful API
- **GET** - получение данных
- **POST** - создание ресурсов
- **PATCH** - обновление ресурсов
- **DELETE** - удаление ресурсов

### 2. Стандартные коды ответов
- `200` - OK (успешный запрос)
- `201` - Created (ресурс создан)
- `400` - Bad Request (ошибка валидации)
- `401` - Unauthorized (требуется авторизация)
- `403` - Forbidden (недостаточно прав)
- `404` - Not Found (ресурс не найден)
- `500` - Internal Server Error (внутренняя ошибка)

### 3. Формат ответов
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasNext": true
  },
  "error": null
}
```

---

## 👥 Employees API

### GET /api/employees
Получить список сотрудников

**Параметры запроса**:
- `directionId` (string, optional) - фильтр по направлению
- `isActive` (boolean, optional) - фильтр по активности
- `search` (string, optional) - поиск по имени/email
- `page` (number, optional) - номер страницы (по умолчанию 1)
- `limit` (number, optional) - количество записей (по умолчанию 20)

**Пример запроса**:
```bash
GET /api/employees?directionId=123&isActive=true&search=Иванов&page=1&limit=10
```

**Пример ответа**:
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "ivanov@credos.ru",
      "fullName": "Иванов И.И.",
      "position": "Специалист по ИБ",
      "directionId": "uuid",
      "direction": {
        "id": "uuid",
        "name": "Информационная безопасность"
      },
      "managerId": "uuid",
      "manager": {
        "id": "uuid",
        "fullName": "Петров П.П."
      },
      "hourlyRate": 3000,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "hasNext": false
  }
}
```

### POST /api/employees
Создать нового сотрудника

**Тело запроса**:
```json
{
  "email": "new@credos.ru",
  "fullName": "Новый Сотрудник",
  "position": "Разработчик",
  "directionId": "uuid",
  "managerId": "uuid",
  "hourlyRate": 2500
}
```

**Пример ответа**:
```json
{
  "data": {
    "id": "uuid",
    "email": "new@credos.ru",
    "fullName": "Новый Сотрудник",
    "position": "Разработчик",
    "directionId": "uuid",
    "managerId": "uuid",
    "hourlyRate": 2500,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### GET /api/employees/[id]
Получить сотрудника по ID

**Пример ответа**:
```json
{
  "data": {
    "id": "uuid",
    "email": "ivanov@credos.ru",
    "fullName": "Иванов И.И.",
    "position": "Специалист по ИБ",
    "directionId": "uuid",
    "managerId": "uuid",
    "hourlyRate": 3000,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### PATCH /api/employees/[id]
Обновить сотрудника

**Тело запроса**:
```json
{
  "fullName": "Иванов И.И. (обновлено)",
  "hourlyRate": 3200,
  "isActive": true
}
```

### DELETE /api/employees/[id]
Удалить сотрудника (soft delete)

**Пример ответа**:
```json
{
  "data": {
    "success": true,
    "message": "Сотрудник успешно удален"
  }
}
```

---

## 🏢 Directions API

### GET /api/directions
Получить список направлений

**Параметры запроса**:
- `isActive` (boolean, optional) - фильтр по активности
- `search` (string, optional) - поиск по названию

**Пример ответа**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Информационная безопасность",
      "description": "Направление ИБ",
      "managerId": "uuid",
      "manager": {
        "id": "uuid",
        "fullName": "Петров П.П."
      },
      "budget": 1000000,
      "color": "blue",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/directions
Создать новое направление

**Тело запроса**:
```json
{
  "name": "Новое направление",
  "description": "Описание направления",
  "managerId": "uuid",
  "budget": 500000,
  "color": "green"
}
```

---

## 📋 Projects API

### GET /api/projects
Получить список проектов

**Параметры запроса**:
- `directionId` (string, optional) - фильтр по направлению
- `managerId` (string, optional) - фильтр по менеджеру
- `status` (string, optional) - фильтр по статусу
- `priority` (string, optional) - фильтр по приоритету
- `dateFrom` (string, optional) - фильтр по дате начала (YYYY-MM-DD)
- `dateTo` (string, optional) - фильтр по дате окончания (YYYY-MM-DD)
- `page` (number, optional) - номер страницы
- `limit` (number, optional) - количество записей

**Пример ответа**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Внедрение СЭД",
      "description": "Внедрение системы электронного документооборота",
      "directionId": "uuid",
      "direction": {
        "id": "uuid",
        "name": "Информационная безопасность"
      },
      "managerId": "uuid",
      "manager": {
        "id": "uuid",
        "fullName": "Петров П.П."
      },
      "status": "active",
      "priority": "high",
      "startDate": "2024-01-01",
      "endDate": "2024-06-30",
      "budget": 500000,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/projects
Создать новый проект

**Тело запроса**:
```json
{
  "name": "Новый проект",
  "description": "Описание проекта",
  "directionId": "uuid",
  "managerId": "uuid",
  "priority": "medium",
  "startDate": "2024-02-01",
  "endDate": "2024-08-31",
  "budget": 300000
}
```

---

## 📝 Tasks API

### GET /api/tasks
Получить список задач

**Параметры запроса**:
- `projectId` (string, optional) - фильтр по проекту
- `assigneeId` (string, optional) - фильтр по исполнителю
- `status` (string, optional) - фильтр по статусу
- `priority` (string, optional) - фильтр по приоритету
- `dueDateFrom` (string, optional) - фильтр по сроку (от)
- `dueDateTo` (string, optional) - фильтр по сроку (до)

**Пример ответа**:
```json
{
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "project": {
        "id": "uuid",
        "name": "Внедрение СЭД"
      },
      "name": "Анализ требований",
      "description": "Проведение анализа требований к СЭД",
      "assigneeId": "uuid",
      "assignee": {
        "id": "uuid",
        "fullName": "Иванов И.И."
      },
      "status": "in_progress",
      "priority": "high",
      "estimatedHours": 40,
      "actualHours": 25,
      "dueDate": "2024-02-01",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/tasks
Создать новую задачу

**Тело запроса**:
```json
{
  "projectId": "uuid",
  "name": "Новая задача",
  "description": "Описание задачи",
  "assigneeId": "uuid",
  "priority": "medium",
  "estimatedHours": 20,
  "dueDate": "2024-02-15"
}
```

---

## ⏰ Time Entries API

### GET /api/time-entries
Получить список записей времени

**Параметры запроса**:
- `employeeId` (string, optional) - фильтр по сотруднику
- `projectId` (string, optional) - фильтр по проекту
- `taskId` (string, optional) - фильтр по задаче
- `dateFrom` (string, optional) - фильтр по дате (от) (YYYY-MM-DD)
- `dateTo` (string, optional) - фильтр по дате (до) (YYYY-MM-DD)
- `status` (string, optional) - фильтр по статусу
- `billable` (boolean, optional) - фильтр по биллябельности
- `page` (number, optional) - номер страницы
- `limit` (number, optional) - количество записей

**Пример ответа**:
```json
{
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employee": {
        "id": "uuid",
        "fullName": "Иванов И.И."
      },
      "projectId": "uuid",
      "project": {
        "id": "uuid",
        "name": "Внедрение СЭД"
      },
      "taskId": "uuid",
      "task": {
        "id": "uuid",
        "name": "Анализ требований"
      },
      "date": "2024-01-15",
      "hours": 8.5,
      "description": "Работа над анализом требований",
      "status": "approved",
      "billable": true,
      "approvedBy": "uuid",
      "approvedByEmployee": {
        "id": "uuid",
        "fullName": "Петров П.П."
      },
      "approvedAt": "2024-01-16T09:00:00Z",
      "rejectionReason": null,
      "createdAt": "2024-01-15T18:00:00Z",
      "updatedAt": "2024-01-16T09:00:00Z"
    }
  ]
}
```

### POST /api/time-entries
Создать новую запись времени

**Тело запроса**:
```json
{
  "employeeId": "uuid",
  "projectId": "uuid",
  "taskId": "uuid",
  "date": "2024-01-15",
  "hours": 8.5,
  "description": "Работа над задачей",
  "billable": true
}
```

**Пример ответа**:
```json
{
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "projectId": "uuid",
    "taskId": "uuid",
    "date": "2024-01-15",
    "hours": 8.5,
    "description": "Работа над задачей",
    "status": "submitted",
    "billable": true,
    "approvedBy": null,
    "approvedAt": null,
    "rejectionReason": null,
    "createdAt": "2024-01-15T18:00:00Z",
    "updatedAt": "2024-01-15T18:00:00Z"
  }
}
```

### POST /api/time-entries/bulk
Создать множество записей времени

**Тело запроса**:
```json
{
  "entries": [
    {
      "employeeId": "uuid",
      "projectId": "uuid",
      "date": "2024-01-15",
      "hours": 8,
      "description": "Работа над проектом"
    },
    {
      "employeeId": "uuid",
      "projectId": "uuid",
      "date": "2024-01-16",
      "hours": 7.5,
      "description": "Продолжение работы"
    }
  ]
}
```

### PATCH /api/time-entries/[id]
Обновить запись времени

**Тело запроса**:
```json
{
  "hours": 9,
  "description": "Обновленное описание",
  "billable": false
}
```

### DELETE /api/time-entries/[id]
Удалить запись времени

**Пример ответа**:
```json
{
  "data": {
    "success": true,
    "message": "Запись времени успешно удалена"
  }
}
```

### POST /api/time-entries/[id]/approve
Утвердить запись времени

**Тело запроса**:
```json
{
  "approved": true,
  "notes": "Запись утверждена"
}
```

### POST /api/time-entries/[id]/reject
Отклонить запись времени

**Тело запроса**:
```json
{
  "approved": false,
  "rejectionReason": "Некорректное количество часов"
}
```

---

## 📊 Dashboard API

### GET /api/dashboard/metrics
Получить метрики дашборда

**Пример ответа**:
```json
{
  "data": {
    "totalProjects": 12,
    "activeProjects": 8,
    "totalEmployees": 24,
    "totalHoursThisMonth": 1247,
    "totalHoursThisWeek": 312,
    "pendingApprovals": 5,
    "overdueTasks": 3
  }
}
```

### GET /api/dashboard/direction-metrics
Получить метрики по направлениям

**Пример ответа**:
```json
{
  "data": [
    {
      "directionId": "uuid",
      "directionName": "Информационная безопасность",
      "totalProjects": 5,
      "activeProjects": 3,
      "totalHours": 450,
      "totalBudget": 1000000,
      "utilizationRate": 75
    }
  ]
}
```

### GET /api/dashboard/employee-metrics/[employeeId]
Получить метрики по сотруднику

**Пример ответа**:
```json
{
  "data": {
    "employeeId": "uuid",
    "totalHoursThisMonth": 160,
    "totalHoursThisWeek": 40,
    "activeProjects": 2,
    "pendingTimeEntries": 1,
    "averageHoursPerDay": 8
  }
}
```

---

## 🔍 Search API

### GET /api/search
Универсальный поиск

**Параметры запроса**:
- `q` (string, required) - поисковый запрос
- `type` (string, optional) - тип поиска (employees, projects, tasks)
- `limit` (number, optional) - количество результатов

**Пример ответа**:
```json
{
  "data": {
    "employees": [
      {
        "id": "uuid",
        "fullName": "Иванов И.И.",
        "position": "Специалист по ИБ"
      }
    ],
    "projects": [
      {
        "id": "uuid",
        "name": "Внедрение СЭД",
        "status": "active"
      }
    ],
    "tasks": []
  }
}
```

---

## ❌ Обработка ошибок

### Формат ошибок
```json
{
  "error": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": {
    "field": ["Сообщение об ошибке"]
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Коды ошибок
- `VALIDATION_ERROR` - ошибка валидации данных
- `NOT_FOUND` - ресурс не найден
- `UNAUTHORIZED` - требуется авторизация
- `FORBIDDEN` - недостаточно прав
- `CONFLICT` - конфликт данных
- `INTERNAL_ERROR` - внутренняя ошибка сервера

### Примеры ошибок

#### Ошибка валидации
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "hours": ["Количество часов должно быть от 0 до 24"],
    "date": ["Неверный формат даты. Ожидается YYYY-MM-DD"]
  }
}
```

#### Ресурс не найден
```json
{
  "error": "Сотрудник не найден",
  "code": "NOT_FOUND"
}
```

#### Недостаточно прав
```json
{
  "error": "Недостаточно прав для просмотра чужих трудозатрат",
  "code": "FORBIDDEN"
}
```

---

## 🔐 Аутентификация (планируется)

### Bearer Token
```bash
Authorization: Bearer <your-jwt-token>
```

### Получение токена
```bash
POST /api/auth/login
{
  "email": "user@credos.ru",
  "password": "password"
}
```

### Обновление токена
```bash
POST /api/auth/refresh
{
  "refreshToken": "<refresh-token>"
}
```

---

## 📈 Rate Limiting (планируется)

### Лимиты
- **1000 запросов в час** для обычных пользователей
- **5000 запросов в час** для администраторов

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

*API Reference обновляется по мере развития проекта*
