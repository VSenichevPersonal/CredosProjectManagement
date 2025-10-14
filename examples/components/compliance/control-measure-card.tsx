/**
 * @intent: Карточка меры контроля с отображением сроков и доказательств
 * @llm-note: Раскрываемая карточка с возможностью добавления доказательств
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, Calendar, Clock, CheckCircle2, 
  ChevronDown, ChevronUp, FileText, Plus, Trash2 
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ControlMeasure } from "@/types/domain/control-measure"
import {
  calculateDeadlineInfo,
  formatMeasureDate,
  getMeasureStatusColor,
  getMeasureStatusLabel,
  needsReview,
  isExpiring,
} from "@/lib/utils/control-measure-utils"
import { UploadEvidenceForMeasureDialog } from "./upload-evidence-for-measure-dialog"

interface ControlMeasureCardProps {
  measure: ControlMeasure
  requirementTitle?: string
  onUpdate?: () => void
  measureMode?: 'strict' | 'flexible'
  complianceId?: string
  requirementId?: string
  evidenceTypeMode?: 'strict' | 'flexible'
  allowedEvidenceTypeIds?: string[]
}

export function ControlMeasureCard({ 
  measure, 
  requirementTitle, 
  onUpdate, 
  measureMode = 'flexible', 
  complianceId,
  requirementId,
  evidenceTypeMode = 'flexible',
  allowedEvidenceTypeIds = []
}: ControlMeasureCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)  // Раскрыто по умолчанию
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const deadlineInfo = calculateDeadlineInfo(measure.targetImplementationDate, measure.status)
  
  const linkedEvidence = measure.linkedEvidence || []
  const evidenceCount = measure.linkedEvidenceCount || linkedEvidence.length || 0
  
  // Проверка: мера заблокирована в строгом режиме
  const isLocked = measureMode === 'strict' && (measure.isLocked || measure.fromTemplate)
  const canModify = !isLocked

  return (
    <Card
      className={cn(
        "border-l-4 transition-shadow hover:shadow-md",
        deadlineInfo?.isOverdue && "border-l-red-600 bg-red-50/50",
        deadlineInfo?.isCritical && !deadlineInfo.isOverdue && "border-l-orange-500 bg-orange-50/50",
        deadlineInfo?.isWarning && !deadlineInfo.isCritical && "border-l-yellow-500 bg-yellow-50/50",
        !deadlineInfo?.isOverdue &&
          !deadlineInfo?.isCritical &&
          !deadlineInfo?.isWarning &&
          measure.status === "verified" &&
          "border-l-green-600",
        !deadlineInfo && "border-l-gray-300"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{measure.title}</CardTitle>
              <Badge className={getMeasureStatusColor(measure.status)}>{getMeasureStatusLabel(measure.status)}</Badge>
              
              {/* Индикатор строгого режима */}
              {isLocked && (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                  🔒 Из шаблона
                </Badge>
              )}
            </div>
            {requirementTitle && (
              <p className="text-sm text-muted-foreground mt-1">Требование: {requirementTitle}</p>
            )}
            
            {/* Краткая инфо */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {measure.targetImplementationDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Срок: {formatMeasureDate(measure.targetImplementationDate)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Доказательств: {evidenceCount}
              </span>
            </div>
          </div>
          
          {/* Кнопки управления */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Раскрыть
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
        {/* Индикатор master control */}
        {(measure as any).masterControl && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <span className="font-semibold">🔗 Организационный контроль:</span> Эта мера связана с контролем на уровне организации.
              {(measure as any).masterControl.evidence_ids?.length > 0 && (
                <span className="block mt-1">
                  Доказательства ({(measure as any).masterControl.evidence_ids.length}) расшариваются между всеми связанными требованиями.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Индикатор строгого режима */}
        {isLocked && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <span className="font-semibold">Строгий режим:</span> Мера создана из обязательного шаблона и не может быть изменена. Доказательства можно только просматривать.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Описание */}
        {measure.description && (
          <p className="text-sm text-muted-foreground">{measure.description}</p>
        )}

        {/* Плановый срок и статус */}
        {measure.targetImplementationDate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Плановый срок:
              </span>
              <span className="font-medium">{formatMeasureDate(measure.targetImplementationDate)}</span>
            </div>

            {/* Индикатор просрочки/статуса */}
            {deadlineInfo && (
              <Alert
                variant={deadlineInfo.isOverdue || deadlineInfo.isCritical ? "destructive" : "default"}
                className={cn(
                  deadlineInfo.isWarning && "border-yellow-500 bg-yellow-50",
                  deadlineInfo.color === "success" && "border-green-500 bg-green-50"
                )}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{deadlineInfo.message}</span>
                  {deadlineInfo.isOverdue && (
                    <span className="font-bold text-red-900">
                      {Math.abs(deadlineInfo.daysUntilDue)} дн. просрочки
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Фактическое внедрение */}
        {measure.actualImplementationDate && (
          <div className="flex items-center justify-between text-sm p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-900 flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Внедрена:
            </span>
            <span className="text-green-900 font-semibold">{formatMeasureDate(measure.actualImplementationDate)}</span>
          </div>
        )}

        {/* Следующая проверка */}
        {measure.nextReviewDate && (
          <div
            className={cn(
              "flex items-center justify-between text-sm p-3 border rounded-lg",
              needsReview(measure.nextReviewDate, measure.status)
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
            )}
          >
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Следующая проверка:
            </span>
            <span className="font-medium">{formatMeasureDate(measure.nextReviewDate)}</span>
          </div>
        )}

        {/* Срок действия */}
        {measure.validUntil && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Срок действия до:</span>
              <span className="font-medium">{formatMeasureDate(measure.validUntil)}</span>
            </div>
            {isExpiring(measure.validUntil, measure.status) && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Истекает в ближайшие 30 дней
              </p>
            )}
          </div>
        )}

        {/* Ответственный */}
        {measure.responsibleUser && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Ответственный:</span>
            <span className="font-medium">{measure.responsibleUser.fullName}</span>
          </div>
        )}

        {/* Заметки по внедрению */}
        {measure.implementationNotes && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Заметки:</p>
            <p className="text-sm">{measure.implementationNotes}</p>
          </div>
        )}
        
        {/* Доказательства */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Доказательства ({evidenceCount})
            </h4>
            {canModify && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </Button>
            )}
            {!canModify && (
              <Badge variant="outline" className="text-xs">
                Строгий режим
              </Badge>
            )}
          </div>
          
          {linkedEvidence.length > 0 ? (
            <div className="space-y-2">
              {linkedEvidence.map((evidence: any) => (
                <div 
                  key={evidence.id}
                  className="p-4 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors"
                >
                  {/* Заголовок */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{evidence.fileName || evidence.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {evidence.evidenceType && (
                            <Badge variant="outline" className="text-xs">
                              {evidence.evidenceType}
                            </Badge>
                          )}
                          {evidence.status && (
                            <Badge variant={
                              evidence.status === 'approved' ? 'default' :
                              evidence.status === 'rejected' ? 'destructive' :
                              'secondary'
                            } className="text-xs">
                              {evidence.status}
                            </Badge>
                          )}
                          {evidence.relevanceScore && (
                            <Badge variant="outline" className="text-xs">
                              {'⭐'.repeat(evidence.relevanceScore)} ({evidence.relevanceScore})
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {canModify && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Отвязать доказательство от меры?')) {
                            // TODO: API удаления evidence_link
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Детали */}
                  <div className="space-y-1 text-xs text-muted-foreground mt-2">
                    {evidence.linkNotes && (
                      <p className="flex items-start gap-1">
                        <span className="font-medium">Примечание:</span>
                        <span>{evidence.linkNotes}</span>
                      </p>
                    )}
                    {evidence.tags && evidence.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {evidence.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                      <span>Загружено: {new Date(evidence.uploadedAt || evidence.created_at).toLocaleDateString('ru-RU')}</span>
                      {evidence.fileSize && (
                        <span>Размер: {(evidence.fileSize / 1024).toFixed(1)} КБ</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Доказательства не добавлены</p>
              <p className="text-xs mt-1">Нажмите "Добавить" для загрузки доказательств</p>
            </div>
          )}
        </div>
      </CardContent>
      )}
      
      {/* Диалог добавления доказательства */}
      {(complianceId || measure.complianceRecordId) && (
        <UploadEvidenceForMeasureDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          complianceId={complianceId || measure.complianceRecordId || ''}
          controlMeasureId={measure.id}
          requirementId={requirementId}
          evidenceTypeMode={evidenceTypeMode}
          allowedEvidenceTypeIds={allowedEvidenceTypeIds}
          onSuccess={() => {
            setIsUploadDialogOpen(false)
            onUpdate?.()
          }}
        />
      )}
    </Card>
  )
}
