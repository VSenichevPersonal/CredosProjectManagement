"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"

// Импорты компонентов шагов (создадим далее)
import { QuestionnaireStep } from "./wizard-steps/questionnaire-step"
import { ClarificationStep } from "./wizard-steps/clarification-step"
import { ProviderSelectionStep } from "./wizard-steps/provider-selection-step"
import { GenerationProgressStep } from "./wizard-steps/generation-progress-step"
import { DocumentReviewStep } from "./wizard-steps/document-review-step"

// Типы
interface WizardStep {
  id: number
  title: string
  description: string
  component: React.ComponentType<any>
}

interface DocumentWizardComponentProps {
  packageId: string
}

// Конфигурация шагов
const wizardSteps: WizardStep[] = [
  {
    id: 1,
    title: "Заполнение анкеты",
    description: "Ответьте на вопросы о вашей организации",
    component: QuestionnaireStep,
  },
  {
    id: 2,
    title: "Уточняющие вопросы",
    description: "AI помощник задаст несколько уточняющих вопросов",
    component: ClarificationStep,
  },
  {
    id: 3,
    title: "Выбор провайдера",
    description: "Выберите как сгенерировать документы",
    component: ProviderSelectionStep,
  },
  {
    id: 4,
    title: "Генерация документов",
    description: "Создание документов в процессе",
    component: GenerationProgressStep,
  },
  {
    id: 5,
    title: "Просмотр и редактирование",
    description: "Проверьте сгенерированные документы",
    component: DocumentReviewStep,
  },
]

// Временные данные пакета
const packageData: Record<string, any> = {
  "pkg-152fz-pdn-full": {
    id: "pkg-152fz-pdn-full",
    title: "Защита персональных данных (152-ФЗ)",
    description: "Полный комплект из 15 документов для соответствия 152-ФЗ",
    documentsCount: 15,
  },
}

export function DocumentWizardComponent({ packageId }: DocumentWizardComponentProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<Record<string, any>>({
    packageId,
    answers: {},
    clarifications: {},
    selectedProvider: null,
    generatedDocuments: [],
  })

  const pkg = packageData[packageId]
  const CurrentStepComponent = wizardSteps[currentStep].component

  // Обработчики
  const handleNext = (data?: Record<string, any>) => {
    if (data) {
      setWizardData((prev) => ({ ...prev, ...data }))
    }
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const progress = ((currentStep + 1) / wizardSteps.length) * 100

  return (
    <div className="flex flex-col gap-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pkg.title}</h1>
          <p className="text-muted-foreground">{pkg.description}</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          AI генерация
        </Badge>
      </div>

      {/* Прогресс */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Прогресс-бар */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Шаг {currentStep + 1} из {wizardSteps.length}
                </span>
                <span className="text-muted-foreground">{Math.round(progress)}% завершено</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Список шагов */}
            <div className="flex gap-2 overflow-x-auto py-2">
              {wizardSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => {
                    // Можно переходить только на пройденные шаги
                    if (index <= currentStep) {
                      setCurrentStep(index)
                    }
                  }}
                  disabled={index > currentStep}
                  className={cn(
                    "flex flex-1 min-w-[140px] items-center gap-2 rounded-lg border p-3 text-left transition-all",
                    index === currentStep
                      ? "border-primary bg-primary/5"
                      : index < currentStep
                        ? "border-green-200 bg-green-50 hover:bg-green-100"
                        : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      index === currentStep
                        ? "bg-primary text-white"
                        : index < currentStep
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-600",
                    )}
                  >
                    {index < currentStep ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{step.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Текущий шаг */}
      <Card>
        <CardHeader>
          <CardTitle>{wizardSteps[currentStep].title}</CardTitle>
          <CardDescription>{wizardSteps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            packageId={packageId}
            wizardData={wizardData}
            onNext={handleNext}
            onBack={handleBack}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === wizardSteps.length - 1}
          />
        </CardContent>
      </Card>

      {/* Навигация (общая для всех шагов, но может быть переопределена в компонентах) */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="text-sm text-muted-foreground">
          Шаг {currentStep + 1} из {wizardSteps.length}
        </div>

        {currentStep < wizardSteps.length - 1 && (
          <Button onClick={() => handleNext()}>
            Далее
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

