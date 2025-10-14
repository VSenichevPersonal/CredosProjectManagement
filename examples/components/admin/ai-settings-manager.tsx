/**
 * @intent: Manager for AI settings
 * @llm-note: Configure AI providers for different tasks
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Settings, Save, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { AISetting, AITaskType, LLMProvider } from "@/types/domain/ai-settings"

const TASK_LABELS: Record<AITaskType, string> = {
  document_generation: "Генерация документов",
  document_analysis: "Анализ изменений",
  compliance_check: "Проверка соответствия",
  risk_assessment: "Оценка рисков",
  recommendation: "Рекомендации",
  validation: "Валидация",
  quick_analysis: "Быстрый анализ"
}

const TASK_DESCRIPTIONS: Record<AITaskType, string> = {
  document_generation: "Генерация документов из шаблонов с подстановкой данных",
  document_analysis: "Глубокий анализ изменений между версиями документов",
  compliance_check: "Проверка документа на соответствие требованиям НПА",
  risk_assessment: "Оценка рисков при изменении документа",
  recommendation: "Генерация рекомендаций по улучшению",
  validation: "Быстрая валидация полей и структуры",
  quick_analysis: "Быстрые проверки в реальном времени"
}

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  grok: "xAI Grok",
  local: "Локальная модель"
}

const MODELS_BY_PROVIDER: Record<LLMProvider, string[]> = {
  openai: ['gpt-5', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],  // GPT-5 первым!
  anthropic: ['claude-sonnet-4.5', 'claude-opus-3', 'claude-haiku-3'],
  grok: ['grok-2', 'grok-1'],
  local: ['llama-3', 'mistral-7b']
}

export function AISettingsManager() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<AISetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/ai-settings')
      const data = await response.json()
      setSettings(data.data || [])
    } catch (error) {
      console.error('Failed to fetch AI settings:', error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить настройки AI",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (settingId: string, updates: Partial<AISetting>) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/ai-settings/${settingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update')

      await fetchSettings()
      
      toast({
        title: "✅ Настройки сохранены",
        description: "AI настройки успешно обновлены"
      })
    } catch (error) {
      toast({
        title: "❌ Ошибка сохранения",
        description: "Не удалось обновить настройки",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка настроек AI...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>Конфигурация AI провайдеров</CardTitle>
          </div>
          <CardDescription>
            Настройте какие модели использовать для разных задач.
            Изменения применяются немедленно.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Settings Cards */}
      <div className="grid gap-4">
        {(Object.keys(TASK_LABELS) as AITaskType[]).map(taskType => {
          const setting = settings.find(s => s.taskType === taskType && s.isDefault)
          
          return (
            <Card key={taskType}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{TASK_LABELS[taskType]}</CardTitle>
                    <CardDescription className="mt-1">
                      {TASK_DESCRIPTIONS[taskType]}
                    </CardDescription>
                  </div>
                  
                  {setting && (
                    <Switch
                      checked={setting.isEnabled}
                      onCheckedChange={(enabled) => updateSetting(setting.id, { isEnabled: enabled })}
                      disabled={saving}
                    />
                  )}
                </div>
              </CardHeader>
              
              {setting && (
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Provider */}
                    <div className="space-y-2">
                      <Label>Провайдер</Label>
                      <Select
                        value={setting.provider}
                        onValueChange={(value: LLMProvider) => 
                          updateSetting(setting.id, { 
                            provider: value,
                            modelName: MODELS_BY_PROVIDER[value][0]  // Первая модель по умолчанию
                          })
                        }
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PROVIDER_LABELS) as LLMProvider[]).map(provider => (
                            <SelectItem key={provider} value={provider}>
                              {PROVIDER_LABELS[provider]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model */}
                    <div className="space-y-2">
                      <Label>Модель</Label>
                      <Select
                        value={setting.modelName}
                        onValueChange={(value) => updateSetting(setting.id, { modelName: value })}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODELS_BY_PROVIDER[setting.provider].map(model => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <Label>Temperature</Label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={setting.temperature}
                        onChange={(e) => updateSetting(setting.id, { 
                          temperature: parseFloat(e.target.value) 
                        })}
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        0 = детерминированный, 1 = креативный
                      </p>
                    </div>
                  </div>

                  {/* Advanced */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Max Tokens</Label>
                        <Input
                          type="number"
                          value={setting.maxTokens}
                          onChange={(e) => updateSetting(setting.id, { 
                            maxTokens: parseInt(e.target.value) 
                          })}
                          disabled={saving}
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Badge variant="outline" className="h-fit">
                          {setting.isDefault ? '✓ По умолчанию' : 'Доп. конфигурация'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">API ключи настраиваются в переменных окружения:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code> - для OpenAI</li>
                <li><code className="bg-blue-100 px-1 rounded">ANTHROPIC_API_KEY</code> - для Claude</li>
              </ul>
              <p className="mt-2 text-xs">
                Настройки в Railway Dashboard → Settings → Variables
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

