import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface Template {
  id: string
  name: string
  description: string
  category: string
  count: number
}

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get requirement counts by category
    const { data: requirements } = await supabase.from("requirements").select("category")

    const categoryCounts = requirements?.reduce((acc: Record<string, number>, req) => {
      acc[req.category] = (acc[req.category] || 0) + 1
      return acc
    }, {})

    const templates: Template[] = [
      {
        id: "kii",
        name: "КИИ - Базовый набор",
        description: "Требования по защите критической информационной инфраструктуры (187-ФЗ)",
        category: "КИИ",
        count: categoryCounts?.["КИИ"] || 0,
      },
      {
        id: "pdn",
        name: "ПДн - Базовый набор",
        description: "Требования по защите персональных данных (152-ФЗ)",
        category: "ПДн",
        count: categoryCounts?.["ПДн"] || 0,
      },
      {
        id: "gis",
        name: "ГИС - Приказ №117",
        description: "Требования по защите государственных информационных систем",
        category: "ГИС",
        count: categoryCounts?.["ГИС"] || 0,
      },
      {
        id: "crypto",
        name: "Криптография",
        description: "Требования по использованию средств криптографической защиты",
        category: "Криптография",
        count: categoryCounts?.["Криптография"] || 0,
      },
      {
        id: "general",
        name: "Общие требования",
        description: "Базовые требования информационной безопасности (ISO 27001)",
        category: "Общее",
        count: categoryCounts?.["Общее"] || 0,
      },
    ]

    return NextResponse.json({ data: templates })
  } catch (error) {
    console.error("[v0] Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}
