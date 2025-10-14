import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { DocumentDiffService } from "@/services/document-diff-service"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"
import type { DiffProviderType } from "@/lib/providers/diff/diff-factory"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const fromVersionId = searchParams.get("from")
    const toVersionId = searchParams.get("to")
    const diffType = searchParams.get("type") || "text"

    if (!toVersionId) {
      return NextResponse.json({ error: "toVersionId is required" }, { status: 400 })
    }

    const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()

    let diffProvider: DiffProviderType = "libre" // default

    if (userData?.tenant_id) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", userData.tenant_id)
        .single()

      if (tenantData?.settings?.providers?.diffProvider) {
        diffProvider = tenantData.settings.providers.diffProvider as DiffProviderType
      }
    }

    const provider = new SupabaseDatabaseProvider(supabase)
    const diffService = new DocumentDiffService(provider, diffProvider)

    const diff = await diffService.generateDiff(user.id, params.id, fromVersionId, toVersionId)

    return NextResponse.json({ data: diff })
  } catch (error) {
    console.error("[v0] Diff generation error:", error)
    return NextResponse.json({ error: "Failed to generate diff" }, { status: 500 })
  }
}
