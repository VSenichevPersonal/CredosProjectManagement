/**
 * @intent: Selector for evidence source (file, document, or create new)
 * @llm-note: Key component for linking documents and evidence
 */

"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Paperclip, FileText, Sparkles, Lightbulb } from "lucide-react"
import { FileUploader } from "@/components/shared/file-uploader"
import { DocumentSelector } from "@/components/documents/document-selector"
import { CreateDocumentForm } from "@/components/documents/create-document-form"
import type { Document } from "@/types/domain/document"
import { useToast } from "@/hooks/use-toast"

interface EvidenceSourceSelectorProps {
  complianceRecordId?: string
  requirementId?: string
  controlMeasureId?: string
  recommendedTemplates?: any[]
  onEvidenceCreated: (evidence: any) => void
}

export function EvidenceSourceSelector({
  complianceRecordId,
  requirementId,
  controlMeasureId,
  recommendedTemplates = [],
  onEvidenceCreated
}: EvidenceSourceSelectorProps) {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  
  const createEvidenceFromFile = async (file: File, uploadedUrl: string, evidenceTypeId: string) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: file.name,
          file_url: uploadedUrl,
          file_type: file.type,
          file_size: file.size,
          compliance_record_id: complianceRecordId,
          requirement_id: requirementId,
          evidence_type_id: evidenceTypeId
        })
      })
      
      if (!response.ok) throw new Error('Failed to create evidence')
      
      const data = await response.json()
      onEvidenceCreated(data.data)
      
      toast({
        title: "Доказательство добавлено",
        description: "Файл успешно загружен"
      })
    } catch (error) {
      console.error('[EvidenceSourceSelector] Failed to create evidence:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать доказательство",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }
  
  const createEvidenceFromDocument = async (document: Document) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: document.id,
          compliance_record_id: complianceRecordId,
          requirement_id: requirementId,
          evidence_type_id: document.documentType?.defaultEvidenceTypeId,
          title: document.title
        })
      })
      
      if (!response.ok) throw new Error('Failed to create evidence')
      
      const data = await response.json()
      
      // Связать с мерой если указана
      if (controlMeasureId) {
        await fetch('/api/evidence-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evidence_id: data.data.id,
            control_measure_id: controlMeasureId
          })
        })
      }
      
      onEvidenceCreated(data.data)
      
      toast({
        title: "Доказательство добавлено",
        description: "Документ успешно связан"
      })
    } catch (error) {
      console.error('[EvidenceSourceSelector] Failed to create evidence from document:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать доказательство из документа",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }
  
  const createDocumentAndEvidence = async (documentData: any) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/documents/create-with-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createDocument: documentData,
          evidence: {
            compliance_record_id: complianceRecordId,
            requirement_id: requirementId,
            evidence_type_id: documentData.evidenceTypeId
          },
          control_measure_ids: controlMeasureId ? [controlMeasureId] : []
        })
      })
      
      if (!response.ok) throw new Error('Failed to create document with evidence')
      
      const data = await response.json()
      onEvidenceCreated(data.data)
      
      toast({
        title: "Создано",
        description: "Документ создан и добавлен как доказательство"
      })
    } catch (error) {
      console.error('[EvidenceSourceSelector] Failed to create document with evidence:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать документ",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <Tabs defaultValue="file" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="file">
          <Paperclip className="h-4 w-4 mr-2" />
          Файл
        </TabsTrigger>
        <TabsTrigger value="document">
          <FileText className="h-4 w-4 mr-2" />
          Документ
        </TabsTrigger>
        <TabsTrigger value="create">
          <Sparkles className="h-4 w-4 mr-2" />
          Создать
        </TabsTrigger>
      </TabsList>
      
      {/* Вкладка 1: Загрузка файла */}
      <TabsContent value="file" className="mt-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Загрузите файл (скриншот, лог, конфигурацию и т.д.)
          </p>
          <FileUploader
            onUpload={(file, url, typeId) => createEvidenceFromFile(file, url, typeId)}
            disabled={isCreating}
          />
        </div>
      </TabsContent>
      
      {/* Вкладка 2: Выбор существующего документа */}
      <TabsContent value="document" className="mt-4">
        <div className="space-y-4">
          {recommendedTemplates.length > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <span className="font-medium text-blue-900">
                  💡 Рекомендуемые документы:
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recommendedTemplates.map(t => (
                    <Badge key={t.id} variant="secondary" className="text-xs">
                      {t.title}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-muted-foreground">
            Выберите существующий документ из библиотеки
          </p>
          
          <DocumentSelector
            onSelect={createEvidenceFromDocument}
            disabled={isCreating}
          />
        </div>
      </TabsContent>
      
      {/* Вкладка 3: Создание нового документа */}
      <TabsContent value="create" className="mt-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Создайте новый документ из шаблона
          </p>
          
          <CreateDocumentForm
            recommendedTemplates={recommendedTemplates}
            onCreated={createDocumentAndEvidence}
            disabled={isCreating}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}

