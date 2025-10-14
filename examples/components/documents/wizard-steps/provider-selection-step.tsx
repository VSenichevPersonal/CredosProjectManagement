"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Sparkles, Brain, User, Check, Clock, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ProviderSelectionStepProps {
  packageId: string
  wizardData: Record<string, any>
  onNext: (data?: Record<string, any>) => void
  onBack: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

interface Provider {
  id: string
  type: "llm" | "finetuned" | "human"
  name: string
  description: string
  icon: React.ComponentType<any>
  speed: string
  quality: string
  price: string
  priceAmount: number
  estimatedTime: string
  features: string[]
  isAvailable: boolean
  recommended?: boolean
}

const providers: Provider[] = [
  {
    id: "llm-openai",
    type: "llm",
    name: "AI Генератор",
    description: "Быстрая автоматическая генерация с помощью искусственного интеллекта на основе 47 типовых документов",
    icon: Sparkles,
    speed: "⚡⚡⚡ Очень быстро",
    quality: "⭐⭐⭐⭐ Высокое",
    price: "500 ₽",
    priceAmount: 500,
    estimatedTime: "5-10 минут",
    features: [
      "Автоматическая генерация за 5-10 минут",
      "Адаптация под вашу организацию",
      "Соответствие требованиям законодательства",
      "Неограниченное количество правок",
    ],
    isAvailable: true,
    recommended: true,
  },
  {
    id: "finetuned",
    type: "finetuned",
    name: "Специализированная модель",
    description: "Дообученная модель для российского ИБ-комплаенса",
    icon: Brain,
    speed: "⚡⚡ Средне",
    quality: "⭐⭐⭐⭐⭐ Отличное",
    price: "1 500 ₽",
    priceAmount: 1500,
    estimatedTime: "15-20 минут",
    features: [
      "Более точная генерация",
      "Знание специфики российского законодательства",
      "Учет отраслевых особенностей",
      "Проверка соответствия стандартам",
    ],
    isAvailable: false,
  },
  {
    id: "human-expert",
    type: "human",
    name: "Эксперт-интегратор",
    description: "Ручная подготовка документов экспертом по информационной безопасности",
    icon: User,
    speed: "⏱️ Долго",
    quality: "⭐⭐⭐⭐⭐ Превосходное",
    price: "15 000 ₽",
    priceAmount: 15000,
    estimatedTime: "2-3 рабочих дня",
    features: [
      "Ручная проработка экспертом",
      "Консультация по внедрению",
      "1 итерация правок включена",
      "Гарантия качества",
    ],
    isAvailable: false,
  },
]

export function ProviderSelectionStep({
  wizardData,
  onNext,
}: ProviderSelectionStepProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    wizardData.selectedProvider?.id || null,
  )

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId)
  }

  const handleSubmit = () => {
    const provider = providers.find((p) => p.id === selectedProvider)
    if (provider) {
      onNext({ selectedProvider: provider })
    }
  }

  return (
    <div className="space-y-6">
      {/* Провайдеры */}
      <div className="grid gap-4">
        {providers.map((provider) => {
          const Icon = provider.icon
          const isSelected = selectedProvider === provider.id

          return (
            <Card
              key={provider.id}
              className={cn(
                "relative cursor-pointer transition-all",
                isSelected && "border-primary ring-2 ring-primary",
                !provider.isAvailable && "opacity-60 cursor-not-allowed",
              )}
              onClick={() => provider.isAvailable && handleProviderSelect(provider.id)}
            >
              {provider.recommended && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-green-500">Рекомендуем</Badge>
                </div>
              )}

              {!provider.isAvailable && (
                <div className="absolute right-4 top-4">
                  <Badge variant="outline">Скоро доступно</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      {isSelected && <Check className="h-5 w-5 text-primary" />}
                    </div>
                    <CardDescription className="mt-1">{provider.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Характеристики */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Скорость</span>
                    </div>
                    <div className="text-sm font-medium">{provider.speed}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Check className="h-4 w-4" />
                      <span>Качество</span>
                    </div>
                    <div className="text-sm font-medium">{provider.quality}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Стоимость</span>
                    </div>
                    <div className="text-lg font-bold text-primary">{provider.price}</div>
                  </div>
                </div>

                {/* Время */}
                <div className="text-sm text-muted-foreground">
                  ⏱️ Ориентировочное время: <span className="font-medium">{provider.estimatedTime}</span>
                </div>

                {/* Возможности */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Что входит:</div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {provider.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Кнопка */}
      <div className="flex justify-end">
        <Button size="lg" disabled={!selectedProvider} onClick={handleSubmit}>
          Начать генерацию
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

