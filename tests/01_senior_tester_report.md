# 🧪 Senior Тестер - Комплексное тестирование

**Дата**: 15 октября 2025  
**Тестер**: AI Senior QA Engineer  
**Версия**: 1.0 (после миграции 013)

---

## 📋 Test Plan

### Критерии приемки:
- ✅ Build проходит успешно
- ✅ Все миграции применены
- ✅ TypeScript компилируется без ошибок
- ✅ Linter не находит критичных проблем
- ✅ API endpoints отвечают корректно
- ✅ RESTRICT constraints работают
- ✅ CHECK constraints работают
- ✅ UI компоненты рендерятся

---

## 🔍 TEST SUITE 1: Build & Compile

### Test 1.1: TypeScript Compilation
**Status**: 🟡 PENDING  
**Command**: `npm run type-check`

### Test 1.2: Next.js Build
**Status**: 🟡 PENDING  
**Command**: `npm run build`

### Test 1.3: Linter Check
**Status**: 🟡 PENDING  
**Command**: `npm run lint`

---

## 🗄️ TEST SUITE 2: Database Integrity

### Test 2.1: Миграции применены
**Status**: 🟡 PENDING  
**Query**: Проверить все таблицы созданы

### Test 2.2: RESTRICT работает для employee
**Status**: 🟡 PENDING  
**Expected**: Ошибка при попытке удалить employee с time_entries

### Test 2.3: RESTRICT работает для project
**Status**: 🟡 PENDING  
**Expected**: Ошибка при попытке удалить project с time_entries

### Test 2.4: CHECK constraint для hours
**Status**: 🟡 PENDING  
**Expected**: Ошибка при hours > 24 или hours < 0

### Test 2.5: CHECK constraint для date
**Status**: 🟡 PENDING  
**Expected**: Ошибка при date > CURRENT_DATE + 7 days

---

## 🔌 TEST SUITE 3: API Endpoints

### Test 3.1: GET /api/customers
**Status**: 🟡 PENDING  
**Expected**: 200, array of customers

### Test 3.2: POST /api/customers
**Status**: 🟡 PENDING  
**Expected**: 201, created customer

### Test 3.3: GET /api/activities
**Status**: 🟡 PENDING  
**Expected**: 200, array of activities

### Test 3.4: POST /api/activities
**Status**: 🟡 PENDING  
**Expected**: 201, created activity

### Test 3.5: GET /api/tags
**Status**: 🟡 PENDING  
**Expected**: 200, array of tags

### Test 3.6: POST /api/tags
**Status**: 🟡 PENDING  
**Expected**: 201, created tag

### Test 3.7: GET /api/projects
**Status**: 🟡 PENDING  
**Expected**: 200, { data: [], total: 0 }

### Test 3.8: GET /api/tasks
**Status**: 🟡 PENDING  
**Expected**: 200, { data: [], total: 0 }

### Test 3.9: GET /api/time-entries
**Status**: 🟡 PENDING  
**Expected**: 200, { data: [], total: 0 }

---

## 🎨 TEST SUITE 4: UI Components

### Test 4.1: /admin/dictionaries renders
**Status**: 🟡 PENDING  
**Expected**: Отображение карточек справочников

### Test 4.2: /admin/dictionaries/customers renders
**Status**: 🟡 PENDING  
**Expected**: DictionaryManagementPanel с таблицей

### Test 4.3: /admin/dictionaries/activities renders
**Status**: 🟡 PENDING  
**Expected**: DictionaryManagementPanel с таблицей

### Test 4.4: /admin/dictionaries/tags renders
**Status**: 🟡 PENDING  
**Expected**: DictionaryManagementPanel с таблицей

### Test 4.5: /admin/users renders
**Status**: 🟡 PENDING  
**Expected**: UserManagementPanel

### Test 4.6: /admin/permissions renders
**Status**: 🟡 PENDING  
**Expected**: PermissionsMatrixPanel

---

## 🔐 TEST SUITE 5: Security & Permissions

### Test 5.1: Unauthorized access denied
**Status**: 🟡 PENDING  
**Expected**: 401 для неавторизованных запросов

### Test 5.2: Employee role restrictions
**Status**: 🟡 PENDING  
**Expected**: employee не может создавать справочники

### Test 5.3: Manager permissions
**Status**: 🟡 PENDING  
**Expected**: manager может создавать справочники

### Test 5.4: Admin full access
**Status**: 🟡 PENDING  
**Expected**: admin может всё

---

## 📊 RESULTS: Will be filled after execution

### Summary
- **Total Tests**: 0/29
- **Passed**: 0
- **Failed**: 0
- **Skipped**: 0
- **Blocked**: 0

### Critical Issues
- None yet

### Medium Issues
- None yet

### Minor Issues
- None yet

---

**Execution Time**: N/A  
**Environment**: Local Development  
**Node Version**: 20.x  
**PostgreSQL Version**: Latest

