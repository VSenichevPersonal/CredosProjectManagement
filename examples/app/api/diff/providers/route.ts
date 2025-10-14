/**
 * @intent: API endpoint to get available diff providers
 * @architecture: Allows UI to show available options
 */

import { NextResponse } from "next/server"
import { DiffFactory } from "@/lib/providers/diff/diff-factory"

export async function GET() {
  try {
    const providers = await DiffFactory.getAvailableProviders()

    return NextResponse.json({
      data: providers.map((provider) => ({
        id: provider,
        name: provider.charAt(0).toUpperCase() + provider.slice(1),
        available: true,
      })),
    })
  } catch (error) {
    console.error("[v0] Failed to get diff providers:", error)
    return NextResponse.json({ error: "Failed to get providers" }, { status: 500 })
  }
}
