import { Suspense } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function MyCalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Календарь подтверждений</h1>
          <p className="text-muted-foreground mt-1">Сроки подтверждения выполнения мер и требований</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Январь 2025</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Suspense fallback={<div>Загрузка...</div>}>
        <CalendarView />
      </Suspense>
    </div>
  )
}

async function CalendarView() {
  return (
    <div className="grid gap-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Ближайшие события</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Подтверждение мер защиты</p>
                <p className="text-sm text-muted-foreground">15 января 2025</p>
              </div>
            </div>
            <Badge variant="outline">Через 5 дней</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold">Календарь пуст</h3>
            <p className="text-sm text-muted-foreground mt-1">
              События появятся после назначения требований с дедлайнами
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
