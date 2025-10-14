import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { Permission } from "@/lib/access-control/permissions"
import { handleApiError } from "@/lib/utils/errors"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require(Permission.REPORT_VIEW)

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 })
    }

    // Check access to organization
    if (!(await ctx.access.canAccessOrganization(organizationId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const supabase = await createClient()

    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select(`
        *,
        type:organization_types(name)
      `)
      .eq("id", organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const { data: complianceData, error: complianceError } = await supabase
      .from("requirements")
      .select(`
        id,
        title,
        description,
        criticality,
        compliance_records!left(
          id,
          status,
          notes,
          assessed_at,
          assessed_by,
          updated_at,
          deadline,
          next_review_date
        ),
        requirement_legal_references!left(
          is_primary,
          relevance_note,
          legal_articles(
            id,
            full_reference,
            article_number,
            part,
            paragraph
          )
        )
      `)
      .eq("tenant_id", ctx.user!.tenantId!)
      .eq("compliance_records.organization_id", organizationId)

    if (complianceError) {
      console.error("[v0] API Error:", complianceError.message)
      throw complianceError
    }

    const complianceRecordIds = (complianceData || [])
      .map((req: any) => req.compliance_records?.[0]?.id)
      .filter(Boolean)

    let evidenceMap: Record<string, any[]> = {}
    if (complianceRecordIds.length > 0) {
      const { data: evidenceData } = await supabase
        .from("evidence")
        .select("id, title, file_name, file_url, uploaded_at, compliance_record_id")
        .in("compliance_record_id", complianceRecordIds)

      if (evidenceData) {
        evidenceMap = evidenceData.reduce(
          (acc, ev) => {
            if (!acc[ev.compliance_record_id]) {
              acc[ev.compliance_record_id] = []
            }
            acc[ev.compliance_record_id].push(ev)
            return acc
          },
          {} as Record<string, any[]>,
        )
      }
    }

    // Format response
    const report = {
      organization: {
        ...organization,
        type_name: organization.type?.name,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: ctx.user!.id,
      requirements: (complianceData || []).map((req: any, index: number) => {
        const compliance = req.compliance_records?.[0]
        const legalRefs =
          req.requirement_legal_references?.map((ref: any) => ({
            ...ref.legal_articles,
            is_primary: ref.is_primary,
            relevance_note: ref.relevance_note,
          })) || []

        return {
          number: index + 1,
          requirement: {
            id: req.id,
            title: req.title,
            description: req.description,
            criticality: req.criticality,
          },
          compliance: {
            id: compliance?.id,
            status: compliance?.status || "not_started",
            answer:
              compliance?.status === "approved"
                ? "Да"
                : compliance?.status === "not_applicable"
                  ? "Неприменимо"
                  : "Нет",
            notes: compliance?.notes,
            assessedAt: compliance?.assessed_at,
            assessedBy: compliance?.assessed_by,
            updatedAt: compliance?.updated_at,
            deadline: compliance?.deadline,
            nextReviewDate: compliance?.next_review_date,
          },
          legalReferences: legalRefs,
          evidence: compliance?.id ? evidenceMap[compliance.id] || [] : [],
        }
      }),
    }

    return NextResponse.json(report)
  } catch (error) {
    return handleApiError(error)
  }
}
