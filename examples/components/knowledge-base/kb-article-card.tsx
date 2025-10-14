import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, ThumbsUp } from "lucide-react"
import { formatDate } from "@/lib/utils/date"

interface KBArticleCardProps {
  article: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    category: string
    regulator: string | null
    requirement_type: string | null
    tags: string[]
    views: number
    helpful_count: number
    created_at: string
  }
}

export function KBArticleCard({ article }: KBArticleCardProps) {
  return (
    <Link href={`/knowledge-base/${article.slug}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">{article.title}</h3>
            <Badge variant="outline" className="flex-shrink-0">
              {article.category}
            </Badge>
          </div>

          {article.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>}

          <div className="flex flex-wrap gap-2">
            {article.regulator && (
              <Badge variant="secondary" className="text-xs">
                {article.regulator}
              </Badge>
            )}
            {article.requirement_type && (
              <Badge variant="secondary" className="text-xs">
                {article.requirement_type}
              </Badge>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>{formatDate(article.created_at)}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.views}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {article.helpful_count}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
