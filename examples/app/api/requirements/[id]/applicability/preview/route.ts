import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ApplicabilityService } from "@/services/applicability-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { id } = params
    const body = await request.json()
    const { filterRules } = body

    console.log("[v0] Preview applicability with rules:", filterRules)

    const service = new ApplicabilityService(ctx.db)

    // Get all organizations
    const organizations = await ctx.db.organizations.findMany({})

    // Calculate which organizations match the filter rules
    const applicableOrgs = service.calculateApplicableOrganizations(organizations, filterRules)

    const allMappings = await ctx.db.applicability.getMappings(id)
    const manualIncludeMappings = allMappings.filter((m) => m.mappingType === "manual_include")
    const manualExcludeMappings = allMappings.filter((m) => m.mappingType === "manual_exclude")

    // Apply manual overrides
    const manualIncludeIds = manualIncludeMappings.map((m) => m.organizationId)
    const manualExcludeIds = manualExcludeMappings.map((m) => m.organizationId)

    const finalOrgs = [
      ...applicableOrgs.filter((o) => !manualExcludeIds.includes(o.id)),
      ...organizations.filter((o) => manualIncludeIds.includes(o.id) && !applicableOrgs.find((ao) => ao.id === o.id)),
    ]

    const result = {
      applicableOrganizations: finalOrgs.length,
      automaticCount: applicableOrgs.filter((o) => !manualExcludeIds.includes(o.id)).length,
      manualIncludeCount: manualIncludeIds.length,
      manualExcludeCount: manualExcludeIds.length,
      totalOrganizations: organizations.length,
      organizations: finalOrgs.map((org) => ({
        ...org,
        applicabilitySource: manualIncludeIds.includes(org.id)
          ? "manual_include"
          : manualExcludeIds.includes(org.id)
            ? "manual_exclude"
            : "automatic",
      })),
    }

    console.log("[v0] Preview result:", {
      applicableOrganizations: result.applicableOrganizations,
      automaticCount: result.automaticCount,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Failed to preview applicability:", error)
    return NextResponse.json({ error: "Failed to preview applicability" }, { status: 500 })
  }
}
