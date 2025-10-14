import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { NotificationService } from "@/lib/services/notification-service"
import { z } from "zod"

const ReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comments: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, comments } = ReviewSchema.parse(body)
    const complianceId = params.id

    // Get current compliance record
    const { data: compliance, error: fetchError } = await supabase
      .from("compliance_records")
      .select(
        "*, requirements(code, title), organizations(name), users!compliance_records_assigned_to_fkey(id, full_name)",
      )
      .eq("id", complianceId)
      .single()

    if (fetchError || !compliance) {
      return NextResponse.json({ error: "Compliance record not found" }, { status: 404 })
    }

    // Check if user has permission to review
    const { data: userData } = await supabase
      .from("users")
      .select("role, organization_id, full_name")
      .eq("id", user.id)
      .single()

    if (!userData || !["ministry_user", "regulator_admin", "super_admin"].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    // Update compliance status
    const newStatus = action === "approve" ? "approved" : "rejected"
    const updateData: any = {
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (action === "approve") {
      updateData.completed_at = new Date().toISOString()
      if (comments) {
        updateData.comments = comments
      }
    } else {
      updateData.rejection_reason = comments || "Не указана"
      updateData.completed_at = null
    }

    const { error: updateError } = await supabase.from("compliance_records").update(updateData).eq("id", complianceId)

    if (updateError) {
      console.error("[v0] Failed to update compliance:", updateError)
      return NextResponse.json({ error: "Failed to update compliance status" }, { status: 500 })
    }

    if (compliance.assigned_to) {
      if (action === "approve") {
        await NotificationService.notifyApproved({
          userId: compliance.assigned_to,
          requirementCode: compliance.requirements?.code || "",
          reviewerName: userData.full_name || "Проверяющий",
          complianceId,
        })
      } else {
        await NotificationService.notifyRejected({
          userId: compliance.assigned_to,
          requirementCode: compliance.requirements?.code || "",
          reviewerName: userData.full_name || "Проверяющий",
          reason: comments || "Не указана",
          complianceId,
        })
      }
    }

    // Log audit trail
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: action === "approve" ? "compliance_approved" : "compliance_rejected",
      resource_type: "compliance",
      resource_id: complianceId,
      metadata: {
        requirement_title: compliance.requirements?.title,
        organization_name: compliance.organizations?.name,
        comments,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Review error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
