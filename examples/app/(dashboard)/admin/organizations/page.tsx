"use client"

import { useEffect, useState } from "react"
import { AdminDataTable, type ColumnDef } from "@/components/admin/admin-data-table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrganizationAttributesForm } from "@/components/organizations/organization-attributes-form"
import { Building2, Layers } from "lucide-react"
import { useTenant } from "@/lib/context/tenant-context"

interface Organization {
  id: string
  name: string
  type: string
  level: number
  is_active: boolean
  created_at: string
  has_kii: boolean
  kii_category: number | null
  has_pdn: boolean
  pdn_level: number | null
  is_financial: boolean
  is_healthcare: boolean
  is_government: boolean
  employee_count: number | null
  isRoot?: boolean
  tenantId?: string
}

const columns: ColumnDef<Organization>[] = [
  {
    key: "name",
    label: "Название",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center gap-2">
        {row.isRoot && (
          <Badge variant="default" className="gap-1">
            <Building2 className="h-3 w-3" />
            Корневая
          </Badge>
        )}
        <span>{value}</span>
      </div>
    ),
  },
  {
    key: "type",
    label: "Тип",
    sortable: true,
    render: (value) => {
      const typeLabels: Record<string, string> = {
        root: "Корневая организация",
        regulator: "Регулятор",
        ministry: "Министерство",
        institution: "Учреждение",
      }
      return <Badge variant="outline">{typeLabels[value] || value}</Badge>
    },
  },
  {
    key: "has_kii",
    label: "Атрибуты",
    render: (value, row) => (
      <div className="flex flex-wrap gap-1">
        {row.has_kii && <Badge variant="secondary">КИИ-{row.kii_category}</Badge>}
        {row.has_pdn && <Badge variant="secondary">ПДн-{row.pdn_level}</Badge>}
        {row.is_financial && <Badge variant="outline">Финансовая</Badge>}
        {row.is_healthcare && <Badge variant="outline">Медицинская</Badge>}
        {row.is_government && <Badge variant="outline">Государственная</Badge>}
      </div>
    ),
  },
  { key: "level", label: "Уровень", sortable: true },
  {
    key: "is_active",
    label: "Статус",
    render: (value) => <Badge variant={value ? "default" : "secondary"}>{value ? "Активна" : "Неактивна"}</Badge>,
  },
  {
    key: "created_at",
    label: "Создана",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString("ru-RU"),
  },
]

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { tenant } = useTenant()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations")
      const data = await response.json()
      setOrganizations(data)
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    console.log("Add organization")
    // TODO: Open dialog
  }

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org)
    setIsDialogOpen(true)
  }

  const handleDelete = async (org: Organization) => {
    if (org.isRoot) {
      alert("Невозможно удалить корневую организацию. Удалите тенант вместо этого.")
      return
    }

    if (!confirm(`Вы уверены, что хотите удалить организацию "${org.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${org.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchOrganizations()
      } else {
        const error = await response.json()
        alert(error.error || "Не удалось удалить организацию")
      }
    } catch (error) {
      console.error("Failed to delete organization:", error)
      alert("Произошла ошибка при удалении организации")
    }
  }

  const handleSaveAttributes = async (attributes: any) => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/attributes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attributes),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        fetchOrganizations()
      }
    } catch (error) {
      console.error("Failed to update attributes:", error)
    }
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-primary-900">
              Активный тенант: <span className="font-bold">{tenant?.name || "Не выбран"}</span>
            </p>
            <p className="text-xs text-primary-700">
              Отображаются только организации текущего тенанта. Для просмотра других организаций переключите тенант.
            </p>
          </div>
        </div>
      </div>

      <AdminDataTable
        title="Организации"
        description="Управление иерархией организаций и их атрибутами в рамках текущего тенанта"
        columns={columns}
        data={organizations}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Поиск по названию..."
        isLoading={isLoading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Атрибуты организации: {selectedOrg?.name}</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <OrganizationAttributesForm
              organizationId={selectedOrg.id}
              initialAttributes={{
                has_kii: selectedOrg.has_kii,
                kii_category: selectedOrg.kii_category,
                has_pdn: selectedOrg.has_pdn,
                pdn_level: selectedOrg.pdn_level,
                is_financial: selectedOrg.is_financial,
                is_healthcare: selectedOrg.is_healthcare,
                is_government: selectedOrg.is_government,
                employee_count: selectedOrg.employee_count,
                has_foreign_data: false,
              }}
              onSave={handleSaveAttributes}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
