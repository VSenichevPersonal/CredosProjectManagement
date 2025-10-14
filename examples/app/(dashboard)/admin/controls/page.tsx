import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ShieldCheck } from "lucide-react"
import { AdminDataTable } from "@/components/admin/admin-data-table"

export default async function AdminControlsPage() {
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

  const { data: controls } = await supabase.from("controls").select("*").order("code", { ascending: true })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Управление контролями</h1>
          <p className="text-sm text-muted-foreground">Управление библиотекой контролей и маппингом на требования</p>
        </div>
      </div>

      <AdminDataTable
        data={controls || []}
        columns={[
          { key: "code", label: "Код" },
          { key: "title", label: "Название" },
          { key: "control_type", label: "Тип" },
          { key: "frequency", label: "Частота" },
          { key: "is_automated", label: "Автоматизирован", type: "boolean" },
          { key: "owner", label: "Ответственный" },
        ]}
        searchKey="title"
        editPath="/admin/controls"
      />
    </div>
  )
}
