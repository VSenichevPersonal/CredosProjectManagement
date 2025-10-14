"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type DictionaryItem = { id: string; code: string; name: string }

type ValidationErrors = {
  code?: string[]
  title?: string[]
  description?: string[]
  regulatoryFrameworkId?: string[]
  legalArticleId?: string[]
  [key: string]: string[] | undefined
}

export function CreateRequirementDialog() {
  const router = useRouter()
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

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    status: "active" as const,
    regulatorId: "",
    regulatoryFrameworkId: "",
    legalArticleId: "",
    categoryId: "",
    criticality: "",
    periodicityId: "",
    verificationMethodId: "",
    responsibleRoleId: "",
    effectiveDate: "",
    expirationDate: "",
    documentId: null,
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
      ])
        .then(([regs, cats, pers, vms, rrs, rfs]) => {
          if (regs.data) setRegulators(regs.data)
          if (cats.data) setCategories(cats.data)
          if (pers.data) setPeriodicities(pers.data)
          if (vms.data) setVerificationMethods(vms.data)
          if (rrs.data) setResponsibleRoles(rrs.data)
          if (rfs.data) setRegulatoryFrameworks(rfs.data)
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
        categoryId: formData.categoryId || undefined,
        criticality: formData.criticality || undefined,
        periodicityId: formData.periodicityId || undefined,
        verificationMethodId: formData.verificationMethodId || undefined,
        responsibleRoleId: formData.responsibleRoleId || undefined,
        effectiveDate: formData.effectiveDate || undefined,
        expirationDate: formData.expirationDate || undefined,
        documentId: undefined,
      }

      console.log("[v0] Creating requirement with payload:", payload)

      const response = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        console.log("[v0] API error response:", error)

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
          title: "Ошибка создания требования",
          description: error.message || "Не удалось создать требование",
          variant: "destructive",
        })
        throw new Error(error.message || "Failed to create requirement")
      }

      const result = await response.json()
      const createdRequirement = result.data

      toast({
        title: "Требование создано",
        description: "Требование успешно добавлено в систему",
      })

      setFormData({
        code: "",
        title: "",
        description: "",
        status: "active",
        regulatorId: "",
        regulatoryFrameworkId: "",
        legalArticleId: "",
        categoryId: "",
        criticality: "",
        periodicityId: "",
        verificationMethodId: "",
        responsibleRoleId: "",
        effectiveDate: "",
        expirationDate: "",
        documentId: null,
      })
      setOpen(false)

      router.push(`/requirements/${createdRequirement.id}`)
    } catch (error) {
      console.error("Failed to create requirement:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Создать требование
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создайте новое регуляторное требование</DialogTitle>
          <DialogDescription>Заполните все необходимые поля для создания требования</DialogDescription>
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
                <p className="text-xs text-muted-foreground">
                  Минимум 3 символа, только заглавные буквы, цифры и дефис
                </p>
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
              <p className="text-xs text-muted-foreground">
                Закон или норматив, который вводит это требование (152-ФЗ, 187-ФЗ и т.д.)
              </p>
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
              <p className="text-xs text-muted-foreground">Минимум 5 символов, максимум 200</p>
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
                <p className="text-xs text-muted-foreground">Когда требование вступило в силу</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expirationDate">Дата отмены</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Когда требование было отменено (если применимо)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
