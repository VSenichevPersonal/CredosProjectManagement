"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Requirement } from "@/types/domain/requirement"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

type DictionaryItem = { id: string; code: string; name: string }

type ValidationErrors = {
  code?: string[]
  title?: string[]
  description?: string[]
  regulatoryFrameworkId?: string[]
  [key: string]: string[] | undefined
}

interface EditRequirementDialogProps {
  requirement: Requirement
  onSuccess?: () => void
}

export function EditRequirementDialog({ requirement, onSuccess }: EditRequirementDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [regulators, setRegulators] = useState<DictionaryItem[]>([])
  const [categories, setCategories] = useState<DictionaryItem[]>([])
  const [periodicities, setPeriodicities] = useState<DictionaryItem[]>([])
  const [verificationMethods, setVerificationMethods] = useState<DictionaryItem[]>([])
  const [responsibleRoles, setResponsibleRoles] = useState<DictionaryItem[]>([])
  const [regulatoryFrameworks, setRegulatoryFrameworks] = useState<DictionaryItem[]>([])
  const [legalArticles, setLegalArticles] = useState<Array<{ id: string; fullReference: string }>>([])
  const [evidenceTypes, setEvidenceTypes] = useState<Array<{ id: string; code: string; title: string }>>([])
  const [controlTemplates, setControlTemplates] = useState<Array<{ id: string; code: string; title: string }>>([])

  const [formData, setFormData] = useState({
    code: requirement.code,
    title: requirement.title,
    description: requirement.description,
    status: requirement.status,
    regulatorId: requirement.regulatorId || "",
    regulatoryFrameworkId: requirement.regulatoryFrameworkId || "",
    legalArticleId: requirement.legalArticleId || "",
    category: requirement.category || "",
    criticality: requirement.criticality || "",
    periodicityId: requirement.periodicityId || "",
    verificationMethodId: requirement.verificationMethodId || "",
    responsibleRoleId: requirement.responsibleRoleId || "",
    effectiveDate: requirement.effectiveDate ? new Date(requirement.effectiveDate).toISOString().split("T")[0] : "",
    expirationDate: requirement.expirationDate ? new Date(requirement.expirationDate).toISOString().split("T")[0] : "",
    measureMode: requirement.measureMode || "flexible",
    evidenceTypeMode: requirement.evidenceTypeMode || "flexible",
    allowedEvidenceTypeIds: requirement.allowedEvidenceTypeIds || [],
    suggestedControlMeasureTemplateIds: requirement.suggestedControlMeasureTemplateIds || [],
  })
  const [errors, setErrors] = useState<ValidationErrors>({})

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/dictionaries/regulators").then((r) => r.json()),
        fetch("/api/dictionaries/categories").then((r) => r.json()),
        fetch("/api/dictionaries/periodicities").then((r) => r.json()),
        fetch("/api/dictionaries/verification-methods").then((r) => r.json()),
        fetch("/api/dictionaries/responsible-roles").then((r) => r.json()),
        fetch("/api/dictionaries/regulatory-frameworks").then((r) => r.json()),
        fetch("/api/dictionaries/evidence-types").then((r) => r.json()),
        fetch(`/api/requirements/${requirement.id}/control-templates`).then((r) => r.json()),
      ])
        .then(([regs, cats, pers, vms, rrs, rfs, ets, cts]) => {
          if (regs.data) setRegulators(regs.data)
          if (cats.data) setCategories(cats.data)
          if (pers.data) setPeriodicities(pers.data)
          if (vms.data) setVerificationMethods(vms.data)
          if (rrs.data) setResponsibleRoles(rrs.data)
          if (rfs.data) setRegulatoryFrameworks(rfs.data)
          if (ets.data) setEvidenceTypes(ets.data)
          if (cts.data) setControlTemplates(cts.data)
        })
        .catch((error) => {
          console.error("Failed to load dictionaries:", error)
        })
    }
  }, [open])

  useEffect(() => {
    if (formData.regulatoryFrameworkId) {
      fetch(`/api/legal-articles?regulatory_framework_id=${formData.regulatoryFrameworkId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.data) setLegalArticles(data.data)
        })
        .catch((error) => {
          console.error("Failed to load legal articles:", error)
        })
    } else {
      setLegalArticles([])
      setFormData((prev) => ({ ...prev, legalArticleId: "" }))
    }
  }, [formData.regulatoryFrameworkId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const payload = {
        code: formData.code,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        regulatorId: formData.regulatorId || undefined,
        regulatoryFrameworkId: formData.regulatoryFrameworkId || undefined,
        legalArticleId: formData.legalArticleId || undefined,
        category: formData.category || undefined,
        criticality: formData.criticality || undefined,
        periodicityId: formData.periodicityId || undefined,
        verificationMethodId: formData.verificationMethodId || undefined,
        responsibleRoleId: formData.responsibleRoleId || undefined,
        effectiveDate: formData.effectiveDate || undefined,
        expirationDate: formData.expirationDate || undefined,
        measureMode: formData.measureMode,
        evidenceTypeMode: formData.evidenceTypeMode,
        allowedEvidenceTypeIds: formData.allowedEvidenceTypeIds,
        suggestedControlMeasureTemplateIds: formData.suggestedControlMeasureTemplateIds,
      }

      const response = await fetch(`/api/requirements/${requirement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()

        if (error.code === "VALIDATION_ERROR" && error.details?.fieldErrors) {
          setErrors(error.details.fieldErrors)
          toast({
            title: "Ошибка валидации",
            description: "Пожалуйста, исправьте ошибки в форме",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Ошибка обновления требования",
          description: error.message || "Не удалось обновить требование",
          variant: "destructive",
        })
        throw new Error(error.message || "Failed to update requirement")
      }

      toast({
        title: "Требование обновлено",
        description: "Изменения успешно сохранены",
      })

      setOpen(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to update requirement:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать требование</DialogTitle>
          <DialogDescription>Внесите изменения в требование</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">
                  Код требования <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="КИИ-2025-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className={errors.code ? "border-destructive" : ""}
                />
                {errors.code && <p className="text-sm text-destructive">{errors.code[0]}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="regulator">Регулятор</Label>
                <Select
                  value={formData.regulatorId}
                  onValueChange={(value) => setFormData({ ...formData, regulatorId: value })}
                >
                  <SelectTrigger id="regulator">
                    <SelectValue placeholder="Выберите регулятора" />
                  </SelectTrigger>
                  <SelectContent>
                    {regulators.map((reg) => (
                      <SelectItem key={reg.id} value={reg.id}>
                        {reg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="regulatoryFramework">
                Нормативная база <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.regulatoryFrameworkId}
                onValueChange={(value) => setFormData({ ...formData, regulatoryFrameworkId: value })}
              >
                <SelectTrigger id="regulatoryFramework">
                  <SelectValue placeholder="Выберите закон/норматив" />
                </SelectTrigger>
                <SelectContent>
                  {regulatoryFrameworks.map((rf) => (
                    <SelectItem key={rf.id} value={rf.id}>
                      {rf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="legalArticle">Статья документа</Label>
              <Select
                value={formData.legalArticleId}
                onValueChange={(value) => setFormData({ ...formData, legalArticleId: value })}
                disabled={!formData.regulatoryFrameworkId}
              >
                <SelectTrigger id="legalArticle">
                  <SelectValue
                    placeholder={
                      formData.regulatoryFrameworkId ? "Выберите статью документа" : "Сначала выберите нормативную базу"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {legalArticles.length === 0 && formData.regulatoryFrameworkId && (
                    <div className="p-2 text-sm text-muted-foreground">Нет доступных статей для этого документа</div>
                  )}
                  {legalArticles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.fullReference}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Конкретная статья, часть или пункт документа (например: "ч. 1 ст. 18.1")
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">
                Название <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Определение уровня защищенности"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title[0]}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">
                Описание <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Подробное описание требования..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="effectiveDate">Дата введения</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expirationDate">Дата отмены</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.code}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="criticality">Критичность</Label>
                <Select
                  value={formData.criticality}
                  onValueChange={(value) => setFormData({ ...formData, criticality: value })}
                >
                  <SelectTrigger id="criticality">
                    <SelectValue placeholder="Выберите уровень" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Критический</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="low">Низкий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="periodicity">Периодичность</Label>
                <Select
                  value={formData.periodicityId}
                  onValueChange={(value) => setFormData({ ...formData, periodicityId: value })}
                >
                  <SelectTrigger id="periodicity">
                    <SelectValue placeholder="Выберите периодичность" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodicities.map((per) => (
                      <SelectItem key={per.id} value={per.id}>
                        {per.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="verificationMethod">Способ подтверждения</Label>
                <Select
                  value={formData.verificationMethodId}
                  onValueChange={(value) => setFormData({ ...formData, verificationMethodId: value })}
                >
                  <SelectTrigger id="verificationMethod">
                    <SelectValue placeholder="Выберите способ" />
                  </SelectTrigger>
                  <SelectContent>
                    {verificationMethods.map((vm) => (
                      <SelectItem key={vm.id} value={vm.id}>
                        {vm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="responsibleRole">Ответственная роль</Label>
              <Select
                value={formData.responsibleRoleId}
                onValueChange={(value) => setFormData({ ...formData, responsibleRoleId: value })}
              >
                <SelectTrigger id="responsibleRole">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  {responsibleRoles.map((rr) => (
                    <SelectItem key={rr.id} value={rr.id}>
                      {rr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="active">Активно</SelectItem>
                  <SelectItem value="archived">Архив</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Execution modes section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Режимы исполнения</h3>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="measureMode">Режим по мерам</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Строгий: только предложенные меры. Гибкий: можно добавлять свои
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Гибкий</span>
                    <Switch
                      id="measureMode"
                      checked={formData.measureMode === "strict"}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, measureMode: checked ? "strict" : "flexible" })
                      }
                    />
                    <span className="text-sm font-medium">Строгий</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="evidenceTypeMode">Режим по доказательствам</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Строгий: только указанные типы. Гибкий: можно использовать любые
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Гибкий</span>
                    <Switch
                      id="evidenceTypeMode"
                      checked={formData.evidenceTypeMode === "strict"}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, evidenceTypeMode: checked ? "strict" : "flexible" })
                      }
                    />
                    <span className="text-sm font-medium">Строгий</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allowed evidence types section */}
            <div className="flex flex-col gap-2">
              <Label>Допустимые типы доказательств</Label>
              <Select
                onValueChange={(value) => {
                  if (!formData.allowedEvidenceTypeIds.includes(value)) {
                    setFormData({
                      ...formData,
                      allowedEvidenceTypeIds: [...formData.allowedEvidenceTypeIds, value],
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Добавить тип доказательства" />
                </SelectTrigger>
                <SelectContent>
                  {evidenceTypes
                    .filter((et) => !formData.allowedEvidenceTypeIds.includes(et.id))
                    .map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        {et.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allowedEvidenceTypeIds.map((id) => {
                  const et = evidenceTypes.find((e) => e.id === id)
                  return et ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {et.title}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            allowedEvidenceTypeIds: formData.allowedEvidenceTypeIds.filter((eid) => eid !== id),
                          })
                        }
                      />
                    </Badge>
                  ) : null
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.evidenceTypeMode === "strict"
                  ? "В строгом режиме организации могут загружать только эти типы доказательств"
                  : "В гибком режиме эти типы предлагаются по умолчанию, но можно использовать любые"}
              </p>
            </div>

            {/* Suggested control measures section */}
            <div className="flex flex-col gap-2">
              <Label>Рекомендуемые меры контроля</Label>
              <Select
                onValueChange={(value) => {
                  if (!formData.suggestedControlMeasureTemplateIds.includes(value)) {
                    setFormData({
                      ...formData,
                      suggestedControlMeasureTemplateIds: [...formData.suggestedControlMeasureTemplateIds, value],
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Добавить рекомендуемую меру" />
                </SelectTrigger>
                <SelectContent>
                  {controlTemplates
                    .filter((ct) => !formData.suggestedControlMeasureTemplateIds.includes(ct.id))
                    .map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.suggestedControlMeasureTemplateIds.map((id) => {
                  const ct = controlTemplates.find((c) => c.id === id)
                  return ct ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {ct.title}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            suggestedControlMeasureTemplateIds: formData.suggestedControlMeasureTemplateIds.filter(
                              (cid) => cid !== id,
                            ),
                          })
                        }
                      />
                    </Badge>
                  ) : null
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.measureMode === "strict"
                  ? "В строгом режиме организации обязаны использовать только эти меры"
                  : "В гибком режиме эти меры предлагаются, но можно добавлять свои"}
              </p>
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
