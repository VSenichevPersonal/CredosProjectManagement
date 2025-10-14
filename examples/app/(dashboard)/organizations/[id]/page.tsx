import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { OrganizationDetailClient } from "@/components/organizations/organization-detail-client"

export default async function OrganizationDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const { data: organization, error } = await supabase.from("organizations").select("*").eq("id", params.id).single()

  if (error || !organization) {
    notFound()
  }

  return <OrganizationDetailClient organization={organization} />
}
