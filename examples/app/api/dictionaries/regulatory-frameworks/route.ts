import { NextResponse } from "next/server"
import { createContext } from "@/lib/context/create-context"

export async function GET() {
  try {
    console.log("[v0] [Regulatory Frameworks API] Starting request")

    const ctx = await createContext()

    console.log("[v0] [Regulatory Frameworks API] Context created", {
      hasDb: !!ctx.db,
      hasRegulatoryFrameworks: !!ctx.db.regulatoryFrameworks,
      hasFindMany: !!ctx.db.regulatoryFrameworks?.findMany,
    })

    const frameworks = await ctx.db.regulatoryFrameworks.findMany()

    console.log("[v0] [Regulatory Frameworks API] Frameworks fetched", {
      count: frameworks.length,
    })

    return NextResponse.json({
      data: frameworks,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch regulatory frameworks:", error)
    return NextResponse.json({ error: "Failed to fetch regulatory frameworks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await createContext()
    const body = await request.json()

    const created = await ctx.db.regulatoryFrameworks.create(body)

    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    console.error("[v0] Failed to create regulatory framework:", error)
    return NextResponse.json({ error: "Failed to create regulatory framework" }, { status: 500 })
  }
}
