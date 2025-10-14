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
import { ControlTemplateEvidenceTypesTab } from "@/components/control-templates/control-template-evidence-types-tab"
import { ArrowLeft, FileText, Shield, Trash2, Edit, Save, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { ControlTemplate } from "@/types/domain/control-template"
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

export default function ControlTemplateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [template, setTemplate] = useState<ControlTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<ControlTemplate>()

  useEffect(() => {
    fetchTemplate()
  }, [params.id])

  const fetchTemplate = () => {
    fetch(`/api/control-templates/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setTemplate(data.data)
          form.reset(data.data)
        }
      })
      .catch((error) => {
        console.error("Failed to load template:", error)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const formData = form.getValues()

      const response = await fetch(`/api/control-templates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update template")
      }

      toast({
        title: "Шаблон меры обновлён",
        description: "Изменения успешно сохранены",
      })

      setIsEditing(false)
      fetchTemplate()
    } catch (error) {
      console.error("Failed to save template:", error)
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
    form.reset(template!)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/control-templates/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      toast({
        title: "Шаблон меры удалён",
        description: "Шаблон меры успешно удалён из системы",
      })

      router.push("/control-templates")
    } catch (error) {
      console.error("Failed to delete template:", error)
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить шаблон меры",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Загрузка...</div>
  }

  if (!template) {
    return <div className="flex items-center justify-center h-96">Шаблон меры не найден</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/control-templates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <Input {...form.register("code")} className="w-40 h-8 text-sm font-mono" placeholder="Код шаблона" />
            ) : (
              <Badge variant="outline" className="font-mono">
                {template.code}
              </Badge>
            )}
            <Badge variant={template.controlType === "preventive" ? "default" : "secondary"}>
              {template.controlType === "preventive"
                ? "Превентивная"
                : template.controlType === "detective"
                  ? "Детективная"
                  : template.controlType === "corrective"
                    ? "Корректирующая"
                    : "Компенсирующая"}
            </Badge>
          </div>
          {isEditing ? (
            <Input
              {...form.register("title")}
              className="mt-2 text-3xl font-bold tracking-tight"
              placeholder="Название шаблона меры"
            />
          ) : (
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{template.title}</h1>
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Общее
          </TabsTrigger>
          <TabsTrigger value="evidence-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Типы доказательств
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
                      placeholder="Описание шаблона меры"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">{template.description}</p>
                  )}
                </CardContent>
              </Card>
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
                        <Label>Тип меры</Label>
                        <Select
                          value={form.watch("controlType") || ""}
                          onValueChange={(value) => form.setValue("controlType", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="preventive">Превентивная</SelectItem>
                            <SelectItem value="detective">Детективная</SelectItem>
                            <SelectItem value="corrective">Корректирующая</SelectItem>
                            <SelectItem value="compensating">Компенсирующая</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Категория</Label>
                        <Input {...form.register("category")} placeholder="Категория меры" />
                      </div>

                      <div className="space-y-2">
                        <Label>Частота проверки</Label>
                        <Select
                          value={form.watch("frequency") || ""}
                          onValueChange={(value) => form.setValue("frequency", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите частоту" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Ежедневно</SelectItem>
                            <SelectItem value="weekly">Еженедельно</SelectItem>
                            <SelectItem value="monthly">Ежемесячно</SelectItem>
                            <SelectItem value="quarterly">Ежеквартально</SelectItem>
                            <SelectItem value="annual">Ежегодно</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="isAutomated">Автоматизирована</Label>
                        <Switch
                          id="isAutomated"
                          checked={form.watch("isAutomated") || false}
                          onCheckedChange={(checked) => form.setValue("isAutomated", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="isPublic">Публичный шаблон</Label>
                        <Switch
                          id="isPublic"
                          checked={form.watch("isPublic") || false}
                          onCheckedChange={(checked) => form.setValue("isPublic", checked)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Тип меры</p>
                        <Badge variant="outline" className="mt-1">
                          {template.controlType === "preventive"
                            ? "Превентивная"
                            : template.controlType === "detective"
                              ? "Детективная"
                              : template.controlType === "corrective"
                                ? "Корректирующая"
                                : "Компенсирующая"}
                        </Badge>
                      </div>
                      {template.category && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Категория</p>
                          <p className="mt-1 text-sm font-medium">{template.category}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Частота проверки
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {template.frequency === "daily"
                            ? "Ежедневно"
                            : template.frequency === "weekly"
                              ? "Еженедельно"
                              : template.frequency === "monthly"
                                ? "Ежемесячно"
                                : template.frequency === "quarterly"
                                  ? "Ежеквартально"
                                  : "Ежегодно"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Автоматизация
                        </p>
                        <Badge variant={template.isAutomated ? "default" : "secondary"} className="mt-1">
                          {template.isAutomated ? "Автоматизирована" : "Ручная"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Видимость</p>
                        <Badge variant={template.isPublic ? "default" : "secondary"} className="mt-1">
                          {template.isPublic ? "Публичный" : "Приватный"}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evidence-types" className="mt-6">
          <ControlTemplateEvidenceTypesTab templateId={params.id} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить шаблон меры?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить шаблон меры <strong>{template.code}</strong>? Это действие нельзя отменить.
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
