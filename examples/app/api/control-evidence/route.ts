import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"
import { AppError } from "@/lib/errors"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { controlId, evidenceId, organizationId, notes } = body

    if (!controlId || !evidenceId) {
      return Response.json({ error: "controlId and evidenceId are required" }, { status: 400 })
    }

    const db = new SupabaseDatabaseProvider()

    const link = await db.controlEvidence.create({
      controlId,
      evidenceId,
      organizationId,
      notes,
      createdBy: user.id,
    })

    return Response.json({ data: link }, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ error: error.message }, { status: error.statusCode })
    }
    console.error("[API Error]", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const controlId = searchParams.get("controlId")
    const evidenceId = searchParams.get("evidenceId")

    const db = new SupabaseDatabaseProvider()

    let links
    if (controlId) {
      links = await db.controlEvidence.findByControl(controlId)
    } else if (evidenceId) {
      links = await db.controlEvidence.findByEvidence(evidenceId)
    } else {
      return Response.json({ error: "controlId or evidenceId is required" }, { status: 400 })
    }

    return Response.json({ data: links })
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ error: error.message }, { status: error.statusCode })
    }
    console.error("[API Error]", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 })
    }

    const db = new SupabaseDatabaseProvider()
    await db.controlEvidence.delete(id)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ error: error.message }, { status: error.statusCode })
    }
    console.error("[API Error]", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
