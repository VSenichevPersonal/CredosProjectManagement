"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  X,
  Trash2,
} from "lucide-react"
import { OrganizationAttributesForm } from "./organization-attributes-form"
import { OrganizationAttributesBadge } from "./organization-attributes-badge"
import { OrganizationRequirementsTab } from "./organization-requirements-tab"
import { OrganizationControlsTab } from "./organization-controls-tab"
import { OrganizationComplianceTab } from "./organization-compliance-tab"
import type { Organization, OrganizationAttributes } from "@/types/domain/organization"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OrganizationDetailClientProps {
  organization: Organization
}

export function OrganizationDetailClient({ organization }: OrganizationDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<Organization>({
    defaultValues: organization,
  })

  const attributes: OrganizationAttributes = {
    kiiCategory: organization.attributes?.kiiCategory || null,
    pdnLevel: organization.attributes?.pdnLevel || null,
    isFinancial: organization.attributes?.isFinancial || false,
    isHealthcare: organization.attributes?.isHealthcare || false,
    isGovernment: organization.attributes?.isGovernment || false,
    employeeCount: organization.employee_count,
    hasForeignData: organization.attributes?.hasForeignData || false,
    attributesUpdatedAt: organization.attributes?.attributesUpdatedAt || null,
    attributesUpdatedBy: organization.attributes?.attributesUpdatedBy || null,
  }

  const handleSave = async () => {
    console.log("[v0] [OrganizationDetail] handleSave called")
    setSaving(true)
    try {
      const formData = form.getValues()
      console.log("[v0] [OrganizationDetail] Form data", formData)

      const dataToSend = {
        name: formData.name,
        inn: formData.inn,
        ogrn: formData.ogrn,
        address: formData.address,
        description: formData.description,
        industry: formData.industry,
        employee_count: formData.employee_count,
        contact_person_name: formData.contact_person_name,
        contact_person_email: formData.contact_person_email,
        contact_person_phone: formData.contact_person_phone,
        has_pdn: formData.has_pdn,
        has_kii: formData.has_kii,
        organization_type_id: formData.organization_type_id,
        level: formData.level,
      }

      console.log("[v0] [OrganizationDetail] Data to send", dataToSend)

      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      console.log("[v0] [OrganizationDetail] API response", { status: response.status, ok: response.ok })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Save error:", errorData)
        throw new Error(errorData.error || "Failed to update organization")
      }

      toast({
        title: "Организация обновлена",
        description: "Изменения успешно сохранены",
      })

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to save organization:", error)
      toast({
        title: "Ошибка сохранения",
        description: error instanceof Error ? error.message : "Не удалось сохранить изменения",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    form.reset(organization)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete organization")
      }

      toast({
        title: "Организация удалена",
        description: "Организация успешно удалена из системы",
      })

      router.push("/organizations")
    } catch (error) {
      console.error("Failed to delete organization:", error)
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить организацию",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleSaveAttributes = async (newAttributes: OrganizationAttributes) => {
    try {
      const response = await fetch(`/api/organizations/${organization.id}/attributes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAttributes),
      })

      if (!response.ok) {
        throw new Error("Failed to save attributes")
      }

      toast({
        title: "Атрибуты сохранены",
        description: "Атрибуты организации успешно обновлены",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить атрибуты организации",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/organizations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            {isEditing ? (
              <Input
                {...form.register("name")}
                className="text-2xl font-bold h-10"
                placeholder="Название организации"
              />
            ) : (
              <h1 className="text-2xl font-bold">{organization.name}</h1>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{organization.organizationType?.name || "Тип не указан"}</p>
        </div>
        <OrganizationAttributesBadge attributes={attributes} />
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Отмена
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">Общее</TabsTrigger>
          <TabsTrigger value="attributes">Атрибуты</TabsTrigger>
          <TabsTrigger value="requirements">Требования</TabsTrigger>
          <TabsTrigger value="controls">Меры/Контроли</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Реквизиты</CardTitle>
              <CardDescription>Юридические данные организации</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>ИНН</Label>
                    <Input {...form.register("inn")} placeholder="ИНН организации" />
                  </div>
                  <div className="space-y-2">
                    <Label>ОГРН</Label>
                    <Input {...form.register("ogrn")} placeholder="ОГРН организации" />
                  </div>
                  <div className="space-y-2">
                    <Label>Отрасль</Label>
                    <Input {...form.register("industry")} placeholder="Отрасль" />
                  </div>
                  <div className="space-y-2">
                    <Label>Количество сотрудников</Label>
                    <Input
                      type="number"
                      {...form.register("employee_count", { valueAsNumber: true })}
                      placeholder="Количество сотрудников"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Адрес</Label>
                    <Input {...form.register("address")} placeholder="Адрес организации" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Описание</Label>
                    <Textarea
                      {...form.register("description")}
                      placeholder="Описание организации"
                      className="min-h-24"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Тип организации</div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{organization.organizationType?.name || "Тип не указан"}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Уровень в иерархии</div>
                    <Badge variant="outline">Уровень {organization.level}</Badge>
                  </div>

                  {organization.inn && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">ИНН</div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{organization.inn}</span>
                      </div>
                    </div>
                  )}

                  {organization.ogrn && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">ОГРН</div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{organization.ogrn}</span>
                      </div>
                    </div>
                  )}

                  {organization.industry && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Отрасль</div>
                      <span>{organization.industry}</span>
                    </div>
                  )}

                  {organization.employee_count && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Количество сотрудников</div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{organization.employee_count}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isEditing && organization.address && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Адрес</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{organization.address}</span>
                  </div>
                </div>
              )}

              {!isEditing && organization.description && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Описание</div>
                  <p className="text-sm">{organization.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Контактная информация</CardTitle>
              <CardDescription>Данные для связи с организацией</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Контактное лицо</Label>
                    <Input {...form.register("contact_person_name")} placeholder="ФИО контактного лица" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" {...form.register("contact_person_email")} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input {...form.register("contact_person_phone")} placeholder="+7 (XXX) XXX-XX-XX" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {organization.contact_person_name && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Контактное лицо</div>
                      <span>{organization.contact_person_name}</span>
                    </div>
                  )}

                  {organization.contact_person_email && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${organization.contact_person_email}`}
                          className="text-primary hover:underline"
                        >
                          {organization.contact_person_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {organization.contact_person_phone && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Телефон</div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${organization.contact_person_phone}`} className="text-primary hover:underline">
                          {organization.contact_person_phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Атрибуты безопасности</CardTitle>
              <CardDescription>Характеристики информационной безопасности</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="has_pdn" className="flex flex-col space-y-1">
                      <span>Обработка персональных данных</span>
                      <span className="font-normal text-sm text-muted-foreground">Организация обрабатывает ПДн</span>
                    </Label>
                    <Switch
                      id="has_pdn"
                      checked={form.watch("has_pdn")}
                      onCheckedChange={(checked) => form.setValue("has_pdn", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="has_kii" className="flex flex-col space-y-1">
                      <span>Объекты КИИ</span>
                      <span className="font-normal text-sm text-muted-foreground">Организация имеет объекты КИИ</span>
                    </Label>
                    <Switch
                      id="has_kii"
                      checked={form.watch("has_kii")}
                      onCheckedChange={(checked) => form.setValue("has_kii", checked)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Обработка персональных данных</div>
                    <div className="flex items-center gap-2">
                      {organization.has_pdn ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-green-600 font-medium">Да</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                          <span className="text-muted-foreground">Нет</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Объекты КИИ</div>
                    <div className="flex items-center gap-2">
                      {organization.has_kii ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-orange-600" />
                          <span className="text-orange-600 font-medium">Да</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                          <span className="text-muted-foreground">Нет</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes">
          <OrganizationAttributesForm
            organizationId={organization.id}
            initialAttributes={attributes}
            onSave={handleSaveAttributes}
          />
        </TabsContent>

        <TabsContent value="requirements">
          <OrganizationRequirementsTab organizationId={organization.id} />
        </TabsContent>

        <TabsContent value="controls">
          <OrganizationControlsTab organizationId={organization.id} />
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Records</CardTitle>
              <CardDescription>История соответствия требованиям</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationComplianceTab organizationId={organization.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить организацию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить организацию <strong>{organization.name}</strong>? Это действие нельзя
              отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
