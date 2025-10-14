"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Edit, FileText, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { DocumentVersionsView } from "./document-versions-view"
import { DocumentAnalysisView } from "./document-analysis-view"
import { DocumentDiffView } from "./document-diff-view"
import type { Document, DocumentVersion, DocumentAnalysis } from "@/types/domain/document"

interface DocumentDetailViewProps {
  document: Document
  initialVersions: DocumentVersion[]
  initialAnalyses: DocumentAnalysis[]
}

export function DocumentDetailView({ document, initialVersions, initialAnalyses }: DocumentDetailViewProps) {
  const router = useRouter()
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])

  const currentVersion = initialVersions.find((v) => v.isCurrent)
  const previousVersion = initialVersions.find((v) => !v.isCurrent && v.majorVersion === currentVersion?.majorVersion)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "needs_update":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ok":
        return "Актуален"
      case "needs_update":
        return "Требует обновления"
      case "expired":
        return "Истек"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{document.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={getStatusColor(document.documentStatus || "ok")}>
                {getStatusLabel(document.documentStatus || "ok")}
              </Badge>
              {currentVersion && (
                <span className="text-sm text-muted-foreground">Версия {currentVersion.versionNumber}</span>
              )}
              {document.expiresAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Действует до {new Date(document.expiresAt).toLocaleDateString("ru-RU")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Скачать
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Описание</h3>
            <p className="text-sm">{document.description || "Нет описания"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Метаданные</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип файла:</span>
                <span className="font-medium">{document.fileType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Размер:</span>
                <span className="font-medium">{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Загружен:</span>
                <span className="font-medium">{new Date(document.uploadedAt).toLocaleDateString("ru-RU")}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="versions" className="w-full">
        <TabsList>
          <TabsTrigger value="versions">
            <FileText className="h-4 w-4 mr-2" />
            Версии ({initialVersions.length})
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <AlertCircle className="h-4 w-4 mr-2" />
            AI Анализ
          </TabsTrigger>
          {selectedVersions.length === 2 && (
            <TabsTrigger value="diff">
              <FileText className="h-4 w-4 mr-2" />
              Сравнение
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="versions" className="mt-6">
          <DocumentVersionsView
            document={document}
            initialVersions={initialVersions}
            onVersionsSelected={setSelectedVersions}
          />
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          {currentVersion && (
            <DocumentAnalysisView
              documentId={document.id}
              currentVersionId={currentVersion.id}
              previousVersionId={previousVersion?.id}
            />
          )}
        </TabsContent>

        {selectedVersions.length === 2 && (
          <TabsContent value="diff" className="mt-6">
            <DocumentDiffView
              documentId={document.id}
              fromVersionId={selectedVersions[0]}
              toVersionId={selectedVersions[1]}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
