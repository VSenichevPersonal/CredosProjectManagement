"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Search } from "lucide-react"
import { LegalArticleFormDialog } from "./legal-article-form-dialog"
import { useToast } from "@/hooks/use-toast"

interface Framework {
  id: string
  code: string
  name: string
}

interface LegalArticle {
  id: string
  regulatory_framework_id: string
  article_number: string | null
  part: string | null
  paragraph: string | null
  clause: string | null
  subclause: string | null
  full_reference: string
  title: string | null
  content: string | null
  regulatory_framework?: {
    code: string
    name: string
  }
}

interface Props {
  frameworks: Framework[]
}

export function LegalArticlesManagementTable({ frameworks }: Props) {
  const { toast } = useToast()
  const [articles, setArticles] = useState<LegalArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<LegalArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFramework, setSelectedFramework] = useState<string>("all")
  const [editingArticle, setEditingArticle] = useState<LegalArticle | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadArticles = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/legal-articles")
      if (!response.ok) throw new Error("Failed to fetch articles")
      const data = await response.json()
      setArticles(data.data || [])
      setFilteredArticles(data.data || [])
    } catch (error) {
      console.error("Failed to load legal articles:", error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить статьи законодательства",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [])

  useEffect(() => {
    let filtered = articles

    // Filter by framework
    if (selectedFramework !== "all") {
      filtered = filtered.filter((a) => a.regulatory_framework_id === selectedFramework)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.full_reference.toLowerCase().includes(query) ||
          a.title?.toLowerCase().includes(query) ||
          a.regulatory_framework?.name.toLowerCase().includes(query),
      )
    }

    setFilteredArticles(filtered)
  }, [articles, selectedFramework, searchQuery])

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту статью?")) return

    try {
      const response = await fetch(`/api/legal-articles/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete article")
      }

      toast({
        title: "Статья удалена",
        description: "Статья законодательства успешно удалена",
      })

      loadArticles()
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить статью",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (article: LegalArticle) => {
    setEditingArticle(article)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingArticle(null)
    setIsDialogOpen(true)
  }

  const handleDialogClose = (success?: boolean) => {
    setIsDialogOpen(false)
    setEditingArticle(null)
    if (success) {
      loadArticles()
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Поиск</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по ссылке, названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-64">
          <label className="text-sm font-medium mb-2 block">Нормативный документ</label>
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все документы</SelectItem>
              {frameworks.map((fw) => (
                <SelectItem key={fw.id} value={fw.id}>
                  {fw.code} - {fw.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить статью
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Документ</TableHead>
              <TableHead>Ссылка</TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="w-24">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Статьи не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Badge variant="outline">{article.regulatory_framework?.code}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{article.full_reference}</TableCell>
                  <TableCell>
                    {article.title ? (
                      <div className="max-w-md truncate">{article.title}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Показано {filteredArticles.length} из {articles.length} статей
      </div>

      <LegalArticleFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        article={editingArticle}
        frameworks={frameworks}
      />
    </div>
  )
}
