"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Scale, FileText, LinkIcon } from "lucide-react"
import { RegulatoryFrameworkBadge } from "@/components/ui/regulatory-framework-badge"
import { LegalArticlesTable } from "@/components/admin/legal-articles-table"
import type { RegulatoryFramework } from "@/types/domain/regulatory-framework"
import type { RegulatoryDocumentType } from "@/types/domain/regulatory-document-type"

export default function RegulatoryFrameworkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [framework, setFramework] = useState<RegulatoryFramework | null>(null)
  const [loading, setLoading] = useState(true)
  const [documentType, setDocumentType] = useState<RegulatoryDocumentType | null>(null)

  useEffect(() => {
    fetchFramework()
  }, [params.id])

  const fetchFramework = async () => {
    try {
      const response = await fetch(`/api/dictionaries/regulatory-frameworks/${params.id}`)
      const data = await response.json()
      setFramework(data.data)

      if (data.data?.documentTypeId) {
        const typeResponse = await fetch(`/api/admin/regulatory-document-types/${data.data.documentTypeId}`)
        const typeData = await typeResponse.json()
        setDocumentType(typeData.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch framework:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  if (!framework) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Нормативный документ не найден</p>
        <Button onClick={() => router.back()}>Вернуться назад</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{framework.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <RegulatoryFrameworkBadge
                  code={framework.code}
                  badgeText={framework.badgeText}
                  badgeColor={framework.badgeColor}
                />
                {documentType && (
                  <Badge variant="secondary" className="text-xs">
                    {documentType.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" />
            Общая информация
          </TabsTrigger>
          <TabsTrigger value="articles">
            <LinkIcon className="h-4 w-4 mr-2" />
            Пункты документа
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Описание</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{framework.description || "Описание отсутствует"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Метаданные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Код документа</p>
                  <p className="text-sm">{framework.code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Вид документации</p>
                  <p className="text-sm">{documentType?.name || "Не указан"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата вступления в силу</p>
                  <p className="text-sm">
                    {framework.effectiveDate
                      ? new Date(framework.effectiveDate).toLocaleDateString("ru-RU")
                      : "Не указана"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Статус</p>
                  <Badge variant="outline" className="text-xs">
                    Действует
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Создан</p>
                  <p className="text-sm">{new Date(framework.createdAt).toLocaleDateString("ru-RU")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles">
          <LegalArticlesTable regulatoryFrameworkId={framework.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
