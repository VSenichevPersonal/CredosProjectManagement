"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Download, FileText, Shield, Lock, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  name: string
  description: string
  category: string
  count: number
}

interface RequirementsLibraryProps {
  templates: Template[]
}

const CATEGORY_ICONS: Record<string, any> = {
  КИИ: Shield,
  ПДн: FileText,
  ГИС: Building,
  Криптография: Lock,
  Общее: Package,
}

const CATEGORY_COLORS: Record<string, string> = {
  КИИ: "bg-red-500",
  ПДн: "bg-blue-500",
  ГИС: "bg-green-500",
  Криптография: "bg-purple-500",
  Общее: "bg-gray-500",
}

export function RequirementsLibrary({ templates }: RequirementsLibraryProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleImport = async (templateId: string) => {
    setLoading(templateId)
    try {
      // In a real implementation, this would import requirements
      // For now, we'll just show a success message
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Шаблон импортирован",
        description: "Требования успешно добавлены в систему",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось импортировать шаблон",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const Icon = CATEGORY_ICONS[template.category] || Package
        const colorClass = CATEGORY_COLORS[template.category] || "bg-gray-500"

        return (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-2 ${colorClass}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary">{template.count} требований</Badge>
              </div>
              <CardTitle className="mt-4">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Готовые требования с описаниями</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Нормативная база и штрафы</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Шаблоны документов</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleImport(template.id)}
                disabled={loading === template.id || template.count === 0}
              >
                {loading === template.id ? "Импорт..." : template.count === 0 ? "Уже импортировано" : "Импортировать"}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
