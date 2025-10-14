import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PendingReviewTable } from "@/components/compliance/pending-review-table"

export default async function PendingReviewPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user role
  const { data: userData } = await supabase.from("users").select("role, organization_id").eq("id", user.id).single()

  // Only Ministry User and above can access this page
  if (!userData || !["ministry_user", "regulator_admin", "super_admin"].includes(userData.role)) {
    redirect("/")
  }

  // Fetch compliance records pending review
  let query = supabase
    .from("compliance_records")
    .select(
      `
      *,
      requirements(id, code, title, criticality_level, deadline),
      organizations(id, name, type),
      users!compliance_records_assigned_to_fkey(id, full_name, email)
    `,
    )
    .eq("status", "pending_review")
    .order("updated_at", { ascending: false })

  // Filter by organization hierarchy for Ministry Users
  if (userData.role === "ministry_user" && userData.organization_id) {
    const { data: childOrgs } = await supabase
      .from("organizations")
      .select("id")
      .eq("parent_id", userData.organization_id)

    const orgIds = childOrgs?.map((org) => org.id) || []
    if (orgIds.length > 0) {
      query = query.in("organization_id", orgIds)
    }
  }

  const { data: pendingCompliance, error } = await query

  if (error) {
    console.error("[v0] Failed to fetch pending compliance:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Требования на проверке</h1>
        <p className="text-muted-foreground mt-2">
          Проверьте и утвердите выполнение требований подведомственными организациями
        </p>
      </div>

      <PendingReviewTable data={pendingCompliance || []} />
    </div>
  )
}
