# 📋 Задача: Интеграция Executive Summary в UI

**Дата создания:** 13 октября 2025  
**Приоритет:** HIGH  
**Статус:** 🔧 Требует реализации  
**Stage:** 16

---

## 🎯 Проблема

Executive Summary **полностью реализован**, но **не интегрирован** в UI:

### ✅ Что УЖЕ есть:

1. **Страница:** `app/(dashboard)/reports/executive-summary/page.tsx` (330 строк)
   - Красивый UI с метриками
   - Карточки рекомендаций
   - Статус по регуляторам
   - Топ-5 слабых организаций

2. **API:** `/api/reports/executive-summary/route.ts`
   - Генерация полных данных
   - Расчёт метрик
   - RecommendationsEngine
   - 165 строк рабочего кода

3. **База данных:**
   - Таблица `recommendation_rules` (8 правил засеяно)
   - RLS политики настроены
   - Seed scripts готовы

4. **Services:**
   - `services/recommendations-engine.ts` (383 строки)
   - Генерация рекомендаций на основе правил
   - Расчёт метрик из raw данных

5. **Admin UI:**
   - `app/(dashboard)/admin/recommendation-rules/page.tsx`
   - Управление правилами рекомендаций

### ❌ Что НЕ работает:

**Файл:** `app/(dashboard)/reports/page.tsx`

```tsx
// Строки 43-58
<TabsTrigger value="executive">Executive Summary</TabsTrigger>

<TabsContent value="executive" className="mt-6">
  <Card className="p-6">
    <p className="text-muted-foreground">
      Executive Summary будет доступен в следующей версии
    </p>
  </Card>
</TabsContent>
```

**Проблема:** Вкладка показывает **заглушку** вместо реального компонента!

---

## 🔧 Решение

### Вариант 1: Встроить в Tabs (рекомендуется)

**Изменить:** `app/(dashboard)/reports/page.tsx`

#### Шаг 1: Добавить импорт

```tsx
// В начало файла
import { ExecutiveSummaryReport } from "@/components/reports/executive-summary-report"
```

#### Шаг 2: Создать компонент-обёртку

**Создать:** `components/reports/executive-summary-report.tsx`

```tsx
"use client"

/**
 * Executive Summary Report Component
 * Встроенная версия для вкладки Reports
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { ExecutiveSummaryData, Recommendation } from "@/types/domain/recommendation"
import Link from "next/link"

interface ExecutiveSummaryReportProps {
  organizations: Array<{ id: string; name: string }>
}

export function ExecutiveSummaryReport({ organizations }: ExecutiveSummaryReportProps) {
  const [data, setData] = useState<ExecutiveSummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reports/executive-summary")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("[Executive Summary] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка Executive Summary...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Не удалось загрузить данные</p>
          <Button onClick={fetchData} className="mt-4">Повторить</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Executive Summary</h2>
          <p className="text-muted-foreground">
            Сводный отчёт о состоянии информационной безопасности
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Скачать PDF
          </Button>
          <Link href="/reports/executive-summary">
            <Button variant="ghost" size="sm">Полная версия</Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Общее соответствие"
          value={`${data.overallCompletionRate}%`}
          trend={data.monthlyTrend}
          description="Уровень выполнения всех требований"
          status={getStatusColor(data.overallCompletionRate)}
        />
        <MetricCard
          title="Критические требования"
          value={`${data.criticalCompletionRate}%`}
          trend={0}
          description="Выполнение критичных требований"
          status={getStatusColor(data.criticalCompletionRate)}
        />
        <MetricCard
          title="Организаций"
          value={data.totalOrganizations}
          description="Подведомственных учреждений"
        />
        <MetricCard
          title="Рекомендаций"
          value={data.recommendations.length}
          description="Требуют внимания"
          status={data.recommendations.some(r => r.priority === 'critical') ? 'critical' : 'warning'}
        />
      </div>

      {/* Regulator Status */}
      <Card>
        <CardHeader>
          <CardTitle>Статус по регуляторам</CardTitle>
          <CardDescription>Уровень выполнения требований различных регуляторов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.regulatorStatus.map((regulator) => (
            <div key={regulator.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{regulator.name}</span>
                  <StatusBadge status={regulator.status} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {regulator.requirementsCompleted} из {regulator.requirementsTotal}
                  </span>
                  <span className="font-bold text-lg w-16 text-right">
                    {regulator.completionRate}%
                  </span>
                </div>
              </div>
              <Progress value={regulator.completionRate} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Требует внимания
          </CardTitle>
          <CardDescription>Приоритетные рекомендации для руководства</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Критичных проблем не обнаружено</p>
              <p className="text-sm text-muted-foreground mt-2">
                Система соответствия работает нормально
              </p>
            </div>
          ) : (
            data.recommendations.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} compact />
            ))
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-2">
        <p>Отчёт сгенерирован {new Date().toLocaleString('ru-RU')}</p>
      </div>
    </div>
  )
}

// === Helper Components ===

interface MetricCardProps {
  title: string
  value: string | number
  trend?: number
  description?: string
  status?: 'good' | 'warning' | 'critical'
}

function MetricCard({ title, value, trend, description, status }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-4 w-4" />
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getStatusClass = () => {
    if (!status) return ""
    if (status === 'good') return "border-green-500"
    if (status === 'warning') return "border-orange-500"
    return "border-red-500"
  }

  return (
    <Card className={getStatusClass()}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">{value}</div>
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              {trend !== 0 && (
                <span className="text-sm font-medium">
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: 'good' | 'warning' | 'critical' }) {
  const config = {
    good: { label: 'Хорошо', className: 'bg-green-100 text-green-800' },
    warning: { label: 'Внимание', className: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Критично', className: 'bg-red-100 text-red-800' },
  }

  const { label, className } = config[status]

  return <Badge variant="outline" className={className}>{label}</Badge>
}

interface RecommendationCardProps {
  recommendation: Recommendation
  compact?: boolean
}

function RecommendationCard({ recommendation, compact = false }: RecommendationCardProps) {
  const priorityConfig = {
    critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'КРИТИЧНО' },
    high: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', label: 'ВАЖНО' },
    medium: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'СРЕДНИЙ' },
    low: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50', label: 'НИЗКИЙ' },
  }

  const config = priorityConfig[recommendation.priority]
  const Icon = config.icon

  return (
    <div className={`p-4 rounded-lg border ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${config.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={config.color}>{config.label}</Badge>
            <h4 className="font-semibold">{recommendation.title}</h4>
          </div>
          
          <p className="text-sm text-muted-foreground">{recommendation.description}</p>
          
          {!compact && (
            <>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm font-medium mb-1">📋 Рекомендуемые действия:</p>
                <p className="text-sm">{recommendation.action}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {recommendation.deadline && (
                  <div>
                    <span className="text-muted-foreground">Срок:</span>{' '}
                    <span className="font-medium">{recommendation.deadline}</span>
                  </div>
                )}
                {recommendation.estimatedBudget && (
                  <div>
                    <span className="text-muted-foreground">Бюджет:</span>{' '}
                    <span className="font-medium">{recommendation.estimatedBudget}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusColor(rate: number): 'good' | 'warning' | 'critical' {
  if (rate >= 80) return 'good'
  if (rate >= 60) return 'warning'
  return 'critical'
}
```

#### Шаг 3: Заменить заглушку

**Файл:** `app/(dashboard)/reports/page.tsx`

```tsx
// Было:
<TabsContent value="executive" className="mt-6">
  <Card className="p-6">
    <p className="text-muted-foreground">
      Executive Summary будет доступен в следующей версии
    </p>
  </Card>
</TabsContent>

// Стало:
<TabsContent value="executive" className="mt-6">
  <ExecutiveSummaryReport organizations={organizations || []} />
</TabsContent>
```

---

### Вариант 2: Ссылка на отдельную страницу

Если не хотите дублировать компонент:

```tsx
<TabsContent value="executive" className="mt-6">
  <Card className="p-6 text-center space-y-4">
    <div>
      <h3 className="text-xl font-semibold mb-2">Executive Summary</h3>
      <p className="text-muted-foreground">
        Сводный отчёт для руководства доступен на отдельной странице
      </p>
    </div>
    <Link href="/reports/executive-summary">
      <Button size="lg">
        Открыть Executive Summary
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  </Card>
</TabsContent>
```

---

## ✅ Чек-лист проверки

После интеграции проверить:

- [ ] Вкладка "Executive Summary" открывается
- [ ] Данные загружаются из API
- [ ] Метрики отображаются корректно
- [ ] Статус по регуляторам показывается
- [ ] Рекомендации генерируются (если есть проблемы)
- [ ] Loading state работает
- [ ] Error state работает
- [ ] Ссылка "Полная версия" ведёт на `/reports/executive-summary`
- [ ] Кнопка "Скачать PDF" (может быть заглушка)

---

## 📊 Тестовые данные

Для проверки работы рекомендаций нужны:

1. **Compliance records** со статусом `in_progress` или `non_compliant`
2. **Requirements** с `criticality = 'critical'`
3. **Organizations** с низким completion rate
4. **Evidence** с устаревшими датами
5. **Control measures** без выполнения

---

## 🔍 Возможные проблемы

### 1. API возвращает пустые данные

**Причина:** Нет данных в БД для расчёта метрик

**Решение:**
- Создать тестовые compliance records
- Засеять requirements с разными критичностями
- Добавить evidence

### 2. Recommendation rules не работают

**Причина:** Таблица `recommendation_rules` не засеяна

**Решение:**
```bash
# Запустить seed script
npm run db:seed:recommendation-rules
```

Или вручную:
```sql
-- Запустить
scripts/701_seed_recommendation_rules.sql
```

### 3. RecommendationsEngine не генерирует рекомендации

**Причина:** Метрики не соответствуют условиям правил

**Решение:**
- Проверить логи API `/api/reports/executive-summary`
- Посмотреть какие метрики расчитались
- Скорректировать пороги в rules (через Admin → Recommendation Rules)

---

## 📚 Документация

- **Executive Summary реализация:** `docs/legacy/EXECUTIVE_SUMMARY_IMPLEMENTATION.md`
- **RecommendationsEngine:** Комментарии в `services/recommendations-engine.ts`
- **API документация:** Комментарии в `app/api/reports/executive-summary/route.ts`

---

## 🎯 Итог

**Что нужно сделать:**

1. Создать `components/reports/executive-summary-report.tsx` (скопировать из задачи)
2. Импортировать в `app/(dashboard)/reports/page.tsx`
3. Заменить заглушку на `<ExecutiveSummaryReport />`
4. Проверить работу
5. Исправить баги, если есть

**Время:** 20-30 минут

**Сложность:** Низкая (copy-paste + небольшие правки)

**Приоритет:** HIGH (функционал готов, но не доступен пользователям)

---

✅ **Всё готово к реализации!**

