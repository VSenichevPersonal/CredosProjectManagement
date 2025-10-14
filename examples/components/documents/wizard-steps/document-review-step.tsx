"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Check, AlertTriangle, Edit, Save, ChevronDown, ChevronUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SaveDocumentsDialog } from "@/components/documents/save-documents-dialog"

interface DocumentReviewStepProps {
  packageId: string
  wizardData: Record<string, any>
  onNext: (data?: Record<string, any>) => void
  onBack: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

export function DocumentReviewStep({
  wizardData,
}: DocumentReviewStepProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState(wizardData.generatedDocuments || [])
  const [editingDoc, setEditingDoc] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  const handleEdit = (docId: string, content: string) => {
    setEditingDoc(docId)
    setEditedContent((prev) => ({ ...prev, [docId]: content }))
  }

  const handleSaveEdit = (docId: string) => {
    setDocuments((prev: any[]) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, content: editedContent[docId] || doc.content } : doc,
      ),
    )
    setEditingDoc(null)
  }

  const handleSaveDocuments = async (selectedDocs: any[], options: any) => {
    try {
      // TODO: Реальное сохранение через API
      // Пока имитация
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Показываем успех
      console.log('Saved:', selectedDocs.length, 'documents', options)
      
      // Перенаправляем на страницу документов
      router.push("/documents?success=generated")
      
    } catch (error) {
      console.error('Save error:', error)
      throw error
    }
  }

  const confidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-green-100 text-green-800"
    if (confidence >= 75) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  // Группировка документов по категориям
  const documentsByCategory = {
    policies: documents.slice(0, 5),
    instructions: documents.slice(5, 10),
    orders: documents.slice(10, 15),
  }

  return (
    <div className="space-y-6">
      {/* Информация */}
      <Alert>
        <Check className="h-4 w-4" />
        <AlertDescription>
          Успешно сгенерировано {documents.length} документов! Просмотрите их и при необходимости отредактируйте. После проверки нажмите "Сохранить все документы".
        </AlertDescription>
      </Alert>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-sm text-muted-foreground">Документов сгенерировано</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(documents.reduce((sum: number, doc: any) => sum + doc.confidence, 0) / documents.length)}%
            </div>
            <p className="text-sm text-muted-foreground">Средняя уверенность</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {documents.filter((d: any) => d.confidence < 90).length}
            </div>
            <p className="text-sm text-muted-foreground">Требуют проверки</p>
          </CardContent>
        </Card>
      </div>

      {/* Документы по категориям */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Сгенерированные документы</h3>
        
        <Accordion type="multiple" className="w-full">
          {/* Категория А */}
          <AccordionItem value="policies">
            <AccordionTrigger className="text-base font-semibold">
              Категория А: Политики и положения ({documentsByCategory.policies.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {documentsByCategory.policies.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isEditing={editingDoc === doc.id}
                    editedContent={editedContent[doc.id]}
                    onEdit={handleEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingDoc(null)}
                    onEditedContentChange={(content) =>
                      setEditedContent((prev) => ({ ...prev, [doc.id]: content }))
                    }
                    confidenceColor={confidenceColor}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Категория Б */}
          <AccordionItem value="instructions">
            <AccordionTrigger className="text-base font-semibold">
              Категория Б: Инструкции и регламенты ({documentsByCategory.instructions.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {documentsByCategory.instructions.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isEditing={editingDoc === doc.id}
                    editedContent={editedContent[doc.id]}
                    onEdit={handleEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingDoc(null)}
                    onEditedContentChange={(content) =>
                      setEditedContent((prev) => ({ ...prev, [doc.id]: content }))
                    }
                    confidenceColor={confidenceColor}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Категория В */}
          <AccordionItem value="orders">
            <AccordionTrigger className="text-base font-semibold">
              Категория В: ОРД и приказы ({documentsByCategory.orders.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {documentsByCategory.orders.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isEditing={editingDoc === doc.id}
                    editedContent={editedContent[doc.id]}
                    onEdit={handleEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingDoc(null)}
                    onEditedContentChange={(content) =>
                      setEditedContent((prev) => ({ ...prev, [doc.id]: content }))
                    }
                    confidenceColor={confidenceColor}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Сохранение */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-6">
          <div className="space-y-1">
            <h3 className="font-semibold">Готовы сохранить документы в библиотеку?</h3>
            <p className="text-sm text-muted-foreground">
              Выберите документы и укажите параметры для сохранения
            </p>
          </div>
          <Button size="lg" onClick={() => setSaveDialogOpen(true)}>
            <Check className="mr-2 h-4 w-4" />
            Сохранить документы в библиотеку
          </Button>
        </CardContent>
      </Card>
      
      {/* Диалог сохранения */}
      <SaveDocumentsDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        documents={documents}
        onSave={handleSaveDocuments}
      />
    </div>
  )
}

// Компонент карточки документа
function DocumentCard({
  doc,
  isEditing,
  editedContent,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditedContentChange,
  confidenceColor,
}: {
  doc: any
  isEditing: boolean
  editedContent?: string
  onEdit: (id: string, content: string) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onEditedContentChange: (content: string) => void
  confidenceColor: (confidence: number) => string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <FileText className="h-5 w-5 text-primary mt-1" />
            <div className="space-y-1 flex-1">
              <CardTitle className="text-base">{doc.title}</CardTitle>
              <CardDescription className="text-xs">Сгенерировано Львом Львовичем</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={confidenceColor(doc.confidence)}>
              {doc.confidence}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Предупреждения */}
        {doc.confidence < 90 && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Рекомендуем проверить этот документ вручную
            </AlertDescription>
          </Alert>
        )}

        {/* Контент */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent || doc.content}
              onChange={(e) => onEditedContentChange(e.target.value)}
              rows={15}
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onSaveEdit(doc.id)}>
                <Save className="mr-2 h-3 w-3" />
                Сохранить
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg border bg-muted/30 p-4 max-h-64 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-xs">
                  {doc.content}
                </pre>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(doc.id, doc.content)}
              >
                <Edit className="mr-2 h-3 w-3" />
                Редактировать
              </Button>
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-3 w-3" />
                Скачать DOCX
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

