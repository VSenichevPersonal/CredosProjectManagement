# Reference Book Pattern (Паттерн справочников)

## Назначение

Универсальный UI паттерн для всех справочников системы с единообразным UX:
- Переключение вида (карточки/таблица)
- **Настройка видимости колонок** (NEW!)
- Поиск и фильтрация
- Пагинация
- Клик по элементу → детальный просмотр
- CRUD операции

## Компоненты

### 1. ReferenceBookLayout

Базовый layout для всех справочников.

**Пропсы:**
\`\`\`typescript
interface ReferenceBookLayoutProps {
  title: string                    // Заголовок страницы
  description: string               // Описание справочника
  searchPlaceholder?: string        // Placeholder для поиска
  onSearch: (query: string) => void // Обработчик поиска
  onCreateClick?: () => void        // Обработчик создания
  createButtonLabel?: string        // Текст кнопки создания
  viewMode: "cards" | "table"       // Текущий режим отображения
  onViewModeChange: (mode) => void  // Переключение режима
  filters?: ReactNode               // Дополнительные фильтры
  stats?: ReactNode                 // Статистика (карточки с цифрами)
  children: ReactNode               // Контент (карточки или таблица)
  // NEW: Column visibility
  columns?: ColumnDefinition[]      // Определения колонок для таблицы
  visibleColumns?: Set<string>      // Видимые колонки
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void
}
\`\`\`

**Использование:**
\`\`\`tsx
<ReferenceBookLayout
  title="Шаблоны мер защиты"
  description="Библиотека типовых шаблонов мер"
  searchPlaceholder="Поиск по коду, названию..."
  onSearch={setSearchQuery}
  onCreateClick={() => setIsCreateOpen(true)}
  createButtonLabel="Создать шаблон"
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  columns={TABLE_COLUMNS}
  visibleColumns={visibleColumns}
  onColumnVisibilityChange={handleColumnVisibilityChange}
  filters={<>...фильтры...</>}
  stats={<>...статистика...</>}
>
  {/* Карточки или таблица */}
</ReferenceBookLayout>
\`\`\`

### 2. ColumnVisibilityToggle (NEW!)

Компонент для настройки видимости колонок в табличном виде.

**Определение колонок:**
\`\`\`typescript
const TABLE_COLUMNS: ColumnDefinition[] = [
  { id: "code", label: "Код", defaultVisible: true },
  { id: "title", label: "Название", defaultVisible: true },
  { id: "type", label: "Тип", defaultVisible: true },
  { id: "category", label: "Категория", defaultVisible: false }, // Скрыта по умолчанию
]
\`\`\`

**Управление состоянием:**
\`\`\`tsx
const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
  // Загрузка из localStorage
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("my-reference-visible-columns")
    if (saved) return new Set(JSON.parse(saved))
  }
  // Колонки по умолчанию
  return new Set(TABLE_COLUMNS.filter(col => col.defaultVisible !== false).map(col => col.id))
})

// Сохранение в localStorage
useEffect(() => {
  if (typeof window !== "undefined") {
    localStorage.setItem("my-reference-visible-columns", JSON.stringify(Array.from(visibleColumns)))
  }
}, [visibleColumns])

const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
  setVisibleColumns(prev => {
    const next = new Set(prev)
    if (visible) {
      next.add(columnId)
    } else {
      next.delete(columnId)
    }
    return next
  })
}
\`\`\`

**Условный рендеринг колонок в таблице:**
\`\`\`tsx
<TableHeader>
  <TableRow>
    {visibleColumns.has("code") && <TableHead>Код</TableHead>}
    {visibleColumns.has("title") && <TableHead>Название</TableHead>}
    {visibleColumns.has("type") && <TableHead>Тип</TableHead>}
  </TableRow>
</TableHeader>
<TableBody>
  {items.map(item => (
    <TableRow key={item.id}>
      {visibleColumns.has("code") && <TableCell>{item.code}</TableCell>}
      {visibleColumns.has("title") && <TableCell>{item.title}</TableCell>}
      {visibleColumns.has("type") && <TableCell>{item.type}</TableCell>}
    </TableRow>
  ))}
</TableBody>
\`\`\`

### 3. Table View Component

Табличное представление с кликабельными строками.

**Требования:**
- Клик по строке → открытие детального просмотра
- Dropdown меню с действиями (Просмотр, Редактировать, Удалить)
- **Условный рендеринг колонок на основе visibleColumns**
- Адаптивные колонки
- Сортировка по колонкам (опционально)

**Пример:**
\`\`\`tsx
interface MyTableViewProps {
  items: MyItem[]
  onView: (item: MyItem) => void
  onEdit: (item: MyItem) => void
  onDelete: (item: MyItem) => void
  visibleColumns: Set<string> // NEW!
}

export function MyTableView({ items, onView, onEdit, onDelete, visibleColumns }: MyTableViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {visibleColumns.has("code") && <TableHead>Код</TableHead>}
          {visibleColumns.has("name") && <TableHead>Название</TableHead>}
          <TableHead className="text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onView(item)}
          >
            {visibleColumns.has("code") && <TableCell>{item.code}</TableCell>}
            {visibleColumns.has("name") && <TableCell>{item.name}</TableCell>}
            <TableCell onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>...</DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
\`\`\`

### 4. Card View Component

Карточное представление с кликабельными карточками.

**Требования:**
- Клик по карточке → открытие детального просмотра
- Dropdown меню в правом верхнем углу
- Адаптивная сетка (md:grid-cols-2 lg:grid-cols-3)
- Hover эффект

## Применение к справочникам

### Текущие справочники для миграции:

1. **Шаблоны мер** (`/control-templates`) ✅ ГОТОВО (с настройкой колонок)
2. **Виды нормативной документации** (`/admin/regulatory-document-types`)
3. **Типы организаций** (`/admin/dictionaries/organization-types`)
4. **Типы доказательств** (`/admin/dictionaries/evidence-types`)
5. **Методы проверки** (`/admin/dictionaries/verification-methods`)
6. **Периодичность** (`/admin/dictionaries/periodicities`)
7. **Регуляторы** (`/admin/dictionaries/regulators`)
8. **Категории требований** (`/admin/dictionaries/requirement-categories`)
9. **Ответственные роли** (`/admin/dictionaries/responsible-roles`)

### Чек-лист миграции:

- [ ] Обернуть в `<ReferenceBookLayout>`
- [ ] Создать Table View компонент
- [ ] **Определить колонки (ColumnDefinition[])**
- [ ] **Добавить управление видимостью колонок**
- [ ] Добавить переключатель вида
- [ ] Сделать строки/карточки кликабельными
- [ ] Добавить детальный просмотр (dialog)
- [ ] Добавить статистику (опционально)
- [ ] Добавить фильтры (опционально)

## Best Practices

1. **Консистентность:** Все справочники должны выглядеть одинаково
2. **Персистентность:** Сохранять настройки видимости колонок в localStorage с уникальным ключом для каждого справочника
3. **Производительность:** Использовать виртуализацию для больших списков
4. **Доступность:** Keyboard navigation, ARIA labels
5. **Мобильная адаптация:** На мобильных всегда показывать карточки
6. **Пагинация:** Для списков >100 элементов добавлять пагинацию
7. **Колонки по умолчанию:** Важные колонки (код, название) всегда видимы по умолчанию

## Roadmap

- [x] Создать базовый `ReferenceBookLayout`
- [x] Применить к шаблонам мер
- [x] Добавить настройку видимости колонок
- [x] Создать `ColumnVisibilityToggle` компонент
- [ ] Создать generic Table View компонент
- [ ] Создать generic Detail Dialog компонент
- [ ] Мигрировать все справочники
- [ ] Добавить пагинацию
- [ ] Добавить виртуализацию для больших списков
