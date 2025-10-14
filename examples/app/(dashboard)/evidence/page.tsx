import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { EvidenceLibrary } from "@/components/evidence/evidence-library"

async function getEvidenceData(userId: string) {
  const supabase = await createServerClient()

  // Get all evidence with relations
  const { data: evidence, error } = await supabase
    .from("evidence")
    .select(
      `
      *,
      compliance_record:compliance_records(
        id,
        status,
        requirement:requirements(id, code, title)
      ),
      requirement:requirements(id, code, title),
      uploaded_by_user:users!evidence_uploaded_by_fkey(id, name, email)
    `,
    )
    .order("uploaded_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch evidence:", error)
    return { evidence: [] }
  }

  return { evidence: evidence || [] }
}

export default async function EvidencePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const data = await getEvidenceData(user.id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Документы</h1>
        <p className="text-muted-foreground mt-1">
          Просмотр всех загруженных доказательств. Загрузка доступна только из записей соответствия и мер контроля.
        </p>
      </div>

      <EvidenceLibrary initialEvidence={data.evidence} readOnly={true} />
    </div>
  )
}
