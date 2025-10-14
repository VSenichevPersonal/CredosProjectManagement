"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, AlertCircle, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QuestionnaireStepProps {
  packageId: string
  wizardData: Record<string, any>
  onNext: (data?: Record<string, any>) => void
  onBack: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

// Анкета для 152-ФЗ (базовая версия)
const questionnaire152FZ = {
  id: "152fz-pdn-basic",
  title: "Анкета по защите персональных данных",
  sections: [
    {
      id: "org-info",
      title: "1. Информация об организации",
      questions: [
        {
          id: "org-name",
          type: "text",
          label: "Полное наименование организации",
          placeholder: 'ООО "Ромашка"',
          required: true,
        },
        {
          id: "org-inn",
          type: "text",
          label: "ИНН",
          placeholder: "7701234567",
          required: true,
        },
        {
          id: "org-address",
          type: "text",
          label: "Юридический адрес",
          placeholder: "г. Москва, ул. Ленина, д. 1",
          required: true,
        },
        {
          id: "org-type",
          type: "select",
          label: "Тип организации",
          required: true,
          options: [
            { value: "commercial", label: "Коммерческая" },
            { value: "government", label: "Государственная" },
            { value: "nko", label: "НКО" },
          ],
        },
        {
          id: "employee-count",
          type: "select",
          label: "Количество сотрудников",
          required: true,
          options: [
            { value: "1-50", label: "1-50" },
            { value: "51-250", label: "51-250" },
            { value: "251-1000", label: "251-1000" },
            { value: "1000+", label: "Более 1000" },
          ],
        },
      ],
    },
    {
      id: "pdn-scope",
      title: "2. Объем обработки персональных данных",
      questions: [
        {
          id: "pdn-volume",
          type: "select",
          label: "Объем обрабатываемых ПДн (количество субъектов)",
          required: true,
          options: [
            { value: "less-100k", label: "Менее 100 000" },
            { value: "more-100k", label: "Более 100 000" },
          ],
        },
        {
          id: "pdn-subjects",
          type: "multiselect",
          label: "Категории субъектов ПДн (выберите все подходящие)",
          required: true,
          options: [
            { value: "employees", label: "Сотрудники" },
            { value: "relatives", label: "Родственники сотрудников" },
            { value: "former-employees", label: "Бывшие сотрудники" },
            { value: "clients", label: "Клиенты" },
            { value: "contractors", label: "Контрагенты" },
            { value: "candidates", label: "Кандидаты на работу" },
          ],
        },
      ],
    },
    {
      id: "responsible",
      title: "3. Ответственные лица",
      questions: [
        {
          id: "responsible-processing-name",
          type: "text",
          label: "ФИО ответственного за обработку ПДн",
          placeholder: "Иванов Иван Иванович",
          required: true,
        },
        {
          id: "responsible-processing-position",
          type: "text",
          label: "Должность ответственного за обработку ПДн",
          placeholder: "Директор по персоналу",
          required: true,
        },
        {
          id: "responsible-security-name",
          type: "text",
          label: "ФИО ответственного за безопасность ПДн",
          required: true,
        },
        {
          id: "responsible-security-position",
          type: "text",
          label: "Должность ответственного за безопасность ПДн",
          placeholder: "Начальник отдела ИТ",
          required: true,
        },
      ],
    },
    {
      id: "ispdn",
      title: "4. Информационные системы",
      questions: [
        {
          id: "ispdn-software",
          type: "multiselect",
          label: "Используемое ПО для обработки ПДн",
          required: true,
          options: [
            { value: "1c-salary", label: "1С: Зарплата и управление персоналом" },
            { value: "1c-accounting", label: "1С: Бухгалтерия" },
            { value: "ms-office", label: "Microsoft Office" },
            { value: "email", label: "Электронная почта" },
            { value: "ked", label: "Система электронного документооборота" },
            { value: "other", label: "Другое" },
          ],
        },
        {
          id: "ispdn-location",
          type: "text",
          label: "Адрес расположения ИСПДн",
          placeholder: "г. Москва, ул. Ленина, д.1, каб. 101",
          required: true,
        },
      ],
    },
  ],
}

// Тестовые данные для быстрого заполнения
const TEST_DATA = {
  "org-name": "ООО Ромашка",
  "org-inn": "7701234567",
  "org-address": "г. Москва, ул. Ленина, д. 1, офис 101",
  "org-type": "commercial",
  "employee-count": "51-250",
  "pdn-volume": "less-100k",
  "pdn-subjects": ["employees", "clients", "contractors"],
  "responsible-processing-name": "Иванов Иван Иванович",
  "responsible-processing-position": "Директор по персоналу",
  "responsible-security-name": "Петров Петр Петрович",
  "responsible-security-position": "Начальник отдела ИТ",
  "ispdn-software": ["1c-salary", "ms-office", "email"],
  "ispdn-location": "г. Москва, ул. Ленина, д. 1, серверная комната 205"
}

export function QuestionnaireStep({
  packageId,
  wizardData,
  onNext,
  isFirstStep,
}: QuestionnaireStepProps) {
  const [answers, setAnswers] = useState<Record<string, any>>(wizardData.answers || {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [multiSelectValues, setMultiSelectValues] = useState<Record<string, string[]>>({})

  // Получаем анкету для пакета
  const questionnaire = packageId === "pkg-152fz-pdn-full" ? questionnaire152FZ : null
  
  // Автозаполнение тестовыми данными
  const handleFillTestData = () => {
    setAnswers(TEST_DATA)
    // Обновляем multiSelectValues для чекбоксов
    setMultiSelectValues({
      "pdn-subjects": TEST_DATA["pdn-subjects"],
      "ispdn-software": TEST_DATA["ispdn-software"]
    })
  }

  if (!questionnaire) {
    return <div>Анкета не найдена</div>
  }

  const handleInputChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    // Очищаем ошибку при изменении
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const handleMultiSelectToggle = (questionId: string, value: string) => {
    setMultiSelectValues((prev) => {
      const current = prev[questionId] || []
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      
      // Обновляем answers
      setAnswers((prevAnswers) => ({ ...prevAnswers, [questionId]: newValues }))
      
      return { ...prev, [questionId]: newValues }
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    questionnaire.sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (question.required && !answers[question.id]) {
          newErrors[question.id] = "Это поле обязательно для заполнения"
        }
        if (question.type === "multiselect" && question.required) {
          if (!answers[question.id] || answers[question.id].length === 0) {
            newErrors[question.id] = "Выберите хотя бы один вариант"
          }
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onNext({ answers })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Кнопка автозаполнения для тестирования */}
      <div className="flex justify-end">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleFillTestData}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Заполнить тестовыми данными
        </Button>
      </div>
      
      {/* Разделы анкеты */}
      {questionnaire.sections.map((section) => (
        <div key={section.id} className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">{section.title}</h3>
          </div>

          <div className="space-y-4">
            {section.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id} className="text-base">
                  {question.label}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {/* Text input */}
                {question.type === "text" && (
                  <Input
                    id={question.id}
                    value={answers[question.id] || ""}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    className={errors[question.id] ? "border-red-500" : ""}
                  />
                )}

                {/* Select */}
                {question.type === "select" && (
                  <Select
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleInputChange(question.id, value)}
                  >
                    <SelectTrigger className={errors[question.id] ? "border-red-500" : ""}>
                      <SelectValue placeholder="Выберите..." />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Multiselect (checkboxes) */}
                {question.type === "multiselect" && (
                  <div className="space-y-2">
                    {question.options?.map((option) => {
                      const isChecked = (answers[question.id] || []).includes(option.value)
                      return (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${question.id}-${option.value}`}
                            checked={isChecked}
                            onCheckedChange={() => handleMultiSelectToggle(question.id, option.value)}
                          />
                          <label
                            htmlFor={`${question.id}-${option.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option.label}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Ошибка валидации */}
                {errors[question.id] && (
                  <p className="text-sm text-red-500">{errors[question.id]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Информация */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          После заполнения анкеты AI помощник задаст несколько уточняющих вопросов для более точной генерации документов
        </AlertDescription>
      </Alert>

      {/* Кнопка */}
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Продолжить
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

