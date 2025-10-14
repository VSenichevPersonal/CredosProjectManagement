import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { logger } from "@/lib/logger"

console.log("[v0] [LegalReferences API] Module loaded successfully")

// GET /api/requirements/[id]/legal-references - Get all legal references for a requirement
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] [LegalReferences API] GET handler called", { requirementId: params.id })
  try {
    const ctx = await createExecutionContext(request)
    const requirementId = params.id

    const references = await ctx.db.requirementLegalReferences.findByRequirement(requirementId)

    logger.info("[LegalReferences API] References fetched successfully", {
      requirementId,
      count: references.length,
    })

    return NextResponse.json(references)
  } catch (error) {
    console.error("[v0] [LegalReferences API] GET handler ERROR", error)
    logger.error("[LegalReferences API] GET request failed", error as Error, {
      requirementId: params.id,
    })
    return handleApiError(error)
  }
}

// POST /api/requirements/[id]/legal-references - Add a legal reference to a requirement
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] [LegalReferences API] ========== POST HANDLER ENTRY POINT ==========")
  console.log("[v0] [LegalReferences API] POST handler called", {
    requirementId: params?.id,
    hasParams: !!params,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  })

  let body: any = {}
  let ctx: any = null

  try {
    console.log("[v0] [LegalReferences API] Step 1: Creating execution context...")

    try {
      ctx = await createExecutionContext(request)
      console.log("[v0] [LegalReferences API] Step 1: Context created successfully", {
        hasDb: !!ctx.db,
        hasRequirementLegalReferences: !!ctx.db?.requirementLegalReferences,
        hasCreate: !!ctx.db?.requirementLegalReferences?.create,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      })
    } catch (contextError) {
      console.error("[v0] [LegalReferences API] FATAL: Context creation failed", {
        error: contextError,
        errorMessage: contextError instanceof Error ? contextError.message : String(contextError),
        errorStack: contextError instanceof Error ? contextError.stack : undefined,
      })
      throw contextError
    }

    const requirementId = params.id

    console.log("[v0] [LegalReferences API] Step 2: Parsing request body...")

    try {
      body = await request.json()
      console.log("[v0] [LegalReferences API] Step 2: Body parsed successfully", { body })
    } catch (parseError) {
      console.error("[v0] [LegalReferences API] FATAL: Body parsing failed", {
        error: parseError,
        errorMessage: parseError instanceof Error ? parseError.message : String(parseError),
      })
      throw new Error("Invalid JSON in request body")
    }

    console.log("[v0] [LegalReferences API] Step 3: Validating request data...")
    if (!body.legalArticleId) {
      console.error("[v0] [LegalReferences API] Validation failed: Missing legalArticleId", { body })
      return NextResponse.json({ error: "legalArticleId is required" }, { status: 400 })
    }
    console.log("[v0] [LegalReferences API] Step 3: Validation passed")

    console.log("[v0] [LegalReferences API] Step 4: Preparing data for repository...")
    const dataToInsert = {
      requirementId,
      legalArticleId: body.legalArticleId,
      isPrimary: body.isPrimary || false,
      relevanceNote: body.relevanceNote,
      tenantId: ctx.tenantId,
    }
    console.log("[v0] [LegalReferences API] Step 4: Data prepared", { dataToInsert })

    console.log("[v0] [LegalReferences API] Step 5: Calling repository create method...")

    let reference
    try {
      reference = await ctx.db.requirementLegalReferences.create(dataToInsert)
      console.log("[v0] [LegalReferences API] Step 5: Repository create succeeded", { reference })
    } catch (repoError) {
      console.error("[v0] [LegalReferences API] FATAL: Repository create failed", {
        error: repoError,
        errorMessage: repoError instanceof Error ? repoError.message : String(repoError),
        errorStack: repoError instanceof Error ? repoError.stack : undefined,
        errorCode: (repoError as any)?.code,
        errorDetails: (repoError as any)?.details,
        dataToInsert,
      })
      throw repoError
    }

    console.log("[v0] [LegalReferences API] Step 6: Returning success response")
    logger.info("[LegalReferences API] Reference created successfully", {
      id: reference.id,
      requirementId: reference.requirementId,
      legalArticleId: reference.legalArticleId,
    })

    return NextResponse.json(reference, { status: 201 })
  } catch (error) {
    console.error("[v0] [LegalReferences API] ========== POST HANDLER ERROR ==========")
    console.error("[v0] [LegalReferences API] Error type:", error?.constructor?.name)
    console.error("[v0] [LegalReferences API] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] [LegalReferences API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] [LegalReferences API] Error details:", {
      requirementId: params?.id,
      body,
      hasContext: !!ctx,
      contextTenantId: ctx?.tenantId,
      contextUserId: ctx?.userId,
      errorCode: (error as any)?.code,
      errorDetails: (error as any)?.details,
      errorHint: (error as any)?.hint,
    })

    logger.error("[LegalReferences API] POST request failed", error as Error, {
      requirementId: params.id,
      body,
    })

    return handleApiError(error)
  }
}
