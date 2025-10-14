"use client"

/**
 * Admin Page: Recommendation Rules Management
 * Управление правилами рекомендаций
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import type { RecommendationRule } from "@/types/domain/recommendation"
import { useToast } from "@/hooks/use-toast"

export default function RecommendationRulesPage() {
  const [rules, setRules] = useState<RecommendationRule[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/recommendation-rules")
      const data = await response.json()
      setRules(data.data || [])
    } catch (error) {
      console.error("[Recommendation Rules] Error fetching:", error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить правила",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (ruleId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/admin/recommendation-rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast({
        title: "Правило обновлено",
        description: `Правило ${!currentState ? "активировано" : "деактивировано"}`,
      })

      fetchRules()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить правило",
        variant: "destructive",
      })
    }
  }

  const deleteRule = async (ruleId: string, isSystemRule: boolean) => {
    if (isSystemRule) {
      toast({
        title: "Нельзя удалить",
        description: "Системные правила нельзя удалить",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Вы уверены что хотите удалить это правило?")) return

    try {
      const response = await fetch(`/api/admin/recommendation-rules/${ruleId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast({
        title: "Правило удалено",
        description: "Правило успешно удалено",
      })

      fetchRules()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить правило",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка правил...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Правила рекомендаций</h1>
          <p className="text-muted-foreground mt-2">
            Настройка правил для Executive Summary
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Создать правило
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Правила рекомендаций автоматически генерируют советы для руководства
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Системные правила засеяны автоматически. Вы можете их активировать/деактивировать,
                но не можете удалить. Создавайте кастомные правила для специфичных потребностей.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    {rule.isSystemRule && (
                      <Badge variant="outline" className="bg-blue-50">Системное</Badge>
                    )}
                    <PriorityBadge priority={rule.priority} />
                    <CategoryBadge category={rule.category} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rule.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Активно</span>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleActive(rule.id, rule.isActive)}
                    />
                  </div>
                  {!rule.isSystemRule && (
                    <>
                      <Button variant="ghost" size="icon" disabled>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule(rule.id, rule.isSystemRule)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Condition */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">📊 Условие срабатывания:</p>
                <p className="text-sm font-mono">
                  {rule.conditionField} {rule.conditionOperator} {rule.conditionValue}
                  {rule.conditionType === 'percentage' && '%'}
                </p>
              </div>

              {/* Recommendation Template */}
              <div>
                <p className="text-sm font-medium mb-2">💡 Шаблон рекомендации:</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Заголовок:</span>{' '}
                    <span className="font-medium">{rule.titleTemplate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Описание:</span>{' '}
                    <span>{rule.descriptionTemplate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Действие:</span>{' '}
                    <span>{rule.actionTemplate}</span>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {rule.deadlineDays && (
                  <div>Срок: {rule.deadlineDays} дней</div>
                )}
                {rule.estimatedBudgetMin && rule.estimatedBudgetMax && (
                  <div>
                    Бюджет: {formatNumber(rule.estimatedBudgetMin)}-{formatNumber(rule.estimatedBudgetMax)} руб.
                  </div>
                )}
                {rule.legalBasis && (
                  <div>Основание: {rule.legalBasis}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Правила не найдены</p>
            <p className="text-sm text-muted-foreground mt-2">
              Запустите seed скрипт для создания базовых правил
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper components
function PriorityBadge({ priority }: { priority: string }) {
  const config = {
    critical: { label: 'Критично', className: 'bg-red-100 text-red-800' },
    high: { label: 'Важно', className: 'bg-orange-100 text-orange-800' },
    medium: { label: 'Средне', className: 'bg-yellow-100 text-yellow-800' },
    low: { label: 'Низко', className: 'bg-blue-100 text-blue-800' },
  }

  const { label, className } = config[priority as keyof typeof config] || config.medium

  return <Badge variant="outline" className={className}>{label}</Badge>
}

function CategoryBadge({ category }: { category: string }) {
  const labels = {
    'critical_requirements': 'Критичные требования',
    'overdue': 'Просрочки',
    'missing_responsible': 'Нет ответственных',
    'evidence_coverage': 'Покрытие доказательствами',
    'regulator_performance': 'Регулятор',
    'risk_management': 'Риски',
    'compliance_process': 'Процессы',
    'documentation': 'Документация',
  }

  return (
    <Badge variant="secondary" className="text-xs">
      {labels[category as keyof typeof labels] || category}
    </Badge>
  )
}

function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU')
}

