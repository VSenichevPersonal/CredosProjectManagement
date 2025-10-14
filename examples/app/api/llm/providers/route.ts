import { NextResponse } from "next/server"
import { LLMFactory } from "@/lib/providers/llm/llm-factory"

export async function GET() {
  try {
    const providers = await LLMFactory.getAvailableProviders()

    return NextResponse.json({
      data: providers.map((provider) => ({
        id: provider,
        name: provider.charAt(0).toUpperCase() + provider.slice(1),
        available: true,
      })),
    })
  } catch (error) {
    console.error("[LLM Providers API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
