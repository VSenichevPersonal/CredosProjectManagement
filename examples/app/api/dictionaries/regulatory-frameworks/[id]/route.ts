import { type NextRequest, NextResponse } from "next/server"
import { createContext } from "@/lib/context/create-context"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createContext()

    const framework = await ctx.db.regulatoryFrameworks.findById(params.id)

    if (!framework) {
      return NextResponse.json({ error: "Regulatory framework not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: framework })
  } catch (error) {
    console.error("[v0] Failed to fetch framework:", error)
    return NextResponse.json({ error: "Failed to fetch regulatory framework" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const ctx = await createContext()

    const updated = await ctx.db.regulatoryFrameworks.update(params.id, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Failed to update regulatory framework" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createContext()

    await ctx.db.regulatoryFrameworks.delete(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Failed to delete regulatory framework" }, { status: 500 })
  }
}
