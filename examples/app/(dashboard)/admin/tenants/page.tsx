"use client"

import { useEffect, useState } from "react"
import { AdminDataTable, type ColumnDef } from "@/components/admin/admin-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TenantDetailDialog } from "@/components/admin/tenants/tenant-detail-dialog"
import { EditTenantDialog } from "@/components/admin/tenants/edit-tenant-dialog"
import { CreateTenantDialog } from "@/components/admin/tenants/create-tenant-dialog"
import { MoreVertical, Eye, Pencil, Power, PowerOff, RefreshCw, Building2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
  rootOrganizationId?: string
  rootOrganizationName?: string
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/tenants")
      if (!response.ok) {
        throw new Error("Failed to fetch tenants")
      }
      const data = await response.json()
      setTenants(data)
    } catch (error) {
      console.error("Failed to fetch tenants:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenantId(tenant.id)
    setDetailDialogOpen(true)
  }

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenantId(tenant.id)
    setEditDialogOpen(true)
  }

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.isActive ? "inactive" : "active"
    const action = tenant.isActive ? "деактивировать" : "активировать"

    if (!confirm(`Вы уверены, что хотите ${action} тенант "${tenant.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update tenant status")
      }

      await fetchTenants()
    } catch (error) {
      console.error("Failed to update tenant status:", error)
    }
  }

  const handleSwitchTenant = async (tenant: Tenant) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}/switch`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to switch tenant")
      }

      window.location.href = "/"
    } catch (error) {
      console.error("Failed to switch tenant:", error)
    }
  }

  const columns: ColumnDef<Tenant>[] = [
    { key: "name", label: "Название", sortable: true },
    { key: "slug", label: "Slug", sortable: true },
    {
      key: "rootOrganizationName",
      label: "Головная организация",
      render: (value) =>
        value ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{value}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Не указана</span>
        ),
    },
    {
      key: "isActive",
      label: "Статус",
      render: (value) => <Badge variant={value ? "default" : "secondary"}>{value ? "Активен" : "Неактивен"}</Badge>,
    },
    {
      key: "createdAt",
      label: "Создан",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString("ru-RU"),
    },
    {
      key: "id",
      label: "Действия",
      render: (_, tenant) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(tenant)}>
              <Eye className="mr-2 h-4 w-4" />
              Просмотр
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(tenant)}>
              <Pencil className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSwitchTenant(tenant)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Переключиться
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleToggleStatus(tenant)}>
              {tenant.isActive ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Деактивировать
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Активировать
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <AdminDataTable
        title="Тенанты"
        description="Управление вертикалями системы. Каждый тенант имеет свою головную организацию и изолированные данные."
        columns={columns}
        data={tenants}
        onAdd={() => setCreateDialogOpen(true)}
        onRowClick={handleViewDetails}
        searchPlaceholder="Поиск по названию..."
        isLoading={isLoading}
      />

      <TenantDetailDialog
        tenantId={selectedTenantId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={(tenantId) => {
          setDetailDialogOpen(false)
          setSelectedTenantId(tenantId)
          setEditDialogOpen(true)
        }}
      />

      <EditTenantDialog
        tenantId={selectedTenantId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchTenants}
      />

      <CreateTenantDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={fetchTenants} />
    </>
  )
}
