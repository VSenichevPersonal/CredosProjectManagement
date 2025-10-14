"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Minus, Edit, Download } from "lucide-react"
import type { DocumentDiff } from "@/types/domain/document"

interface DocumentDiffViewProps {
  documentId: string
  fromVersionId: string
  toVersionId: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DocumentDiffView({ documentId, fromVersionId, toVersionId }: DocumentDiffViewProps) {
  const [diffType, setDiffType] = useState<"text" | "visual">("text")

  // Fetch diff
  const { data: diffData, isLoading } = useSWR(
    `/api/documents/${documentId}/diff?from=${fromVersionId}&to=${toVersionId}&type=${diffType}`,
    fetcher,
  )

  const diff: DocumentDiff | null = diffData?.data || null

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <Spinner className="h-6 w-6" />
          <span className="text-sm text-muted-foreground">Сравниваем версии...</span>
        </div>
      </Card>
    )
  }

  if (!diff) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Не удалось загрузить сравнение</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                <span className="font-semibold">{diff.additionsCount}</span>
                <span className="text-muted-foreground ml-1">добавлено</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-red-500" />
              <span className="text-sm">
                <span className="font-semibold">{diff.deletionsCount}</span>
                <span className="text-muted-foreground ml-1">удалено</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                <span className="font-semibold">{diff.modificationsCount}</span>
                <span className="text-muted-foreground ml-1">изменено</span>
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </Card>

      {/* Diff content */}
      <Tabs value={diffType} onValueChange={(v) => setDiffType(v as any)}>
        <TabsList>
          <TabsTrigger value="text">Текстовое</TabsTrigger>
          <TabsTrigger value="visual">Визуальное</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4">
          <Card className="p-6">
            {diff.diffHtml ? (
              <div className="diff-unified" dangerouslySetInnerHTML={{ __html: diff.diffHtml }} />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Сравнение недоступно</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="mt-4">
          <Card className="p-0 overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                <div>Версия {diff.fromVersion?.versionNumber || "—"}</div>
                <div>Версия {diff.toVersion?.versionNumber}</div>
              </div>
            </div>
            <div className="diff-side-by-side p-4">
              <div className="diff-left">
                <div className="text-xs text-muted-foreground mb-2">Предыдущая версия</div>
                <div className="text-sm font-mono whitespace-pre-wrap">
                  {diff.diffData
                    ?.filter((c: any) => c.type !== "add")
                    .map((c: any) => c.content || c.oldContent)
                    .join("\n") || "—"}
                </div>
              </div>
              <div className="diff-right">
                <div className="text-xs text-muted-foreground mb-2">Текущая версия</div>
                <div className="text-sm font-mono whitespace-pre-wrap">
                  {diff.diffData
                    ?.filter((c: any) => c.type !== "delete")
                    .map((c: any) => c.content)
                    .join("\n") || "—"}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
