"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"
import type { OrganizationAttributes } from "@/types/domain/organization"

interface OrganizationAttributesFormProps {
  organizationId: string
  initialAttributes: OrganizationAttributes
  onSave: (attributes: OrganizationAttributes) => Promise<void>
}

export function OrganizationAttributesForm({
  organizationId,
  initialAttributes,
  onSave,
}: OrganizationAttributesFormProps) {
  const [attributes, setAttributes] = useState<OrganizationAttributes>(initialAttributes)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const attributesToSave = {
        ...attributes,
        kiiCategory: attributes.kiiCategory === null ? null : attributes.kiiCategory,
        pdnLevel: attributes.pdnLevel === null ? null : attributes.pdnLevel,
      }
      await onSave(attributesToSave)
    } catch (error) {
      console.error("Failed to save attributes:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Атрибуты организации</h3>
          <p className="text-sm text-muted-foreground">
            Атрибуты используются для автоматического определения применимых требований
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* КИИ Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Критическая информационная инфраструктура</h4>
            <Badge variant="outline">КИИ</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="kiiCategory">Категория КИИ</Label>
            <Select
              value={attributes.kiiCategory?.toString() || "none"}
              onValueChange={(value) =>
                setAttributes({
                  ...attributes,
                  kiiCategory: value === "none" ? null : (Number.parseInt(value) as 1 | 2 | 3),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Не является субъектом КИИ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не является субъектом КИИ</SelectItem>
                <SelectItem value="1">Категория 1 (высокая значимость)</SelectItem>
                <SelectItem value="2">Категория 2 (средняя значимость)</SelectItem>
                <SelectItem value="3">Категория 3 (низкая значимость)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Категория значимости объекта КИИ согласно 187-ФЗ</p>
          </div>
        </div>

        {/* ПДн Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Персональные данные</h4>
            <Badge variant="outline">ПДн</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pdnLevel">Уровень защищенности ПДн</Label>
            <Select
              value={attributes.pdnLevel?.toString() || "none"}
              onValueChange={(value) =>
                setAttributes({
                  ...attributes,
                  pdnLevel: value === "none" ? null : (Number.parseInt(value) as 1 | 2 | 3 | 4),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Не обрабатывает ПДн" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не обрабатывает ПДн</SelectItem>
                <SelectItem value="1">УЗ-1 (высокий уровень)</SelectItem>
                <SelectItem value="2">УЗ-2</SelectItem>
                <SelectItem value="3">УЗ-3</SelectItem>
                <SelectItem value="4">УЗ-4 (низкий уровень)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Уровень защищенности согласно 152-ФЗ и приказу ФСТЭК №21</p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="hasForeignData"
              checked={attributes.hasForeignData}
              onCheckedChange={(checked) => setAttributes({ ...attributes, hasForeignData: checked as boolean })}
            />
            <Label htmlFor="hasForeignData" className="cursor-pointer text-sm">
              Обработка данных иностранных граждан
            </Label>
          </div>
        </div>

        {/* Organization Type Section */}
        <div className="flex flex-col gap-4">
          <h4 className="font-medium">Тип организации</h4>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isFinancial"
                checked={attributes.isFinancial}
                onCheckedChange={(checked) => setAttributes({ ...attributes, isFinancial: checked as boolean })}
              />
              <Label htmlFor="isFinancial" className="cursor-pointer text-sm">
                Финансовая организация
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isHealthcare"
                checked={attributes.isHealthcare}
                onCheckedChange={(checked) => setAttributes({ ...attributes, isHealthcare: checked as boolean })}
              />
              <Label htmlFor="isHealthcare" className="cursor-pointer text-sm">
                Медицинская организация
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isGovernment"
                checked={attributes.isGovernment}
                onCheckedChange={(checked) => setAttributes({ ...attributes, isGovernment: checked as boolean })}
              />
              <Label htmlFor="isGovernment" className="cursor-pointer text-sm">
                Государственная организация
              </Label>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="flex flex-col gap-4">
          <h4 className="font-medium">Дополнительная информация</h4>

          <div className="flex flex-col gap-2">
            <Label htmlFor="employeeCount">Количество сотрудников</Label>
            <Input
              id="employeeCount"
              type="number"
              placeholder="Введите количество"
              value={attributes.employeeCount || ""}
              onChange={(e) =>
                setAttributes({
                  ...attributes,
                  employeeCount: e.target.value ? Number.parseInt(e.target.value) : null,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Используется для определения применимости требований по численности персонала
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-medium text-sm text-blue-900 mb-2">Как это работает?</h4>
        <p className="text-xs text-blue-800">
          Атрибуты организации используются для автоматического определения применимых требований. Например, если
          организация является субъектом КИИ категории 1, к ней автоматически применяются все требования для КИИ
          категории 1. Вы также можете вручную добавить или исключить требования.
        </p>
      </div>
    </Card>
  )
}
