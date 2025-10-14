import { createExecutionContext } from "@/lib/context/create-context"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext()

    if (!ctx.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeEvidenceTypes = searchParams.get("includeEvidenceTypes") === "true"
    const includeLinkedEvidence = searchParams.get("includeLinkedEvidence") === "true"

    const query = ctx.db.supabase
      .from("control_measures")
      .select(
        `
        *,
        template:control_measure_templates(id, code, title, description),
        responsibleUser:users!control_measures_responsible_user_id_fkey(id, name, email),
        masterControl:organization_controls!control_measures_master_control_id_fkey(
          id, 
          implementation_status, 
          implementation_date,
          evidence_ids
        )
      `,
      )
      .eq("compliance_record_id", params.id)
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: true })

    const { data: measures, error } = await query

    if (error) throw error

    if (measures && (includeEvidenceTypes || includeLinkedEvidence)) {
      // ✅ OPTIMIZATION: Batch loading to avoid N+1 queries
      
      // Collect all evidence type IDs and measure IDs
      const allEvidenceTypeIds = new Set<string>()
      const allMeasureIds = measures.map(m => m.id)
      
      measures.forEach(measure => {
        if (measure.allowed_evidence_type_ids) {
          measure.allowed_evidence_type_ids.forEach(id => allEvidenceTypeIds.add(id))
        }
      })

      // Batch fetch evidence types (ONE query instead of N)
      let evidenceTypesMap = new Map<string, any>()
      if (includeEvidenceTypes && allEvidenceTypeIds.size > 0) {
        const { data: evidenceTypes } = await ctx.db.supabase
          .from("evidence_types")
          .select("id, code, title")
          .in("id", Array.from(allEvidenceTypeIds))

        evidenceTypes?.forEach(et => evidenceTypesMap.set(et.id, et))
      }

      // Batch fetch evidence links (ONE query instead of N)
      let evidenceLinksMap = new Map<string, any[]>()
      if (includeLinkedEvidence && allMeasureIds.length > 0) {
        const { data: allLinks } = await ctx.db.supabase
          .from("evidence_links")
          .select(`
            id,
            evidence_id,
            control_measure_id,
            relevance_score,
            link_reason,
            created_at,
            evidence:evidence_id (
              id,
              title,
              file_name,
              file_url,
              file_type,
              status,
              uploaded_at,
              evidence_type_id,
              evidence_types:evidence_type_id (
                id,
                title,
                code
              )
            )
          `)
          .in("control_measure_id", allMeasureIds)
          .eq("tenant_id", ctx.tenantId)
          .order("created_at", { ascending: false })

        // Group by measure_id
        allLinks?.forEach(link => {
          if (!evidenceLinksMap.has(link.control_measure_id)) {
            evidenceLinksMap.set(link.control_measure_id, [])
          }
          evidenceLinksMap.get(link.control_measure_id)!.push(link)
        })
      }

      // Enrich measures with fetched data
      const enrichedMeasures = measures.map(measure => {
        const enriched: any = { ...measure }

        // Add evidence types
        if (includeEvidenceTypes && measure.allowed_evidence_type_ids) {
          enriched.evidenceTypes = measure.allowed_evidence_type_ids
            .map(id => evidenceTypesMap.get(id))
            .filter(Boolean)
        }

        // Add linked evidence
        if (includeLinkedEvidence) {
          const links = evidenceLinksMap.get(measure.id) || []
          enriched.linkedEvidence = links
          enriched.linkedEvidenceCount = links.length
        }

        return enriched
      })

      return NextResponse.json({ data: enrichedMeasures })
    }

    return NextResponse.json({ data: measures || [] })
  } catch (error) {
    console.error("[v0] Failed to fetch control measures:", error)
    return NextResponse.json({ error: "Failed to fetch control measures" }, { status: 500 })
  }
}
