import { NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { OrganizationService } from "@/services/organization-service"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: Request) {
  try {
    console.log("[v0] [Organizations API] Starting request")

    const ctx = await createExecutionContext(request)
    console.log("[v0] [Organizations API] Context created", { tenantId: ctx.tenantId })

    const organizations = await OrganizationService.list(ctx)
    console.log("[v0] [Organizations API] Organizations fetched", { count: organizations.length })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error("[v0] [Organizations API] Error:", error)
    console.error("[v0] [Organizations API] Error stack:", error instanceof Error ? error.stack : "No stack")
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] [Organizations API] Creating organization")

    const ctx = await createExecutionContext(request)

    const body = await request.json()
    console.log("[v0] [Organizations API] Request body", { name: body.name })

    const organization = await OrganizationService.create(ctx, body)
    console.log("[v0] [Organizations API] Organization created", { id: organization.id })

    return NextResponse.json({ data: organization }, { status: 201 })
  } catch (error) {
    console.error("[v0] [Organizations API] Error:", error)
    console.error("[v0] [Organizations API] Error stack:", error instanceof Error ? error.stack : "No stack")
    return handleApiError(error)
  }
}
