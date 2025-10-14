import { AdminDataTable } from "@/components/admin/admin-data-table"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CategoriesPage() {
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

  const { data: categories } = await supabase
    .from("requirement_categories")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Категории требований</h1>
        <p className="text-muted-foreground mt-2">Управление категориями для классификации требований</p>
      </div>

      <AdminDataTable
        data={categories || []}
        columns={[
          { key: "name", label: "Название", sortable: true },
          { key: "code", label: "Код", sortable: true },
          { key: "description", label: "Описание" },
          {
            key: "is_active",
            label: "Статус",
            render: (value) => (value ? "Активна" : "Неактивна"),
          },
        ]}
        searchPlaceholder="Поиск категорий..."
        onAdd={() => console.log("Add category")}
        onEdit={(item) => console.log("Edit category", item)}
        onDelete={(item) => console.log("Delete category", item)}
      />
    </div>
  )
}
