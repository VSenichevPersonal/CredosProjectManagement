"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronRight, Sparkles, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface ClarificationStepProps {
  packageId: string
  wizardData: Record<string, any>
  onNext: (data?: Record<string, any>) => void
  onBack: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

interface ClarificationQuestion {
  id: string
  question: string
  context: string
  suggestedAnswers?: string[]
}

export function ClarificationStep({
  wizardData,
  onNext,
}: ClarificationStepProps) {
  const [isGenerating, setIsGenerating] = useState(true)
  const [clarifications, setClarifications] = useState<ClarificationQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>(wizardData.clarifications || {})
  const [error, setError] = useState<string | null>(null)
  
  // Итерации (круги) вопросов
  const [currentRound, setCurrentRound] = useState(1)
  const [maxRounds, setMaxRounds] = useState(3)
  const [allRoundsAnswers, setAllRoundsAnswers] = useState<Record<string, any>[]>([])

  useEffect(() => {
    // Загружаем настройки и генерируем первый круг
    loadSettingsAndGenerate()
  }, [])
  
  const loadSettingsAndGenerate = async () => {
    try {
      // Загружаем настройки AI
      const response = await fetch('/api/admin/ai-settings')
      if (response.ok) {
        const result = await response.json()
        const rounds = result.data?.max_clarification_rounds || 3
        setMaxRounds(rounds)
      }
    } catch (error) {
      console.log('[Clarifications] Settings load error, using default:', error)
    }
    
    // Генерируем первый круг
    generateClarifications(currentRound)
  }

  const generateClarifications = async (round: number) => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-clarifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: wizardData.answers,
          previousClarifications: allRoundsAnswers,
          currentRound: round,
          maxRounds: maxRounds
        })
      })
      
      if (!response.ok) {
        throw new Error('Не удалось сгенерировать вопросы')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setClarifications(result.questions || [])
      } else {
        setError(result.error || 'Ошибка генерации вопросов')
      }
      
    } catch (error: any) {
      console.error('[Clarifications] Error:', error)
      setError(error.message)
      
      // Fallback - можем пропустить этот шаг
      setClarifications([])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSuggestedAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Сохраняем ответы текущего круга
    const newAllAnswers = [...allRoundsAnswers, answers]
    setAllRoundsAnswers(newAllAnswers)
    
    // Проверяем нужен ли следующий круг
    if (currentRound < maxRounds) {
      // Генерируем следующий круг вопросов
      setCurrentRound(currentRound + 1)
      setAnswers({})
      generateClarifications(currentRound + 1)
    } else {
      // Все круги пройдены - переходим дальше
      onNext({ clarifications: newAllAnswers })
    }
  }
  
  const handleSkipRemaining = () => {
    // Пропускаем оставшиеся круги
    onNext({ clarifications: [...allRoundsAnswers, answers] })
  }

  // Loading состояние
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <Alert className="border-primary/20 bg-primary/5">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <AlertDescription>
            ⚡ Лев Львович анализирует ваши ответы и формирует уточняющие вопросы...
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              Генерация вопросов... (~30 секунд)
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Если ошибка или нет вопросов - можно пропустить
  if (error || clarifications.length === 0) {
    return (
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось сгенерировать уточняющие вопросы: {error}
            </AlertDescription>
          </Alert>
        )}
        
        <Alert>
          <AlertDescription>
            {error ? 'Можете продолжить без уточняющих вопросов.' : 'Уточняющие вопросы не требуются.'}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end">
          <Button onClick={() => onNext()}>
            Продолжить
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Прогресс кругов */}
      <div className="flex items-center justify-between">
        <Alert className="border-primary/20 bg-primary/5 flex-1 mr-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription>
            OpenAI проанализировал ваши ответы и подготовил {clarifications.length} уточняющих вопроса
          </AlertDescription>
        </Alert>
        
        <Badge variant="outline" className="text-lg px-4 py-2">
          Круг {currentRound} из {maxRounds}
        </Badge>
      </div>

      {/* Вопросы */}
      <div className="space-y-6">
        {clarifications.map((clarification, index) => (
          <div key={clarification.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">
                {index + 1}
              </Badge>
              <div className="flex-1 space-y-2">
                <Label className="text-base font-semibold">{clarification.question}</Label>
                <p className="text-sm text-muted-foreground">{clarification.context}</p>

                {/* Предложенные ответы */}
                {clarification.suggestedAnswers && (
                  <div className="flex flex-wrap gap-2">
                    {clarification.suggestedAnswers.map((suggested) => (
                      <Button
                        key={suggested}
                        type="button"
                        variant={answers[clarification.id] === suggested ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSuggestedAnswer(clarification.id, suggested)}
                      >
                        {suggested}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Текстовое поле для ответа */}
                <Textarea
                  value={answers[clarification.id] || ""}
                  onChange={(e) => handleAnswerChange(clarification.id, e.target.value)}
                  placeholder="Введите ваш ответ..."
                  rows={2}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Кнопки */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {currentRound < maxRounds && (
            <span>После ответа будет сгенерирован следующий круг вопросов</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {currentRound < maxRounds && (
            <Button type="button" variant="outline" onClick={handleSkipRemaining}>
              Пропустить оставшиеся {maxRounds - currentRound} круга
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onNext({ clarifications: allRoundsAnswers })}>
            Пропустить этот круг
          </Button>
          <Button type="submit" size="lg">
            {currentRound < maxRounds ? (
              <>
                Следующий круг
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Завершить
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

