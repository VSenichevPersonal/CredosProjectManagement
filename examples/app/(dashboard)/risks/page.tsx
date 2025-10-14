import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RiskMatrix } from "@/components/risks/risk-matrix"
import { RiskList } from "@/components/risks/risk-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { logger } from "@/lib/logger"

export default async function RisksPage() {
  logger.info("[v0] Risks page: Loading")

  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data: risks } = await supabase
    .from("risks")
    .select(`
      *,
      organization:organizations(name),
      category:risk_categories(name, color),
      owner:users(name)
    `)
    .order("risk_score", { ascending: false })

  const { data: stats } = await supabase.from("risks").select("risk_level, status")

  const totalRisks = stats?.length || 0
  const criticalRisks = stats?.filter((r) => r.risk_level === "critical").length || 0
  const highRisks = stats?.filter((r) => r.risk_level === "high").length || 0
  const openRisks = stats?.filter((r) => r.status !== "closed" && r.status !== "accepted").length || 0

  logger.info("[v0] Risks page: Data loaded", { totalRisks, criticalRisks })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление рисками</h1>
          <p className="text-muted-foreground">Оценка и мониторинг рисков комплаенса</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Добавить риск
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Всего рисков</h3>
          <p className="text-3xl font-bold mt-2">{totalRisks}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Критические</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">{criticalRisks}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Высокие</h3>
          <p className="text-3xl font-bold mt-2 text-orange-600">{highRisks}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Открытые</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{openRisks}</p>
        </div>
      </div>

      <RiskMatrix risks={risks || []} />

      <RiskList risks={risks || []} />
    </div>
  )
}
