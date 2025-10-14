"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, FileText } from "lucide-react"
import { LegalArticleFormDialog } from "./legal-article-form-dialog"
import type { LegalArticle } from "@/types/domain/legal-article"

interface LegalArticlesTableProps {
  regulatoryFrameworkId: string
}

export function LegalArticlesTable({ regulatoryFrameworkId }: LegalArticlesTableProps) {
  const [articles, setArticles] = useState<LegalArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<LegalArticle | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [regulatoryFrameworkId])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching legal articles for framework:", regulatoryFrameworkId)

      const response = await fetch(`/api/legal-articles?regulatory_framework_id=${regulatoryFrameworkId}`)

      console.log("[v0] Legal articles response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Legal articles error response:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || "Failed to fetch legal articles")
        } catch {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()
      console.log("[v0] Legal articles loaded successfully:", {
        count: data.data?.length || 0,
        frameworkId: regulatoryFrameworkId,
      })
      setArticles(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to load legal articles:", error)
      console.error("[v0] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        frameworkId: regulatoryFrameworkId,
      })
      alert("Не удалось загрузить пункты документа. Проверьте права доступа.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedArticle(null)
    setDialogOpen(true)
  }

  const handleEdit = (article: LegalArticle) => {
    setSelectedArticle(article)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот пункт?")) return

    try {
      const response = await fetch(`/api/legal-articles/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete article")

      fetchArticles()
    } catch (error) {
      console.error("[v0] Failed to delete article:", error)
      alert("Не удалось удалить пункт")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Пункты нормативного документа</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Статьи, части, параграфы и пункты, на которые могут ссылаться требования
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить пункт
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">Пункты не добавлены</p>
            <Button variant="outline" size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить первый пункт
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Полная ссылка</TableHead>
                <TableHead>Статья</TableHead>
                <TableHead>Часть</TableHead>
                <TableHead>Параграф</TableHead>
                <TableHead>Пункт</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.fullReference}</TableCell>
                  <TableCell>
                    {article.articleNumber ? <Badge variant="outline">{article.articleNumber}</Badge> : "—"}
                  </TableCell>
                  <TableCell>{article.part || "—"}</TableCell>
                  <TableCell>{article.paragraph || "—"}</TableCell>
                  <TableCell>{article.clause || "—"}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-sm text-muted-foreground">{article.title || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.isActive ? "default" : "secondary"}>
                      {article.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(article)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <LegalArticleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={selectedArticle}
        regulatoryFrameworkId={regulatoryFrameworkId}
        onSuccess={fetchArticles}
      />
    </Card>
  )
}
