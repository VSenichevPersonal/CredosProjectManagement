/**
 * @intent: List of documents requiring attention (expiring or needing review)
 * @architecture: Scrollable list with action buttons
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, FileText, Calendar, RefreshCw, ExternalLink } from "lucide-react"
import { DocumentActualityIndicator } from "@/components/documents/document-actuality-indicator"
import useSWR from "swr"
import Link from "next/link"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface DocumentsAttentionListProps {
  organizationId?: string
  maxItems?: number
}

export function DocumentsAttentionList({ organizationId, maxItems = 10 }: DocumentsAttentionListProps) {
  const { data, isLoading } = useSWR(
    `/api/documents/actuality/attention${organizationId ? `?organizationId=${organizationId}` : ""}`,
    fetcher,
    { refreshInterval: 60000 },
  )

  const documents = data?.data || []
  const displayDocuments = documents.slice(0, maxItems)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Документы требующие внимания</CardTitle>
          <CardDescription>Загрузка...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Загрузка документов...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Документы требующие внимания
          </CardTitle>
          <CardDescription>Истекающие или требующие пересмотра</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Все документы актуальны</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Документы требующие внимания
            </CardTitle>
            <CardDescription>
              {documents.length} {documents.length === 1 ? "документ" : "документов"} требует внимания
            </CardDescription>
          </div>
          {documents.length > maxItems && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/documents?filter=attention">
                Все
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {displayDocuments.map((doc: any) => {
              const now = new Date()
              let daysUntilExpiry: number | undefined
              let daysUntilReview: number | undefined

              if (doc.expiresAt) {
                daysUntilExpiry = Math.ceil((new Date(doc.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              }

              if (doc.nextReviewDate) {
                daysUntilReview = Math.ceil(
                  (new Date(doc.nextReviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                )
              }

              return (
                <div key={doc.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition">
                  <DocumentActualityIndicator
                    status={doc.actualityStatus}
                    daysUntilExpiry={daysUntilExpiry}
                    daysUntilReview={daysUntilReview}
                    className="mt-1 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-sm leading-tight truncate">{doc.title || doc.fileName}</p>

                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {doc.expiresAt && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Истекает: {format(new Date(doc.expiresAt), "dd MMM yyyy", { locale: ru })}
                            {daysUntilExpiry !== undefined &&
                              ` (${daysUntilExpiry > 0 ? `через ${daysUntilExpiry} дн.` : `${Math.abs(daysUntilExpiry)} дн. назад`})`}
                          </span>
                        </div>
                      )}
                      {doc.nextReviewDate && (
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className="h-3 w-3" />
                          <span>
                            Пересмотр: {format(new Date(doc.nextReviewDate), "dd MMM yyyy", { locale: ru })}
                            {daysUntilReview !== undefined &&
                              ` (${daysUntilReview > 0 ? `через ${daysUntilReview} дн.` : `просрочен на ${Math.abs(daysUntilReview)} дн.`})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
                    <Link href={`/documents/${doc.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
