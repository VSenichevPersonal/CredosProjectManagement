import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseProvider } from "@/providers/database-provider"
import { DocumentVersionService } from "@/services/document-version-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDatabaseProvider()
    const service = new DocumentVersionService(db)

    const versions = await service.getVersions("user-id", params.id)

    return NextResponse.json({ data: versions })
  } catch (error) {
    console.error("[Document Versions API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    const db = getDatabaseProvider()
    const service = new DocumentVersionService(db)

    const version = await service.addVersion("user-id", {
      documentId: params.id,
      ...body,
    })

    return NextResponse.json({ data: version }, { status: 201 })
  } catch (error) {
    console.error("[Document Versions API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
