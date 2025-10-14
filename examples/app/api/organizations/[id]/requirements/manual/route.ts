import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getDatabaseProvider } from "@/providers/supabase-provider"
import { OrganizationRequirementsService } from "@/services/organization-requirements-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: organizationId } = params
    const body = await request.json()

    const db = getDatabaseProvider(true)
    const service = new OrganizationRequirementsService(db)

    if (body.action === "add_single") {
      await service.addManualRequirement(organizationId, body.requirementId, body.reason, user.id)
    } else if (body.action === "add_by_filter") {
      const count = await service.addRequirementsByFilter(organizationId, body.filters, body.reason, user.id)
      const result = await service.getOrganizationRequirements(organizationId)
      return NextResponse.json({ ...result, addedCount: count })
    } else if (body.action === "remove") {
      await service.removeManualRequirement(organizationId, body.requirementId)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await service.getOrganizationRequirements(organizationId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Failed to update organization requirements:", error)
    return NextResponse.json({ error: "Failed to update organization requirements" }, { status: 500 })
  }
}
