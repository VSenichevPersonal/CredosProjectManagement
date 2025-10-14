import type { Metadata } from "next"
import { Scale, Package, Download, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Нормативы | Маркетплейс",
  description: "Типовые нормативные документы из маркетплейса",
}

export default function MarketplaceNormativesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Нормативы</h1>
          <p className="text-muted-foreground">Типовые нормативные документы из маркетплейса</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Синхронизация
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск нормативов..." className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Маркетплейс нормативов</CardTitle>
              <CardDescription>Функционал в разработке</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/50" />
            <div>
              <p className="text-lg font-medium">Раздел в разработке</p>
              <p className="text-sm text-muted-foreground">
                Здесь будут отображаться типовые нормативные документы из маркетплейса
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
