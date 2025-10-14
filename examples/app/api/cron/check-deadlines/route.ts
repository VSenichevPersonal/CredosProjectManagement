/**
 * Cron endpoint for checking compliance deadlines
 * Runs daily via Vercel Cron
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { NotificationSchedulerService } from "@/lib/services/notification-scheduler-service"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting deadline check cron job")

    const ctx = await createExecutionContext(request)
    const scheduler = new NotificationSchedulerService()

    await scheduler.checkAndNotifyDeadlines(ctx)

    console.log("[v0] Deadline check completed successfully")

    return NextResponse.json({
      success: true,
      message: "Deadline notifications processed",
    })
  } catch (error) {
    console.error("[v0] Error in deadline check cron:", error)
    return NextResponse.json({ error: "Failed to process deadlines" }, { status: 500 })
  }
}
