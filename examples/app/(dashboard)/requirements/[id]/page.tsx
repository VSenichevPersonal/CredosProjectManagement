"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CriticalityBadge } from "@/components/ui/criticality-badge"
import { RequirementCode } from "@/components/ui/requirement-code"
import { ApplicabilityTab } from "@/components/requirements/applicability-tab"
import { RequirementControlsTab } from "@/components/requirements/requirement-controls-tab"
import { RequirementEvidenceTypesTab } from "@/components/requirements/requirement-evidence-types-tab"
import { ArrowLeft, FileText, Users, Shield, Trash2, Edit, Save, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { Requirement } from "@/types/domain/requirement"
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
import { RequirementLegalReferences } from "@/components/requirements/requirement-legal-references"

export default function RequirementDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [requirement, setRequirement] = useState<Requirement | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [dictionaries, setDictionaries] = useState<{
    categories: any[]
    periodicities: any[]
    verificationMethods: any[]
    responsibleRoles: any[]
  }>({
    categories: [],
    periodicities: [],
    verificationMethods: [],
    responsibleRoles: [],
  })

  const form = useForm<Requirement>()

  useEffect(() => {
    fetchRequirement()
    fetchDictionaries()
  }, [params.id])

  const fetchRequirement = () => {
    fetch(`/api/requirements/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setRequirement(data.data)
          form.reset(data.data)
        }
      })
      .catch((error) => {
        console.error("Failed to load requirement:", error)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const fetchDictionaries = async () => {
    try {
      const [categories, periodicities, verificationMethods, responsibleRoles] = await Promise.all([
        fetch("/api/dictionaries/categories").then((r) => r.json()),
        fetch("/api/dictionaries/periodicities").then((r) => r.json()),
        fetch("/api/dictionaries/verification-methods").then((r) => r.json()),
        fetch("/api/dictionaries/responsible-roles").then((r) => r.json()),
      ])

      setDictionaries({
        categories: categories.data || [],
        periodicities: periodicities.data || [],
        verificationMethods: verificationMethods.data || [],
        responsibleRoles: responsibleRoles.data || [],
      })
    } catch (error) {
      console.error("Failed to load dictionaries:", error)
    }
  }

  const handleSave = async () => {
    console.log("[v0] [RequirementDetail] handleSave called")
    setSaving(true)
    try {
      const formData = form.getValues()
      console.log("[v0] [RequirementDetail] Form data", formData)

      const dataToSend = {
        code: formData.code,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        criticality: formData.criticality,
        categoryId: formData.categoryId,
        documentId: formData.documentId,
        parentId: formData.parentId,
        measureMode: formData.measureMode,
        evidenceTypeMode: formData.evidenceTypeMode,
        allowedEvidenceTypeIds: formData.allowedEvidenceTypeIds || [],
        suggestedControlMeasureTemplateIds: formData.suggestedControlMeasureTemplateIds || [],
        effectiveDate: formData.effectiveDate,
        expirationDate: formData.expirationDate,
        periodicityId: formData.periodicityId,
        verificationMethodId: formData.verificationMethodId,
        responsibleRoleId: formData.responsibleRoleId,
      }

      console.log("[v0] [RequirementDetail] Data to send", dataToSend)

      const response = await fetch(`/api/requirements/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      console.log("[v0] [RequirementDetail] API response", { status: response.status, ok: response.ok })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Save error:", errorData)
        throw new Error(errorData.error || "Failed to update requirement")
      }

      toast({
        title: "Требование обновлено",
        description: "Изменения успешно сохранены",
      })

      setIsEditing(false)
      fetchRequirement()
    } catch (error) {
      console.error("[v0] Failed to save requirement:", error)
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
    form.reset(requirement!)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/requirements/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete requirement")
      }

      toast({
        title: "Требование удалено",
        description: "Требование успешно удалено из системы",
      })

      router.push("/requirements")
    } catch (error) {
      console.error("Failed to delete requirement:", error)
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить требование",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleModeToggle = async (type: "measure" | "evidence") => {
    const currentMode = type === "measure" ? requirement?.measureMode : requirement?.evidenceTypeMode
    const newMode = (currentMode || "flexible") === "strict" ? "flexible" : "strict"
    const fieldName = type === "measure" ? "measure_mode" : "evidence_type_mode"

    try {
      const response = await fetch(`/api/requirements/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: newMode }),
      })
      if (!response.ok) throw new Error("Failed to update mode")
      toast({
        title: "Режим обновлен",
        description: `Режим исполнения по ${type === "measure" ? "мерам" : "доказательствам"} изменен на ${newMode === "strict" ? "строгий" : "гибкий"}`,
      })
      fetchRequirement()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить режим",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Загрузка...</div>
  }

  if (!requirement) {
    return <div className="flex items-center justify-center h-96">Требование не найдено</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/requirements">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <Input {...form.register("code")} className="w-40 h-8 text-sm font-mono" placeholder="Код требования" />
            ) : (
              <RequirementCode code={requirement.code} />
            )}
            <CriticalityBadge level={requirement.criticality} />
          </div>
          {isEditing ? (
            <Input
              {...form.register("title")}
              className="mt-2 text-3xl font-bold tracking-tight"
              placeholder="Название требования"
            />
          ) : (
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{requirement.title}</h1>
          )}
        </div>
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Общее
          </TabsTrigger>
          <TabsTrigger value="applicability" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Применение
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Рекомендуемые меры
          </TabsTrigger>
          <TabsTrigger value="evidence-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Рекомендуемые типы доказательств
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Описание</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      {...form.register("description")}
                      className="min-h-32"
                      placeholder="Описание требования"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">{requirement.description}</p>
                  )}
                </CardContent>
              </Card>

              <RequirementLegalReferences requirementId={params.id} />
            </div>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Информация</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Статус</Label>
                        <Select
                          value={form.watch("status") || ""}
                          onValueChange={(value) => form.setValue("status", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Черновик</SelectItem>
                            <SelectItem value="active">Активно</SelectItem>
                            <SelectItem value="archived">Архив</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Критичность</Label>
                        <Select
                          value={form.watch("criticality") || ""}
                          onValueChange={(value) => form.setValue("criticality", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите критичность" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Критичный</SelectItem>
                            <SelectItem value="high">Высокий</SelectItem>
                            <SelectItem value="medium">Средний</SelectItem>
                            <SelectItem value="low">Низкий</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Режим исполнения по мерам</Label>
                        <Select
                          value={form.watch("measureMode") || ""}
                          onValueChange={(value) => form.setValue("measureMode", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите режим" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strict">Строгий</SelectItem>
                            <SelectItem value="flexible">Гибкий</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Режим исполнения по доказательствам</Label>
                        <Select
                          value={form.watch("evidenceTypeMode") || ""}
                          onValueChange={(value) => form.setValue("evidenceTypeMode", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите режим" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strict">Строгий</SelectItem>
                            <SelectItem value="flexible">Гибкий</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Дата введения</Label>
                        <Input type="date" {...form.register("effectiveDate")} />
                      </div>

                      <div className="space-y-2">
                        <Label>Дата отмены</Label>
                        <Input type="date" {...form.register("expirationDate")} />
                      </div>

                      <div className="space-y-2">
                        <Label>Периодичность проверки</Label>
                        <Select
                          value={form.watch("periodicityId") || ""}
                          onValueChange={(value) => form.setValue("periodicityId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите периодичность" />
                          </SelectTrigger>
                          <SelectContent>
                            {dictionaries.periodicities.map((per) => (
                              <SelectItem key={per.id} value={per.id}>
                                {per.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Способ подтверждения</Label>
                        <Select
                          value={form.watch("verificationMethodId") || ""}
                          onValueChange={(value) => form.setValue("verificationMethodId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите способ" />
                          </SelectTrigger>
                          <SelectContent>
                            {dictionaries.verificationMethods.map((vm) => (
                              <SelectItem key={vm.id} value={vm.id}>
                                {vm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Ответственная роль</Label>
                        <Select
                          value={form.watch("responsibleRoleId") || ""}
                          onValueChange={(value) => form.setValue("responsibleRoleId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                          <SelectContent>
                            {dictionaries.responsibleRoles.map((rr) => (
                              <SelectItem key={rr.id} value={rr.id}>
                                {rr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Категория</Label>
                        <Select
                          value={form.watch("categoryId") || ""}
                          onValueChange={(value) => form.setValue("categoryId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                          <SelectContent>
                            {dictionaries.categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                          Режимы исполнения
                        </p>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                            <div className="flex-1">
                              <Label htmlFor="measure-mode" className="text-sm font-medium cursor-pointer">
                                Меры
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {(requirement.measureMode || "flexible") === "strict"
                                  ? "Только рекомендуемые"
                                  : "Любые меры"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Гибкий</span>
                              <Switch
                                id="measure-mode"
                                checked={(requirement.measureMode || "flexible") === "strict"}
                                onCheckedChange={() => handleModeToggle("measure")}
                              />
                              <span className="text-xs text-muted-foreground">Строгий</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                            <div className="flex-1">
                              <Label htmlFor="evidence-mode" className="text-sm font-medium cursor-pointer">
                                Доказательства
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {(requirement.evidenceTypeMode || "flexible") === "strict"
                                  ? "Только рекомендуемые"
                                  : "Любые типы"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Гибкий</span>
                              <Switch
                                id="evidence-mode"
                                checked={(requirement.evidenceTypeMode || "flexible") === "strict"}
                                onCheckedChange={() => handleModeToggle("evidence")}
                              />
                              <span className="text-xs text-muted-foreground">Строгий</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Категория</p>
                        <p className="mt-1 text-sm font-medium">{requirement.category}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Статус</p>
                        <Badge variant="outline" className="mt-1">
                          {requirement.status}
                        </Badge>
                      </div>
                      {requirement.effectiveDate && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Дата введения
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {new Date(requirement.effectiveDate).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      )}
                      {requirement.expirationDate && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Дата отмены
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {new Date(requirement.expirationDate).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      )}
                      {requirement.periodicity && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Периодичность проверки
                          </p>
                          <p className="mt-1 text-sm font-medium">{requirement.periodicity.name}</p>
                        </div>
                      )}
                      {requirement.verificationMethod && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Способ подтверждения
                          </p>
                          <p className="mt-1 text-sm font-medium">{requirement.verificationMethod.name}</p>
                        </div>
                      )}
                      {requirement.responsibleRole && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Ответственная роль
                          </p>
                          <p className="mt-1 text-sm font-medium">{requirement.responsibleRole.name}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="applicability" className="mt-6">
          <ApplicabilityTab requirementId={params.id} />
        </TabsContent>

        <TabsContent value="controls" className="mt-6">
          <RequirementControlsTab requirementId={params.id} />
        </TabsContent>

        <TabsContent value="evidence-types" className="mt-6">
          <RequirementEvidenceTypesTab requirementId={params.id} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить требование?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить требование <strong>{requirement.code}</strong>? Это действие нельзя
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
