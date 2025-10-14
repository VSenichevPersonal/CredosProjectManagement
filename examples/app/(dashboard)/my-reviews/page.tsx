import { Suspense } from "react"
import { History, Filter, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function MyReviewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">История проверок</h1>
          <p className="text-muted-foreground mt-1">Результаты проверок и аудитов вашей организации</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск проверок..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Suspense fallback={<div>Загрузка...</div>}>
        <ReviewsList />
      </Suspense>
    </div>
  )
}

async function ReviewsList() {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <History className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold">Нет проверок</h3>
          <p className="text-sm text-muted-foreground mt-1">История проверок появится после проведения аудитов</p>
        </div>
      </div>
    </Card>
  )
}
