"use client"

import type React from "react"

/**
 * Edit Tenant Dialog
 *
 * Dialog for editing tenant information
 */

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { Tenant, UpdateTenantDto } from "@/types/domain/tenant"

interface EditTenantDialogProps {
  tenantId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditTenantDialog({ tenantId, open, onOpenChange, onSuccess }: EditTenantDialogProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateTenantDto>({})
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (open && tenantId) {
      fetchTenant()
      fetchOrganizations()
    }
  }, [open, tenantId])

  const fetchTenant = async () => {
    if (!tenantId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch tenant")
      }

      const data = await response.json()
      setTenant(data)
      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        root_organization_id: data.root_organization_id,
      })
    } catch (error) {
      console.error("Error fetching tenant:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      console.log("[v0] EditTenantDialog: Fetching organizations for tenant:", tenantId)

      const response = await fetch("/api/organizations?level=0")
      if (!response.ok) {
        throw new Error("Failed to fetch organizations")
      }
      const data = await response.json()

      console.log("[v0] EditTenantDialog: Fetched organizations:", {
        count: data.length,
        tenantIds: data.map((o: any) => o.tenantId).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i),
      })

      setOrganizations(data)
    } catch (error) {
      console.error("Error fetching organizations:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update tenant")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating tenant:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактировать тенант</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="root_organization_id">Головная организация</Label>
                <Select
                  value={formData.root_organization_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, root_organization_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите головную организацию" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="inactive">Неактивен</SelectItem>
                    <SelectItem value="suspended">Приостановлен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Spinner className="mr-2" /> : null}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
