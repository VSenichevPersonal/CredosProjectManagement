import { createExecutionContext } from "@/lib/context/create-context"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext()

    if (!ctx.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch control measures for this compliance record
    const { data: measures, error: measuresError } = await ctx.db.supabase
      .from("control_measures")
      .select("id, status")
      .eq("compliance_record_id", params.id)
      .eq("tenant_id", ctx.tenantId)

    if (measuresError) throw measuresError

    // Fetch evidence for this compliance record
    const { data: evidence, error: evidenceError } = await ctx.db.supabase
      .from("evidence")
      .select("id")
      .eq("compliance_record_id", params.id)
      .eq("tenant_id", ctx.tenantId)

    if (evidenceError) throw evidenceError

    const measureIds = measures?.map((m) => m.id) || []
    let links: any[] = []

    if (measureIds.length > 0) {
      const { data: linksData, error: linksError } = await ctx.db.supabase
        .from("evidence_links")
        .select("control_measure_id, evidence_id")
        .in("control_measure_id", measureIds)
        .eq("tenant_id", ctx.tenantId)

      if (linksError) {
        console.error("[v0] Links fetch error:", linksError)
        // Continue without links if there's an error
      } else {
        links = linksData || []
      }
    }

    // Calculate progress
    const totalMeasures = measures?.length || 0
    const completedMeasures =
      measures?.filter((m) => {
        // Measure is completed if status is "verified" OR it has linked evidence
        const hasEvidence = links?.some((l) => l.control_measure_id === m.id)
        return m.status === "verified" || hasEvidence
      }).length || 0

    const measuresProgress = totalMeasures > 0 ? Math.round((completedMeasures / totalMeasures) * 100) : 0

    const totalEvidence = evidence?.length || 0
    const linkedEvidence = new Set(links?.map((l) => l.evidence_id) || []).size

    return NextResponse.json({
      progress: measuresProgress,
      measures: {
        total: totalMeasures,
        completed: completedMeasures,
      },
      evidence: {
        total: totalEvidence,
        linked: linkedEvidence,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to calculate progress:", error)
    return NextResponse.json({ error: "Failed to calculate progress" }, { status: 500 })
  }
}
