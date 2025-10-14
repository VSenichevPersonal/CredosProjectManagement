"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2 } from "lucide-react"

export default function TestGenerationPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testAnswers = {
    "org-name": "ООО Тестовая Компания",
    "org-inn": "7701234567",
    "org-address": "г. Москва, ул. Ленина, д. 1",
    "responsible-processing-name": "Иванов Иван Иванович",
    "responsible-processing-position": "Директор по персоналу"
  }

  const handleTest = async () => {
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: testAnswers })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.document)
      } else {
        setError(data.error || 'Unknown error')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Тест генерации через OpenAI</h1>
        <p className="text-muted-foreground">Проверка работы Assistant + Vector Store</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI Setup Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>✅ Assistant ID: asst_6sA6C83ydEYgZy6bFNPMfYIq</div>
          <div>✅ Vector Store ID: vs_68ed271734348191bc2fcbe2980e8a50</div>
          <div>✅ Файлов в Vector Store: 47/47</div>
          <div>✅ SDK Version: 6.3.0 (latest)</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Тестовые данные</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded">
            {JSON.stringify(testAnswers, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Button 
        onClick={handleTest} 
        disabled={isGenerating}
        size="lg"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Генерация... (может занять 30-60 сек)
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Протестировать генерацию
          </>
        )}
      </Button>

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-red-600">{error}</pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-600">✅ Документ сгенерирован!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold">{result.title}</div>
              <div className="text-sm text-muted-foreground">Confidence: {result.confidence}%</div>
            </div>
            <Textarea 
              value={result.content}
              readOnly
              rows={20}
              className="font-mono text-xs"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

