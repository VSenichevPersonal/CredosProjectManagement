"use client"

/**
 * Tenant Detail Dialog
 *
 * Comprehensive dialog for viewing and managing tenant details.
 * Features tabs for: General Info, Users, Statistics, Audit Log
 */

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TenantInfoTab } from "./tenant-info-tab"
import { TenantUsersTab } from "./tenant-users-tab"
import { TenantStatsTab } from "./tenant-stats-tab"
import { TenantAuditTab } from "./tenant-audit-tab"
import type { TenantWithRelations } from "@/types/domain/tenant"
import { Pencil } from "lucide-react"

interface TenantDetailDialogProps {
  tenantId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (tenantId: string) => void
}

export function TenantDetailDialog({ tenantId, open, onOpenChange, onEdit }: TenantDetailDialogProps) {
  const [tenant, setTenant] = useState<TenantWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("info")

  useEffect(() => {
    if (open && tenantId) {
      fetchTenantDetails()
    }
  }, [open, tenantId])

  const fetchTenantDetails = async () => {
    if (!tenantId) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/tenants/${tenantId}?includeStats=true&includeUsers=true&includeAuditLog=true`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch tenant details")
      }

      const data = await response.json()
      setTenant(data)
    } catch (error) {
      console.error("Error fetching tenant details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (tenant && onEdit) {
      onEdit(tenant.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>{tenant?.name || "Загрузка..."}</DialogTitle>
              {tenant && (
                <Badge variant={tenant.isActive ? "default" : "secondary"}>
                  {tenant.isActive ? "Активен" : "Неактивен"}
                </Badge>
              )}
            </div>
            {tenant && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            )}
          </div>
          {tenant && <p className="text-sm text-muted-foreground">{tenant.slug}</p>}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : tenant ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Общее</TabsTrigger>
              <TabsTrigger value="users">
                Пользователи
                {tenant.stats && <span className="ml-2 text-xs">({tenant.stats.userCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="stats">Статистика</TabsTrigger>
              <TabsTrigger value="audit">Аудит</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="info" className="mt-0">
                <TenantInfoTab tenant={tenant} onRefresh={fetchTenantDetails} />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <TenantUsersTab tenantId={tenant.id} users={tenant.users || []} onRefresh={fetchTenantDetails} />
              </TabsContent>

              <TabsContent value="stats" className="mt-0">
                <TenantStatsTab stats={tenant.stats} />
              </TabsContent>

              <TabsContent value="audit" className="mt-0">
                <TenantAuditTab auditLog={tenant.auditLog || []} />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Тенант не найден</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
