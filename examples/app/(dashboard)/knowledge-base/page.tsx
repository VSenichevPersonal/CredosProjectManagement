import { Badge } from "@/components/ui/badge"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KBArticleCard } from "@/components/knowledge-base/kb-article-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function KnowledgeBasePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: articles } = await supabase
    .from("legal_articles")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(12)

  const { data: templates } = await supabase
    .from("control_templates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">База знаний</h1>
        <p className="text-muted-foreground mt-2">
          Методические рекомендации, шаблоны документов и ответы на частые вопросы
        </p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Поиск по базе знаний..." className="pl-9" />
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{articles?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Статей</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Download className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{templates?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Шаблонов</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Search className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold">4</div>
              <div className="text-sm text-muted-foreground">Регулятора</div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Последние статьи</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/knowledge-base/articles">Все статьи</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles?.map((article) => (
            <KBArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Популярные шаблоны</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/knowledge-base/templates">Все шаблоны</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm line-clamp-2">{template.title}</h3>
                  <Badge variant="outline" className="flex-shrink-0 text-xs">
                    {template.file_type.toUpperCase()}
                  </Badge>
                </div>
                {template.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{template.downloads} скачиваний</span>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Скачать
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
