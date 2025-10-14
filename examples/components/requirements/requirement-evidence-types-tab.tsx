"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileType, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { EvidenceType } from "@/types/domain/evidence"

interface RequirementEvidenceTypesTabProps {
  requirementId: string
}

// Default instructions based on evidence type - moved outside component
function getDefaultInstructions(typeCode: string) {
  const instructions: Record<string, any> = {
    order: {
      whatToInclude: [
        "Назначение ответственного за информационную безопасность",
        "Утверждение политик и процедур ИБ",
        "Сроки внедрения мер защиты",
        "Ответственные лица и их полномочия"
      ],
      requirements: [
        "Подпись руководителя организации",
        "Регистрационный номер и дата",
        "Печать организации (при наличии)"
      ],
      tips: "Приказ должен быть доведён до сведения всех ответственных лиц под подпись"
    },
    policy: {
      whatToInclude: [
        "Цели и область применения политики",
        "Термины и определения",
        "Требования и правила",
        "Ответственность и санкции"
      ],
      requirements: [
        "Утверждена приказом руководителя",
        "Согласована с юридическим отделом",
        "Версия и дата утверждения"
      ],
      tips: "Политика должна быть доступна всем сотрудникам и регулярно актуализироваться"
    },
    procedure: {
      whatToInclude: [
        "Пошаговые инструкции",
        "Ответственные роли",
        "Контрольные точки",
        "Форматы документов"
      ],
      requirements: [
        "Чёткие и понятные шаги",
        "Примеры заполнения (при необходимости)",
        "Контакты для вопросов"
      ],
      tips: "Процедура должна быть протестирована перед утверждением"
    },
    config: {
      whatToInclude: [
        "Скриншоты настроек системы",
        "Экспорт конфигурационных файлов",
        "Описание критичных параметров",
        "Дата последнего изменения"
      ],
      requirements: [
        "Актуальность на дату проверки",
        "Читаемость скриншотов",
        "Соответствие требованиям"
      ],
      tips: "Делайте скриншоты с датой/временем в системе"
    },
    log: {
      whatToInclude: [
        "Записи за требуемый период",
        "Критичные события",
        "Журнал изменений",
        "Подписи ответственных"
      ],
      requirements: [
        "Хронологический порядок",
        "Без пропусков в датах",
        "Читаемый формат"
      ],
      tips: "Журналы должны вестись регулярно, не задним числом"
    },
    protocol: {
      whatToInclude: [
        "Дата и участники",
        "Повестка и решения",
        "Результаты проверки",
        "Подписи всех участников"
      ],
      requirements: [
        "Официальная форма",
        "Регистрационный номер",
        "Подписи и печати"
      ],
      tips: "Протокол оформляется в день проведения мероприятия"
    }
  }
  
  return instructions[typeCode] || {
    whatToInclude: ["Содержание зависит от типа доказательства"],
    requirements: ["Актуальность и подлинность документа"],
    tips: "Обратитесь к базе знаний для получения подробных инструкций"
  }
}

export function RequirementEvidenceTypesTab({ requirementId }: RequirementEvidenceTypesTabProps) {
  const { toast } = useToast()
  const [requirement, setRequirement] = useState<any>(null)
  const [recommendedTypes, setRecommendedTypes] = useState<EvidenceType[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ useMemo ПЕРЕД условным return
  const evidenceTypesByMeasure = useMemo(() => {
    if (!recommendedTypes.length) return []
    
    return recommendedTypes.map(type => ({
      type,
      usedInMeasures: [],  // TODO: Map which measures use this type
      instructions: getDefaultInstructions(type.code)
    }))
  }, [recommendedTypes])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementId])

  const fetchData = async () => {
    try {
      console.log("[v0] [RequirementEvidenceTypesTab] Fetching data for requirement:", requirementId)

      const [reqResponse, templatesResponse, typesResponse] = await Promise.all([
        fetch(`/api/requirements/${requirementId}`),
        fetch(`/api/requirements/${requirementId}/control-templates`),
        fetch("/api/dictionaries/evidence-types"),
      ])

      const reqData = await reqResponse.json()
      const templatesData = await templatesResponse.json()
      const typesData = await typesResponse.json()

      console.log("[v0] [RequirementEvidenceTypesTab] Requirement data:", reqData.data)
      console.log("[v0] [RequirementEvidenceTypesTab] Templates data:", templatesData.data)
      console.log("[v0] [RequirementEvidenceTypesTab] Types data:", typesData.data)

      setRequirement(reqData.data)

      const allEvidenceTypeIds = new Set<string>()
      ;(templatesData.data || []).forEach((control: any) => {
        const templateEvidenceIds =
          control.template?.recommendedEvidenceTypeIds || control.template?.recommended_evidence_type_ids || []
        templateEvidenceIds.forEach((id: string) => allEvidenceTypeIds.add(id))
      })

      const recommended = (typesData.data || []).filter((t: EvidenceType) => allEvidenceTypeIds.has(t.id))
      setRecommendedTypes(recommended)

      console.log("[v0] [RequirementEvidenceTypesTab] Recommended types from templates:", recommended)
    } catch (error) {
      console.error("[v0] [RequirementEvidenceTypesTab] Failed to fetch data:", error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить типы доказательств",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка типов доказательств...</div>
  }

  const currentMode = requirement?.measureMode || requirement?.measure_mode || "flexible"

  return (
    <div className="flex flex-col gap-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <span className="font-medium text-blue-900">Справочник по доказательствам</span>
          <p className="text-blue-800 mt-1">
            Здесь собраны подробные инструкции по каждому типу доказательства. 
            Используйте эту информацию при подготовке документов для загрузки.
          </p>
        </AlertDescription>
      </Alert>

      {/* Evidence Type Cards with Instructions */}
      {evidenceTypesByMeasure.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileType className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Нет рекомендуемых типов доказательств</p>
              <p className="text-sm mt-2">
                Добавьте типовые меры на вкладке "Типовые меры защиты"
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evidenceTypesByMeasure.map(({ type, instructions }) => (
            <Card key={type.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileType className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{type.title}</CardTitle>
                      <CardDescription>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{type.code}</code>
                        {type.description && <span className="ml-2">{type.description}</span>}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* What to include */}
                {instructions.whatToInclude && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      📝 Что должно быть в документе:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {instructions.whatToInclude.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Requirements */}
                {instructions.requirements && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      ✅ Требования к оформлению:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {instructions.requirements.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Tips */}
                {instructions.tips && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold text-amber-900">💡 Подсказка:</span>
                      <span className="text-amber-800 ml-2">{instructions.tips}</span>
                    </p>
                  </div>
                )}
                
                {/* Actions - TODO: Add template download and knowledge base links */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Badge variant="outline" className="text-xs cursor-not-allowed">
                    📚 Шаблон (скоро)
                  </Badge>
                  <Badge variant="outline" className="text-xs cursor-not-allowed">
                    📖 База знаний (скоро)
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Summary */}
      {recommendedTypes.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Всего требуется типов доказательств:
              </span>
              <Badge variant="secondary" className="text-base font-semibold">
                {recommendedTypes.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
