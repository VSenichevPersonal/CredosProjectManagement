"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

interface TourStep {
  title: string
  description: string
  target?: string
}

const tourSteps: TourStep[] = [
  {
    title: "Добро пожаловать в систему управления комплаенсом!",
    description: "Давайте познакомимся с основными возможностями платформы. Этот тур займет всего 2 минуты.",
  },
  {
    title: "Дашборд",
    description:
      "Здесь вы видите общую статистику по вашим требованиям: сколько выполнено, в работе и просрочено. Используйте виджеты для быстрого доступа к важной информации.",
  },
  {
    title: "Требования",
    description:
      "В разделе 'Требования' вы найдете все назначенные вам задачи. Используйте фильтры для поиска нужных требований по категории, регулятору или статусу.",
  },
  {
    title: "Изменение статуса",
    description:
      "Откройте любое требование и нажмите 'Изменить статус', чтобы обновить прогресс. Не забудьте загрузить подтверждающие документы!",
  },
  {
    title: "Уведомления",
    description:
      "Колокольчик в правом верхнем углу показывает важные уведомления: новые требования, приближающиеся дедлайны и комментарии.",
  },
  {
    title: "Готово!",
    description:
      "Теперь вы знаете основы работы с системой. Если возникнут вопросы, нажмите на иконку '?' для доступа к справке.",
  },
]

export function WelcomeTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenWelcomeTour")
    if (!hasSeenTour) {
      setTimeout(() => setIsOpen(true), 1000)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleSkip = () => {
    handleClose()
  }

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem("hasSeenWelcomeTour", "true")
  }

  if (!isOpen) return null

  const step = tourSteps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription className="mt-2">
                Шаг {currentStep + 1} из {tourSteps.length}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{step.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            {currentStep === tourSteps.length - 1 ? "Закрыть" : "Пропустить"}
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Назад
              </Button>
            )}
            <Button onClick={handleNext}>{currentStep === tourSteps.length - 1 ? "Завершить" : "Далее"}</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
