"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import type { Organization } from "@/types/domain/organization"

interface EditOrganizationDialogProps {
  organization: Organization
  organizations?: Array<{ id: string; name: string }>
  variant?: "icon" | "button"
  size?: "sm" | "default" | "lg"
}

export function EditOrganizationDialog({
  organization,
  organizations = [],
  variant = "button",
  size = "default",
}: EditOrganizationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: organization.name || "",
    inn: organization.inn || "",
    ogrn: organization.ogrn || "",
    type: organization.type || "institution",
    parent_id: organization.parent_id || "none",
    industry: organization.industry || "",
    employee_count: organization.employee_count?.toString() || "",
    has_pdn: organization.has_pdn || false,
    has_kii: organization.has_kii || false,
    contact_person_name: organization.contact_person_name || "",
    contact_person_email: organization.contact_person_email || "",
  })

  // Reset form when organization changes
  useEffect(() => {
    setFormData({
      name: organization.name || "",
      inn: organization.inn || "",
      ogrn: organization.ogrn || "",
      type: organization.type || "institution",
      parent_id: organization.parent_id || "none",
      industry: organization.industry || "",
      employee_count: organization.employee_count?.toString() || "",
      has_pdn: organization.has_pdn || false,
      has_kii: organization.has_kii || false,
      contact_person_name: organization.contact_person_name || "",
      contact_person_email: organization.contact_person_email || "",
    })
  }, [organization])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id === "none" ? null : formData.parent_id,
          employee_count: formData.employee_count ? Number.parseInt(formData.employee_count) : null,
        }),
      })

      if (!response.ok) throw new Error("Failed to update organization")

      toast({
        title: "Организация обновлена",
        description: "Изменения успешно сохранены",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить организацию",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size={size === "sm" ? "sm" : "icon"}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size={size}>
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать организацию</DialogTitle>
          <DialogDescription>Изменение данных организации</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Тип *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ministry">Министерство</SelectItem>
                  <SelectItem value="institution">Учреждение</SelectItem>
                  <SelectItem value="branch">Филиал</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inn">ИНН</Label>
              <Input
                id="inn"
                value={formData.inn}
                onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogrn">ОГРН</Label>
              <Input
                id="ogrn"
                value={formData.ogrn}
                onChange={(e) => setFormData({ ...formData, ogrn: e.target.value })}
                maxLength={15}
              />
            </div>

            {organizations.length > 0 && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="parent">Родительская организация</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите организацию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Нет родительской организации</SelectItem>
                    {organizations
                      .filter((org) => org.id !== organization.id)
                      .map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="industry">Отрасль</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_count">Количество сотрудников</Label>
              <Input
                id="employee_count"
                type="number"
                value={formData.employee_count}
                onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
              />
            </div>

            <div className="col-span-2 flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_pdn"
                  checked={formData.has_pdn}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_pdn: checked as boolean })}
                />
                <Label htmlFor="has_pdn" className="font-normal">
                  Обрабатывает ПДн
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_kii"
                  checked={formData.has_kii}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_kii: checked as boolean })}
                />
                <Label htmlFor="has_kii" className="font-normal">
                  Имеет объекты КИИ
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Контактное лицо</Label>
              <Input
                id="contact_name"
                value={formData.contact_person_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_person_name: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email контактного лица</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_person_email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_person_email: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
