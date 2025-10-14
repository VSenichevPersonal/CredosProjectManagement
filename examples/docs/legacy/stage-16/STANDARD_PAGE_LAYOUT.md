# Стандартный Layout для страниц-списков

**Дата:** 12 октября 2025  
**Принцип:** One Source of Truth - никаких дублей!

---

## ✅ Правило: Страница только загружает данные

### ❌ НЕПРАВИЛЬНО (старый подход):

```typescript
export default function MyPage() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState({})
  const [page, setPage] = useState(1)
  
  return (
    <div>
      {/* Дублирование #1: Header */}
      <h1>Заголовок</h1>
      <p>Описание</p>
      
      {/* Дублирование #2: Search */}
      <Input placeholder="Поиск..." value={search} />
      
      {/* Дублирование #3: Filters */}
      <Select>...</Select>
      
      {/* Дублирование #4: Table с своим header */}
      <MyTable data={data} />
      
      {/* Дублирование #5: Pagination */}
      <Pagination page={page} />
    </div>
  )
}
```

**Проблема:** Всё дублируется в MyTable (который использует UniversalDataTable)!

---

### ✅ ПРАВИЛЬНО (новый подход):

```typescript
export default function MyPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    const response = await fetch("/api/my-data")
    const json = await response.json()
    setData(json.data)
    setLoading(false)
  }
  
  return (
    <div>
      {/* Компонент (UniversalDataTable) делает ВСЁ */}
      <MyTable data={data} isLoading={loading} />
    </div>
  )
}
```

**Преимущества:**
- ✅ Нет дублирования
- ✅ Компонент reusable
- ✅ Меньше кода
- ✅ Единообразный UX

---

## 📋 Стандартный паттерн

### Для страниц со стандартными таблицами:

```typescript
// app/(dashboard)/my-section/page.tsx
"use client"

import { useState, useEffect } from "react"
import { MyTable } from "@/components/my-section/my-table"  // Uses UniversalDataTable

export default function MyPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchItems()
  }, [])
  
  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/my-items")
      const data = await response.json()
      setItems(data.data || [])
    } catch (error) {
      console.error("Failed to fetch:", error)
    } finally {
      setLoading(false)
    }
  }
  
  return <MyTable items={items} isLoading={loading} />
}
```

**Итого:** ~15 строк вместо ~200!

---

### Для страниц с Reference Book Layout:

```typescript
// app/(dashboard)/my-reference/page.tsx
import { Suspense } from "react"
import { MyReferenceLibrary } from "@/components/my-reference/library"

export default function MyReferencePage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <MyReferenceLibrary />  {/* Uses ReferenceBookLayout */}
    </Suspense>
  )
}
```

**Итого:** ~10 строк!

---

## 🎯 Миграция существующих страниц

### Checklist для каждой страницы:

- [ ] Убрать дублирующийся `<h1>` и `<p>` (есть в компоненте)
- [ ] Убрать дублирующийся `<Input>` поиск (есть в UniversalDataTable)
- [ ] Убрать дублирующиеся `<Select>` фильтры (есть в UniversalDataTable)
- [ ] Убрать дублирующуюся пагинацию (есть в UniversalDataTable)
- [ ] Убрать дублирующиеся кнопки импорт/экспорт (есть в UniversalDataTable)
- [ ] Оставить только: `fetchData()` и `<Component data={data} />`

---

## ✅ Мигрированные страницы

1. ✅ `/compliance` - убрано 150+ строк
2. ✅ `/requirements` - убрано 160+ строк
3. ✅ `/admin/audit` - убрано 210+ строк
4. ✅ `/control-templates` - убрано 5 строк

**Итого убрано:** ~530 строк дублирующегося кода! 🎉

---

## 📝 Остальные страницы для проверки

### Высокий приоритет:
- [ ] `/organizations` - проверить
- [ ] `/users` - проверить
- [ ] `/documents` - проверить
- [ ] `/evidence` - проверить

### Средний приоритет:
- [ ] `/admin/dictionaries/*` - все справочники
- [ ] `/reports` - проверить
- [ ] `/analytics` - проверить

### Низкий приоритет (специфичные):
- [ ] `/heatmap` - специальный view
- [ ] `/dashboard` - кастомный layout
- [ ] `/my-*` - персональные страницы

---

## 🏗️ Два типа компонентов

### 1. UniversalDataTable (для списков с таблицей)

```typescript
<UniversalDataTable
  title="Заголовок"           // Показывает header
  description="Описание"      // Показывает description
  data={items}
  columns={COLUMNS}
  searchPlaceholder="..."     // Показывает search
  exportFilename="data"       // Показывает export button
  storageKey="my-table"       // Сохраняет настройки
/>
```

**Включает:**
- ✅ Header (title + description)
- ✅ Search bar
- ✅ Column visibility toggle
- ✅ Import/Export buttons
- ✅ Table
- ✅ Pagination

### 2. ReferenceBookLayout (для справочников)

```typescript
<ReferenceBookLayout
  title="Заголовок"
  description="Описание"
  searchPlaceholder="..."
  viewMode={viewMode}         // Cards или Table
  columns={COLUMNS}
  visibleColumns={visible}
>
  {viewMode === "cards" ? <Cards /> : <Table />}
</ReferenceBookLayout>
```

**Включает:**
- ✅ Header
- ✅ Search
- ✅ Filters (custom)
- ✅ View toggle (cards/table)
- ✅ Column visibility
- ✅ Statistics (optional)

---

## 📊 Результаты стандартизации

### До:
```
30 страниц × ~200 строк = ~6000 строк
Каждая страница: header + search + filters + pagination
```

### После:
```
30 страниц × ~15 строк = ~450 строк
Каждая страница: только fetchData() + <Component />

Экономия: ~5500 строк! 🎯
```

---

## 🎓 Best Practices

1. **Страница = Data Fetching**
   - Только загрузка данных
   - Только передача props в компонент

2. **Компонент = UI + Logic**
   - Вся логика отображения
   - Вся логика взаимодействия
   - Reusable

3. **No Duplication**
   - Header только в компоненте
   - Search только в компоненте
   - Pagination только в компоненте

4. **Single Responsibility**
   - Page: fetch data
   - Component: render UI

---

**Автор:** AI Assistant (Product Owner + UI Engineer)

