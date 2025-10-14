import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { FolderOpen } from "lucide-react"
import { AdminDataTable } from "@/components/admin/admin-data-table"

export default async function AdminEvidencePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "super_admin") {
    redirect("/")
  }

  const { data: evidence } = await supabase.from("evidence").select("*").order("uploaded_at", { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FolderOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Управление доказательствами</h1>
          <p className="text-sm text-muted-foreground">Ревью и одобрение загруженных доказательств</p>
        </div>
      </div>

      <AdminDataTable
        data={evidence || []}
        columns={[
          { key: "title", label: "Название" },
          { key: "file_name", label: "Файл" },
          { key: "status", label: "Статус" },
          { key: "uploaded_at", label: "Загружено", type: "date" },
          { key: "reviewed_at", label: "Проверено", type: "date" },
          { key: "reviewed_by", label: "Проверил" },
        ]}
        searchKey="title"
        editPath="/admin/evidence"
      />
    </div>
  )
}
