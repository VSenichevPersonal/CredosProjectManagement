# План стандартизации табличных представлений

**Дата:** 12 октября 2025  
**Роль:** Product Owner + UI Engineer + Architect  
**Цель:** Единообразный UX для всех табличных представлений

---

## 📋 Текущее состояние

### Существующие компоненты

| Компонент | Пагинация | Сортировка | Колонки | Импорт/Экспорт | Статус |
|-----------|-----------|------------|---------|----------------|--------|
| `AdminDataTable` | ✅ | ✅ | ❌ | ❌ | **Эталонный** |
| `ComplianceTable` | ❌ | ✅ | ❌ | ❌ | Требует доработки |
| `RequirementsTable` | ❌ | ✅ | ❌ | ❌ | Требует доработки |
| `UsersTable` | ❌ | ❌ | ❌ | ❌ | Требует доработки |
| `AuditLogTable` | ❌ | ❌ | ❌ | ❌ | Требует доработки |
| `LegalArticlesTable` | ❌ | ❌ | ❌ | ❌ | Требует доработки |
| `EvidenceLinksTable` | ❌ | ❌ | ❌ | ❌ | Требует доработки |
| `PendingReviewTable` | ❌ | ❌ | ❌ | ❌ | Требует доработки |

**Вывод:** Только `AdminDataTable` имеет полноценный функционал!

---

## 📚 Стандарты из документации

### Из `docs/stage-14/reference-book-pattern.md`

**Обязательные фичи:**

1. **✅ Пагинация**
   - Выбор количества элементов на странице (10, 20, 50, 100, Все)
   - Навигация по страницам
   - Отображение "X-Y из Z элементов"

2. **✅ Сортировка**
   - По всем колонкам (где имеет смысл)
   - Двунаправленная (asc/desc)
   - Визуальный индикатор (стрелки)

3. **✅ Настройка колонок**
   - Показать/скрыть колонки
   - Сохранение настроек в localStorage
   - Колонки по умолчанию

4. **✅ Импорт/Экспорт**
   - Экспорт в CSV/Excel
   - Импорт из файла
   - Импорт из буфера обмена
   - Компонент: `TableImportExportButtons`

5. **✅ Поиск**
   - Global search по всем полям
   - Debounced input
   - Сброс пагинации при поиске

6. **✅ Фильтры**
   - По статусу, типу, категории и т.д.
   - Чипсы активных фильтров
   - Кнопка "Сбросить фильтры"

7. **✅ Переключение вида**
   - Карточки / Таблица
   - Сохранение выбора в localStorage

---

## 🎯 Эталонный компонент: UniversalDataTable

### Архитектура

```typescript
<UniversalDataTable
  // Базовые
  title="Заголовок"
  description="Описание"
  
  // Данные
  data={items}
  columns={COLUMN_DEFINITIONS}
  isLoading={loading}
  
  // Поиск и фильтры
  searchPlaceholder="Поиск..."
  filters={<MyFilters />}
  
  // CRUD actions
  onAdd={() => setIsCreateOpen(true)}
  onEdit={(item) => setEditingItem(item)}
  onDelete={(item) => handleDelete(item.id)}
  onRowClick={(item) => router.push(`/path/${item.id}`)}
  
  // Настройка колонок (NEW!)
  visibleColumns={visibleColumns}
  onColumnVisibilityChange={handleColumnVisibility}
  
  // Импорт/Экспорт
  exportFilename="my-data"
  onImport={handleImport}
  
  // Переключение вида
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  renderCard={(item) => <MyCard item={item} />}
/>
```

### Определение колонок

```typescript
interface ColumnDefinition<T> {
  id: string                             // Уникальный ID
  label: string                          // Заголовок
  key?: keyof T                          // Ключ в объекте данных
  sortable?: boolean                     // Можно ли сортировать
  defaultVisible?: boolean               // Видима по умолчанию
  width?: string                         // Ширина колонки
  align?: "left" | "center" | "right"    // Выравнивание
  render?: (value: any, row: T) => React.ReactNode  // Кастомный рендер
  exportRender?: (value: any, row: T) => string     // Для экспорта
}

// Пример:
const COLUMNS: ColumnDefinition<Requirement>[] = [
  { 
    id: "code", 
    label: "Код", 
    key: "code",
    sortable: true,
    defaultVisible: true,
    width: "120px"
  },
  { 
    id: "title", 
    label: "Название", 
    key: "title",
    sortable: true,
    defaultVisible: true,
    render: (value, row) => (
      <div>
        <div className="font-medium">{value}</div>
        <div className="text-xs text-muted-foreground">{row.description}</div>
      </div>
    )
  },
  { 
    id: "criticality", 
    label: "Критичность", 
    key: "criticality",
    sortable: true,
    defaultVisible: true,
    render: (value) => <CriticalityBadge level={value} />
  },
  { 
    id: "created_at", 
    label: "Создано", 
    key: "createdAt",
    sortable: true,
    defaultVisible: false,  // Скрыта по умолчанию
    render: (value) => formatDate(value)
  }
]
```

---

## 🏗️ Реализация

### Phase 1: Создать базовые компоненты (2 дня)

#### 1.1 UniversalDataTable (главный компонент)

```typescript
// components/shared/universal-data-table.tsx
export function UniversalDataTable<T>({
  // Базовые пропсы
  title,
  description,
  data,
  columns,
  isLoading,
  
  // Поиск
  searchPlaceholder,
  onSearchChange,
  
  // Фильтры
  filters,
  activeFilters,
  onClearFilters,
  
  // CRUD
  onAdd,
  onEdit,
  onDelete,
  onRowClick,
  
  // Колонки
  visibleColumns,
  onColumnVisibilityChange,
  
  // Импорт/Экспорт
  exportFilename,
  onImport,
  canExport = true,
  canImport = false,
  
  // Вид
  viewMode = "table",
  onViewModeChange,
  renderCard,
  
  // Пагинация
  serverSidePagination = false,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: UniversalDataTableProps<T>) {
  // Логика пагинации, сортировки, поиска
  // ...
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <TableHeader />
      
      {/* Toolbar */}
      <TableToolbar />
      
      {/* Content (Table или Cards) */}
      {viewMode === "table" ? (
        <DataTable />
      ) : (
        <CardGrid />
      )}
      
      {/* Pagination */}
      <TablePagination />
    </div>
  )
}
```

#### 1.2 ColumnVisibilityToggle

```typescript
// components/shared/column-visibility-toggle.tsx
export function ColumnVisibilityToggle({
  columns,
  visibleColumns,
  onChange
}: ColumnVisibilityToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns className="h-4 w-4 mr-2" />
          Колонки
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Видимые колонки</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map(column => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={visibleColumns.has(column.id)}
            onCheckedChange={(checked) => onChange(column.id, checked)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### 1.3 TablePagination

```typescript
// components/shared/table-pagination.tsx
export function TablePagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Показано {startIndex}-{endIndex} из {totalItems}
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={itemsPerPage.toString()} onValueChange={onItemsPerPageChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 на странице</SelectItem>
            <SelectItem value="20">20 на странице</SelectItem>
            <SelectItem value="50">50 на странице</SelectItem>
            <SelectItem value="100">100 на странице</SelectItem>
            <SelectItem value="-1">Все</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            ««
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            «
          </Button>
          <span className="px-4 text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            »
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            »»
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

### Phase 2: Создать hooks для управления состоянием (1 день)

#### useTableState

```typescript
// hooks/use-table-state.ts
export function useTableState<T>({
  initialData,
  initialSort,
  storageKey
}: UseTableStateProps<T>) {
  // Search
  const [searchQuery, setSearchQuery] = useState("")
  
  // Sort
  const [sortColumn, setSortColumn] = useState(initialSort?.column)
  const [sortDirection, setSortDirection] = useState(initialSort?.direction || "asc")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(`${storageKey}-columns`)
      if (saved) return new Set(JSON.parse(saved))
    }
    return new Set(/* default columns */)
  })
  
  // View mode
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(`${storageKey}-view`)
      if (saved) return saved as "table" | "cards"
    }
    return "table"
  })
  
  // Auto-save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(`${storageKey}-columns`, JSON.stringify(Array.from(visibleColumns)))
      localStorage.setItem(`${storageKey}-view`, viewMode)
    }
  }, [visibleColumns, viewMode, storageKey])
  
  // Filter, sort, paginate data
  const processedData = useMemo(() => {
    let result = initialData
    
    // Search
    if (searchQuery) {
      result = result.filter(/* ... */)
    }
    
    // Sort
    if (sortColumn) {
      result = result.sort(/* ... */)
    }
    
    // Paginate
    const start = (currentPage - 1) * itemsPerPage
    const end = itemsPerPage === -1 ? result.length : start + itemsPerPage
    
    return {
      items: result.slice(start, end),
      totalItems: result.length,
      totalPages: Math.ceil(result.length / itemsPerPage)
    }
  }, [initialData, searchQuery, sortColumn, sortDirection, currentPage, itemsPerPage])
  
  return {
    // State
    searchQuery,
    sortColumn,
    sortDirection,
    currentPage,
    itemsPerPage,
    visibleColumns,
    viewMode,
    
    // Setters
    setSearchQuery,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    setItemsPerPage,
    setVisibleColumns,
    setViewMode,
    
    // Computed
    processedData,
    
    // Helpers
    handleSort: (column: string) => {/* ... */},
    handleColumnVisibility: (column: string, visible: boolean) => {/* ... */}
  }
}
```

---

## 🎨 Стандартный UI Layout

### Структура страницы справочника

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Заголовок справочника                         [+ Создать]│
│ Описание справочника                                         │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Поиск...] [⚙️ Колонки] [📥 Скачать] [📤 Загрузить]     │
│                                                              │
│ [Фильтры: Статус ▼] [Тип ▼]           [🎴 Карточки | 📋 Таблица]│
├─────────────────────────────────────────────────────────────┤
│ Статистика (опционально):                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │ Всего: 45│ │ Активных:│ │ Новых: 3 │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
├─────────────────────────────────────────────────────────────┤
│ [Активные фильтры: Статус: Активный ✕] [Очистить фильтры]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────┬──────────────────┬───────────┬─────────┐       │
│ │ Код ▲   │ Название         │ Статус    │ Действия│       │
│ ├─────────┼──────────────────┼───────────┼─────────┤       │
│ │ REQ-001 │ Требование 1     │ Активный  │   ⋮     │       │
│ │ REQ-002 │ Требование 2     │ Неактивный│   ⋮     │       │
│ └─────────┴──────────────────┴───────────┴─────────┘       │
├─────────────────────────────────────────────────────────────┤
│ Показано 1-20 из 45        [10 ▼] [« 1 / 3 »]              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Текущие таблицы и их проблемы

### 1. Compliance Table (`components/compliance/compliance-table.tsx`)

**Что есть:**
- ✅ Сортировка

**Что нужно добавить:**
- ❌ Пагинация
- ❌ Настройка колонок
- ❌ Импорт/Экспорт
- ❌ Статистика

**Проблемы:**
- Все записи в одной таблице (может быть медленно при >100 записях)
- Нет фильтра по статусу в самой таблице
- Нет индикации загрузки

### 2. Requirements Table (`components/dashboard/requirements-table.tsx`)

**Что есть:**
- ✅ Сортировка
- ✅ Базовые колонки

**Что нужно добавить:**
- ❌ Пагинация
- ❌ Настройка колонок (много колонок, некоторые не нужны)
- ❌ Импорт/Экспорт
- ❌ Global search
- ❌ Фильтры

### 3. Users Table (`components/users/users-table.tsx`)

**Что есть:**
- ✅ Базовое отображение

**Что нужно добавить:**
- ❌ Сортировка
- ❌ Пагинация
- ❌ Поиск
- ❌ Фильтры (по роли, организации, статусу)
- ❌ Экспорт списка пользователей

### 4. Audit Log Table (`components/audit/audit-log-table.tsx`)

**Что есть:**
- ✅ Базовое отображение

**Что нужно добавить:**
- ❌ Пагинация (критично! может быть тысячи записей)
- ❌ Фильтры (по дате, пользователю, действию)
- ❌ Экспорт для отчётности
- ❌ Поиск

---

## 🚀 План миграции

### Приоритет 1: Critical (1 неделя)

**Создать базовые компоненты:**
1. [ ] `UniversalDataTable` - main component
2. [ ] `ColumnVisibilityToggle` - настройка колонок
3. [ ] `TablePagination` - пагинация
4. [ ] `TableToolbar` - toolbar с поиском и фильтрами
5. [ ] `useTableState` - hook для управления состоянием

**Мигрировать критичные таблицы:**
6. [ ] `AdminDataTable` → использовать как базу для UniversalDataTable
7. [ ] `AuditLogTable` → добавить пагинацию (критично!)
8. [ ] `ComplianceTable` → добавить пагинацию

### Приоритет 2: Important (2 недели)

**Мигрировать остальные таблицы:**
9. [ ] `RequirementsTable`
10. [ ] `UsersTable`
11. [ ] `LegalArticlesTable`
12. [ ] `EvidenceLinksTable`
13. [ ] `PendingReviewTable`

**Добавить продвинутые фичи:**
14. [ ] Server-side пагинация для больших таблиц
15. [ ] Виртуализация для списков >1000 элементов
16. [ ] Advanced фильтры (диапазоны дат, множественный выбор)

### Приоритет 3: Nice to Have (1 месяц)

17. [ ] Bulk actions (выделить несколько → действие)
18. [ ] Inline editing (клик на ячейку → редактирование)
19. [ ] Column reordering (drag & drop колонок)
20. [ ] Saved views (сохранить набор фильтров+колонок)
21. [ ] Export в PDF с брендингом
22. [ ] Scheduled exports (автоматический экспорт по расписанию)

---

## 📝 Чек-лист стандартизации

Для каждого табличного представления:

### Базовые фичи
- [ ] **Пагинация** (10, 20, 50, 100, Все)
- [ ] **Сортировка** по всем релевантным колонкам
- [ ] **Поиск** (global search по всем полям)
- [ ] **Loader** при загрузке данных
- [ ] **Empty state** когда нет данных

### Продвинутые фичи
- [ ] **Настройка колонок** (показать/скрыть)
- [ ] **Сохранение настроек** в localStorage
- [ ] **Импорт** из Excel/CSV
- [ ] **Экспорт** в Excel/CSV
- [ ] **Фильтры** (статус, тип, категория и т.д.)
- [ ] **Активные фильтры** (чипсы с кнопкой очистки)

### UX
- [ ] **Клик по строке** → детальный просмотр
- [ ] **Dropdown меню** с действиями (⋮)
- [ ] **Hover эффект** на строках
- [ ] **Адаптивность** (mobile-friendly)
- [ ] **Keyboard navigation** (стрелки, Enter)

### Доступность
- [ ] **ARIA labels** для всех интерактивных элементов
- [ ] **Keyboard shortcuts** (Ctrl+F для поиска, и т.д.)
- [ ] **Screen reader** friendly
- [ ] **Focus states** видимы

---

## 🎯 Пример миграции: Compliance Table

### До

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead onClick={() => onSort("code")}>Код {SortIcon("code")}</TableHead>
      <TableHead>Организация</TableHead>
      <TableHead>Требование</TableHead>
      <TableHead>Статус</TableHead>
      <TableHead>Действия</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.code}</TableCell>
        {/* ... */}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Проблемы:**
- Нет пагинации → медленно при >100 записях
- Нет настройки колонок → нельзя скрыть ненужные
- Нет экспорта → нельзя сохранить данные
- Нет поиска в самой таблице

### После

```typescript
const COLUMNS: ColumnDefinition<Compliance>[] = [
  { id: "code", label: "Код", sortable: true, defaultVisible: true },
  { id: "organization", label: "Организация", sortable: true, defaultVisible: true },
  { id: "requirement", label: "Требование", sortable: true, defaultVisible: true },
  { id: "status", label: "Статус", sortable: true, defaultVisible: true, render: (v) => <StatusBadge status={v} /> },
  { id: "assignedTo", label: "Ответственный", sortable: true, defaultVisible: false },
  { id: "deadline", label: "Срок", sortable: true, defaultVisible: false },
  { id: "created_at", label: "Создано", sortable: true, defaultVisible: false }
]

export function ComplianceTablePage() {
  const tableState = useTableState({
    initialData: items,
    storageKey: "compliance-table"
  })
  
  return (
    <UniversalDataTable
      title="Записи соответствия"
      description="Управление записями соответствия организаций требованиям"
      
      data={tableState.processedData.items}
      columns={COLUMNS}
      
      searchPlaceholder="Поиск по коду, организации, требованию..."
      onSearchChange={tableState.setSearchQuery}
      
      visibleColumns={tableState.visibleColumns}
      onColumnVisibilityChange={tableState.handleColumnVisibility}
      
      viewMode={tableState.viewMode}
      onViewModeChange={tableState.setViewMode}
      
      currentPage={tableState.currentPage}
      totalPages={tableState.processedData.totalPages}
      itemsPerPage={tableState.itemsPerPage}
      totalItems={tableState.processedData.totalItems}
      onPageChange={tableState.setCurrentPage}
      onItemsPerPageChange={(value) => tableState.setItemsPerPage(Number(value))}
      
      exportFilename="compliance-records"
      canExport={true}
      
      onRowClick={(item) => router.push(`/compliance/${item.id}`)}
      onEdit={(item) => setEditingItem(item)}
      onDelete={(item) => handleDelete(item.id)}
      
      renderCard={(item) => <ComplianceCard item={item} />}
    />
  )
}
```

**Преимущества:**
- ✅ Все фичи из коробки
- ✅ Единообразный UX
- ✅ Персистентные настройки
- ✅ Экспорт данных
- ✅ Производительность (пагинация)

---

## 🔧 Техническая реализация

### Структура файлов

```
components/shared/
  ├── universal-data-table.tsx        # Главный компонент
  ├── column-visibility-toggle.tsx    # Настройка колонок
  ├── table-pagination.tsx            # Пагинация
  ├── table-toolbar.tsx               # Toolbar
  ├── table-view-toggle.tsx           # Переключение вида
  └── table-import-export-buttons.tsx # ✅ Уже есть!

hooks/
  ├── use-table-state.ts              # Управление состоянием
  └── use-table-filters.ts            # Управление фильтрами

types/
  └── table.ts                        # TypeScript types
      ├── ColumnDefinition
      ├── TableState
      ├── FilterDefinition
      └── PaginationState
```

---

## 📋 Roadmap по таблицам

### Week 1: Foundation

**День 1-2:** Создать базовые компоненты
- UniversalDataTable
- ColumnVisibilityToggle
- TablePagination
- useTableState hook

**День 3:** Создать документацию и примеры
- Руководство по использованию
- Примеры для разных сценариев
- Storybook stories (опционально)

**День 4-5:** Мигрировать AdminDataTable
- Использовать как reference implementation
- Протестировать все фичи

### Week 2: Critical Tables

**День 1:** AuditLogTable (критично! может быть тысячи записей)
**День 2:** ComplianceTable
**День 3:** RequirementsTable
**День 4:** UsersTable
**День 5:** Тестирование и bug fixes

### Week 3: Remaining Tables

**День 1-3:** Мигрировать остальные таблицы
- LegalArticlesTable
- EvidenceLinksTable
- PendingReviewTable
- и другие

**День 4-5:** Advanced features
- Server-side пагинация
- Виртуализация
- Bulk actions

---

## 🎨 Как Product Owner, я бы сделал так:

### Подход: "Постепенная миграция"

**НЕ делать:** Переписать все таблицы сразу

**Делать:** Пошаговая миграция с приоритизацией

**Порядок:**

1. **Создать UniversalDataTable** (2 дня)
   - Базовый компонент с ВСЕМИ фичами
   - Тестировать на AdminDataTable

2. **Мигрировать критичные** (3 дня)
   - AuditLogTable (тысячи записей!)
   - ComplianceTable (основной функционал)
   - UsersTable (часто используется)

3. **Мигрировать остальные** (5 дней)
   - По одной таблице в день
   - Тестировать после каждой миграции

4. **Добавить advanced features** (опционально)
   - Server-side пагинация
   - Bulk actions
   - Saved views

### Критерии успеха

**Must Have:**
- ✅ Все таблицы имеют пагинацию
- ✅ Все таблицы имеют сортировку
- ✅ Все таблицы имеют поиск
- ✅ Все таблицы имеют настройку колонок
- ✅ Единообразный UX

**Should Have:**
- ✅ Импорт/Экспорт для справочников
- ✅ Статистика для больших таблиц
- ✅ Фильтры для сложных данных

**Nice to Have:**
- 💡 Виртуализация для супер-больших списков
- 💡 Bulk actions
- 💡 Saved views

---

## 💰 ROI (Return on Investment)

### Зачем стандартизировать?

**Для пользователей:**
- ✅ Единообразный UX - не нужно учиться заново на каждой странице
- ✅ Быстрее находить данные - поиск и фильтры везде
- ✅ Экспорт для отчётности - важно для комплаенса

**Для разработчиков:**
- ✅ Меньше дублирования кода
- ✅ Быстрее создавать новые таблицы
- ✅ Легче поддерживать

**Для бизнеса:**
- ✅ Профессиональный вид системы
- ✅ Конкурентное преимущество
- ✅ Удовлетворённость пользователей

### Инвестиции

**Время разработки:** ~2 недели (1 разработчик)

**Выгода:**
- Экономия на будущих таблицах: ~3-5 часов на каждую
- Улучшение UX: снижение времени на поиск данных на 40%
- Снижение багов: единообразный код = меньше ошибок

---

## ✅ Хотите, чтобы я реализовал?

**Варианты:**

1. **Quick Start (1 день):**
   - Создать UniversalDataTable
   - Мигрировать AuditLogTable (критично!)

2. **Full Implementation (2 недели):**
   - Все компоненты
   - Все таблицы мигрированы
   - Документация и примеры

3. **MVP (3 дня):**
   - UniversalDataTable
   - 3 критичные таблицы (Audit, Compliance, Requirements)
   - Базовая документация

**Что выбираем?** 🚀
