import { Suspense } from "react"
import { ShieldCheck, Filter, Search, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MyCompliancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Меры и доказательства</h1>
          <p className="text-muted-foreground mt-1">Управление мерами защиты и доказательствами их выполнения</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Добавить доказательство
        </Button>
      </div>

      <Tabs defaultValue="measures" className="w-full">
        <TabsList>
          <TabsTrigger value="measures">Меры защиты</TabsTrigger>
          <TabsTrigger value="evidence">Доказательства</TabsTrigger>
        </TabsList>

        <TabsContent value="measures" className="mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск мер..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <Suspense fallback={<div>Загрузка...</div>}>
            <MyMeasuresList />
          </Suspense>
        </TabsContent>

        <TabsContent value="evidence" className="mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск доказательств..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <Suspense fallback={<div>Загрузка...</div>}>
            <MyEvidenceList />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function MyMeasuresList() {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold">Нет назначенных мер</h3>
          <p className="text-sm text-muted-foreground mt-1">Меры защиты появятся после назначения требований</p>
        </div>
      </div>
    </Card>
  )
}

async function MyEvidenceList() {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold">Нет доказательств</h3>
          <p className="text-sm text-muted-foreground mt-1">Загрузите доказательства выполнения мер защиты</p>
        </div>
      </div>
    </Card>
  )
}
