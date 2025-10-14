import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface Organization {
  id: string
  name: string
  type: string
  level: number
  parent_id: string | null
  children?: Organization[]
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const rootId = searchParams.get("rootId")

    // Fetch all organizations
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("*")
      .order("level", { ascending: true })
      .order("name", { ascending: true })

    if (error) throw error

    // Build hierarchy tree
    const buildTree = (items: Organization[], parentId: string | null = null): Organization[] => {
      return items
        .filter((item) => item.parent_id === parentId)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id),
        }))
    }

    let tree: Organization[]

    if (rootId) {
      // Build tree from specific root
      const root = organizations?.find((org) => org.id === rootId)
      if (!root) {
        return NextResponse.json({ error: "Root not found" }, { status: 404 })
      }
      tree = [{ ...root, children: buildTree(organizations || [], rootId) }]
    } else {
      // Build full tree from level 1
      tree = buildTree(organizations || [], null)
    }

    return NextResponse.json({ data: tree })
  } catch (error) {
    console.error("[v0] Error fetching hierarchy:", error)
    return NextResponse.json({ error: "Failed to fetch hierarchy" }, { status: 500 })
  }
}
