import { NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"

export async function GET() {
  try {
    const ctx = await createExecutionContext(new Request("http://localhost"))

    if (!ctx.organizationId) {
      return NextResponse.json({ error: "User has no organization" }, { status: 404 })
    }

    const organization = await ctx.db.organizations.findById(ctx.organizationId)

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    return handleApiError(error)
  }
}
