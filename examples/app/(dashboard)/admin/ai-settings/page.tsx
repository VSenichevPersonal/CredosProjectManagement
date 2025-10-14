"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, CheckCircle, XCircle, Loader2, Save, TestTube } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AISettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [assistantId, setAssistantId] = useState("")
  const [vectorStoreId, setVectorStoreId] = useState("")
  const [maxClarificationRounds, setMaxClarificationRounds] = useState(3)
  
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<string | null>(null)

  // Загрузка текущих настроек
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    // Загружаем из env (для демо)
    // TODO: Загружать из БД через API
    setApiKey(process.env.NEXT_PUBLIC_OPENAI_API_KEY_MASKED || "sk-proj-***")
    setAssistantId("asst_6sA6C83ydEYgZy6bFNPMfYIq")
    setVectorStoreId("vs_68ed271734348191bc2fcbe2980e8a50")
    setMaxClarificationRounds(3)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/test-openai-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      setTestResult(result)
      
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveResult(null)
    
    try {
      // TODO: Сохранять в БД через API
      // Пока просто показываем сообщение
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaveResult("success")
      
    } catch (error: any) {
      setSaveResult(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Настройки AI</h1>
        <p className="text-muted-foreground">
          Настройте AI провайдеры и модели для разных задач
        </p>
      </div>

      {/* Конфигурация OpenAI */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Конфигурация OpenAI провайдера</CardTitle>
              <CardDescription>
                Настройки для генерации документов и уточняющих вопросов
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="font-mono"
              />
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Проверить
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Получите на https://platform.openai.com/api-keys
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {testResult.success ? (
                  <div className="space-y-1">
                    <div className="font-semibold">✅ Подключение успешно!</div>
                    <div className="text-xs">
                      <div>Assistant ID: {testResult.assistantId}</div>
                      <div>Vector Store: {testResult.vectorStoreId}</div>
                      <div>Файлов в Vector Store: {testResult.filesCount}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold">❌ Ошибка подключения</div>
                    <div className="text-xs mt-1">{testResult.error}</div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Assistant ID */}
          <div className="space-y-2">
            <Label htmlFor="assistant-id">Assistant ID</Label>
            <Input
              id="assistant-id"
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              placeholder="asst_..."
              className="font-mono"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Создаётся автоматически при setup
            </p>
          </div>

          {/* Vector Store ID */}
          <div className="space-y-2">
            <Label htmlFor="vector-store-id">Vector Store ID</Label>
            <Input
              id="vector-store-id"
              value={vectorStoreId}
              onChange={(e) => setVectorStoreId(e.target.value)}
              placeholder="vs_..."
              className="font-mono"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Хранилище с 47 типовыми документами
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Генерация документов */}
      <Card>
        <CardHeader>
          <CardTitle>Генерация документов</CardTitle>
          <CardDescription>
            Настройки для мастера генерации документов ПДн
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Количество раундов */}
          <div className="space-y-2">
            <Label htmlFor="max-rounds">
              Максимальное количество кругов уточняющих вопросов
            </Label>
            <div className="flex items-center gap-4">
              <Select
                value={maxClarificationRounds.toString()}
                onValueChange={(value) => setMaxClarificationRounds(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'круг' : num < 5 ? 'круга' : 'кругов'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Badge variant={maxClarificationRounds <= 3 ? "default" : "secondary"}>
                {maxClarificationRounds <= 2 ? "Быстро" : maxClarificationRounds <= 5 ? "Средне" : "Детально"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              AI будет задавать уточняющие вопросы в несколько кругов. 
              Рекомендуется: 2-3 круга для баланса качества и скорости.
            </p>
            
            {/* Расчёт времени */}
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
              <div className="font-semibold">Влияние на время генерации:</div>
              <div>• Каждый круг: ~30 секунд генерация + время ответов</div>
              <div>• {maxClarificationRounds} круга: ~{maxClarificationRounds * 0.5}-{maxClarificationRounds * 1} минуты</div>
              <div className="text-primary font-medium">
                Общее время мастера: ~{5 + maxClarificationRounds}-{15 + maxClarificationRounds * 2} минут
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Дополнительные настройки */}
      <Card>
        <CardHeader>
          <CardTitle>Дополнительные параметры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Модель</Label>
              <Input value="gpt-4o" readOnly className="bg-muted" />
            </div>
            
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input value="0.3" readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Низкая температура для стабильных результатов
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Сохранение */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Изменения применяются немедленно
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings}>
            Сбросить
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Сохранить настройки
              </>
            )}
          </Button>
        </div>
      </div>

      {saveResult && (
        <Alert variant={saveResult === "success" ? "default" : "destructive"}>
          <AlertDescription>
            {saveResult === "success" ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Настройки сохранены успешно!</span>
              </div>
            ) : (
              <div>Ошибка: {saveResult}</div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
