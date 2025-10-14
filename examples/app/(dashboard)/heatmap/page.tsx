import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ComplianceHeatmap } from "@/components/heatmap/compliance-heatmap"

export default async function HeatmapPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch heatmap data
  const [requirementsRes, organizationsRes, complianceRes] = await Promise.all([
    supabase.from("requirements").select("id, code, title, regulator_id, criticality").order("code"),
    supabase
      .from("organizations")
      .select(
        `
        id, 
        name, 
        parent_id,
        type_id,
        organization_types (
          code,
          name
        )
      `,
      )
      .order("name"),
    supabase.from("compliance_records").select("requirement_id, organization_id, status"),
  ])

  if (requirementsRes.error || organizationsRes.error || complianceRes.error) {
    console.error("[v0] Failed to fetch heatmap data", {
      requirementsError: requirementsRes.error,
      organizationsError: organizationsRes.error,
      complianceError: complianceRes.error,
    })
  }

  // Build matrix
  const matrix: Record<string, Record<string, string>> = {}
  requirementsRes.data?.forEach((req) => {
    matrix[req.id] = {}
    organizationsRes.data?.forEach((org) => {
      const complianceRecord = complianceRes.data?.find(
        (c) => c.requirement_id === req.id && c.organization_id === org.id,
      )
      matrix[req.id][org.id] = complianceRecord?.status || "not_assigned"
    })
  })

  const heatmapData = {
    requirements: requirementsRes.data || [],
    organizations: organizationsRes.data || [],
    matrix,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Тепловая карта комплаенса</h1>
        <p className="text-muted-foreground mt-2">Визуализация статусов выполнения требований по всем организациям</p>
      </div>

      <ComplianceHeatmap data={heatmapData} />
    </div>
  )
}
