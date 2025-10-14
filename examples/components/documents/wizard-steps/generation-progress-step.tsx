"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, FileText, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils/cn"

interface GenerationProgressStepProps {
  packageId: string
  wizardData: Record<string, any>
  onNext: (data?: Record<string, any>) => void
  onBack: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

// Этапы генерации
const generationStages = [
  { id: 1, title: "Подготовка контекста", description: "Создание OpenAI Thread и загрузка шаблонов" },
  { id: 2, title: "Анализ ответов", description: "Обработка данных анкеты" },
  { id: 3, title: "Генерация документов (1-5)", description: "Политики и положения" },
  { id: 4, title: "Генерация документов (6-10)", description: "Инструкции и регламенты" },
  { id: 5, title: "Генерация документов (11-15)", description: "ОРД и приказы" },
  { id: 6, title: "Проверка качества", description: "Валидация всех 15 документов" },
  { id: 7, title: "Финализация", description: "Подготовка к просмотру" },
]

export function GenerationProgressStep({
  wizardData,
  onNext,
}: GenerationProgressStepProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [generatedDocs, setGeneratedDocs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentDocument, setCurrentDocument] = useState<string>("")
  const [documentsProgress, setDocumentsProgress] = useState(0)

  useEffect(() => {
    // Запускаем реальную генерацию
    generateDocuments()
  }, [])

  const generateDocuments = async () => {
    try {
      setCurrentStage(0)
      setCurrentDocument("Подготовка к генерации...")
      
      // Показываем прогресс по этапам
      const stageInterval = setInterval(() => {
        setCurrentStage(prev => {
          if (prev < 2) return prev + 1 // Первые 3 этапа
          return prev
        })
      }, 2000)
      
      // Реальный вызов к API
      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: wizardData.answers
        })
      })
      
      clearInterval(stageInterval)
      
      if (!response.ok) {
        throw new Error('Ошибка генерации')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentDocument(`Завершено: ${result.documents.length} документов`)
        setDocumentsProgress(100)
        
        // Показываем финализацию
        setCurrentStage(5)
        setGeneratedDocs(result.documents)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setCurrentStage(6)
        setIsComplete(true)
        
        // Переходим к просмотру
        setTimeout(() => {
          onNext({ generatedDocuments: result.documents })
        }, 1000)
      } else {
        setError(result.error || 'Неизвестная ошибка')
      }
      
    } catch (error: any) {
      setError(error.message)
      console.error('[Generation] Error:', error)
    }
  }

  const progress = ((currentStage + 1) / generationStages.length) * 100

  return (
    <div className="space-y-6">
      {/* Информация */}
      {/* Лев Львович + статус */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="relative">
            <img 
              src="/lev-lvovich.jpg" 
              alt="Лев Львович"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary"
              onError={(e) => {
                // Fallback на SVG если jpg нет
                e.currentTarget.src = '/lev-lvovich-placeholder.svg'
              }}
            />
            {!isComplete && !error && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            )}
            {isComplete && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>
                ❌ Ошибка генерации: {error}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-primary/20 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription>
                {isComplete
                  ? "✅ Лев Львович завершил генерацию! Переходим к просмотру документов..."
                  : "⚡ Лев Львович работает над документами, используя 47 типовых шаблонов..."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>}

      {/* Прогресс-бар */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Прогресс генерации</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Этапы */}
      <div className="space-y-3">
        {generationStages.map((stage, index) => {
          const isActive = index === currentStage
          const isCompleted = index < currentStage
          const isPending = index > currentStage

          return (
            <div
              key={stage.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 transition-all",
                isActive && "border-primary bg-primary/5",
                isCompleted && "border-green-200 bg-green-50",
                isPending && "opacity-50",
              )}
            >
              {/* Иконка статуса с круглым прогрессом */}
              <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
                {/* Круговой прогресс для активного */}
                {isActive && (
                  <svg className="absolute inset-0 -rotate-90 transform" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                      className="text-primary transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                
                {/* Центральная иконка */}
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full z-10",
                    isActive && "bg-primary text-white",
                    isCompleted && "bg-green-500 text-white",
                    isPending && "bg-gray-200 text-gray-600",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : isActive ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <span className="text-sm font-bold">{stage.id}</span>
                  )}
                </div>
                
                {/* Процент для активного */}
                {isActive && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">
                    {Math.round(progress)}%
                  </div>
                )}
              </div>

              {/* Текст */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{stage.title}</h4>
                  {isActive && <Badge variant="outline">В процессе</Badge>}
                  {isCompleted && <Badge className="bg-green-500">Готово</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{stage.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Завершение */}
      {isComplete && (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
              <Check className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold text-green-900">Генерация завершена успешно!</h3>
              <p className="text-sm text-green-800">
                Создано {generatedDocs.length} документов. Переходим к просмотру и редактированию...
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {generatedDocs.map((doc) => (
                  <Badge key={doc.id} variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {doc.title}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

