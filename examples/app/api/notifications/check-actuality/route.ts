/**
 * @intent: Cron endpoint to check document actuality and send notifications
 * @architecture: Background job endpoint (called by Vercel Cron)
 */

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { NotificationService } from "@/services/notification-service"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"

export async function GET() {
  try {
    // Verify cron secret (optional but recommended)
    // const authHeader = request.headers.get("authorization")
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const supabase = await createServerClient()

    // Get all active tenants
    const { data: tenants } = await supabase.from("tenants").select("id").eq("status", "active")

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({ message: "No active tenants", created: 0 })
    }

    let totalCreated = 0

    // Check each tenant
    for (const tenant of tenants) {
      const provider = new SupabaseDatabaseProvider(supabase)
      const notificationService = new NotificationService(provider)

      const { created } = await notificationService.checkDocumentActualityAndNotify(tenant.id)
      totalCreated += created
    }

    return NextResponse.json({
      message: "Actuality check completed",
      tenantsChecked: tenants.length,
      notificationsCreated: totalCreated,
    })
  } catch (error) {
    console.error("[v0] Actuality check error:", error)
    return NextResponse.json({ error: "Failed to check actuality" }, { status: 500 })
  }
}
