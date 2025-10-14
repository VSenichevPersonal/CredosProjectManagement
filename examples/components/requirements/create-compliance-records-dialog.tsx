"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, CheckCircle2, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Organization {
  id: string
  name: string
  mappingType: "automatic" | "manual_include" | "manual_exclude" | "none"
}

interface CreateComplianceRecordsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requirementId: string
  requirementCode: string
  organizations: Organization[]
  onSuccess: () => void
}

export function CreateComplianceRecordsDialog({
  open,
  onOpenChange,
  requirementId,
  requirementCode,
  organizations,
  onSuccess,
}: CreateComplianceRecordsDialogProps) {
  const { toast } = useToast()
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)

  // Filter applicable organizations (automatic + manual_include)
  const applicableOrgs = organizations.filter(
    (org) => org.mappingType === "automatic" || org.mappingType === "manual_include",
  )

  // Select all by default when dialog opens
  useState(() => {
    if (open && applicableOrgs.length > 0) {
      setSelectedOrgs(new Set(applicableOrgs.map((org) => org.id)))
    }
  })

  const handleToggleOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs)
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId)
    } else {
      newSelected.add(orgId)
    }
    setSelectedOrgs(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedOrgs.size === applicableOrgs.length) {
      setSelectedOrgs(new Set())
    } else {
      setSelectedOrgs(new Set(applicableOrgs.map((org) => org.id)))
    }
  }

  const handleCreate = async () => {
    if (selectedOrgs.size === 0) {
      toast({
        title: "Выберите организации",
        description: "Необходимо выбрать хотя бы одну организацию",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      console.log("[v0] Creating compliance records", {
        requirementId,
        organizationIds: Array.from(selectedOrgs),
      })

      const response = await fetch(`/api/requirements/${requirementId}/compliance/bulk-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationIds: Array.from(selectedOrgs),
        }),
      })

      console.log("[v0] Response status:", response.status)

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to create compliance records")
      }

      toast({
        title: "Записи созданы",
        description: `Создано ${data.created} записей соответствия для ${selectedOrgs.size} организаций`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Failed to create compliance records:", error)
      toast({
        title: "Ошибка создания",
        description: error.message || "Не удалось создать записи соответствия",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Создать записи соответствия</DialogTitle>
          <DialogDescription>
            Создание записей соответствия для требования <strong>{requirementCode}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Что будет создано?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Для каждой выбранной организации будет создана запись соответствия со статусом "Не начато". Это
                  позволит отслеживать выполнение требования, назначать ответственных и загружать доказательства.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">{applicableOrgs.length}</div>
              <div className="text-xs text-muted-foreground">Применимых организаций</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold text-blue-600">{selectedOrgs.size}</div>
              <div className="text-xs text-muted-foreground">Выбрано для создания</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold text-green-600">{applicableOrgs.length - selectedOrgs.size}</div>
              <div className="text-xs text-muted-foreground">Будет пропущено</div>
            </div>
          </div>

          {/* Organizations list */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Выберите организации</p>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedOrgs.size === applicableOrgs.length ? "Снять все" : "Выбрать все"}
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-lg border">
              <div className="p-4 flex flex-col gap-2">
                {applicableOrgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">Нет применимых организаций для этого требования</p>
                  </div>
                ) : (
                  applicableOrgs.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleOrg(org.id)}
                    >
                      <Checkbox checked={selectedOrgs.has(org.id)} onCheckedChange={() => handleToggleOrg(org.id)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{org.name}</p>
                      </div>
                      <Badge variant={org.mappingType === "automatic" ? "default" : "secondary"}>
                        {org.mappingType === "automatic" ? "Автоматически" : "Вручную"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Warning */}
          {selectedOrgs.size > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm text-green-800">
                  Будет создано <strong>{selectedOrgs.size}</strong> записей соответствия
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || selectedOrgs.size === 0}>
            {isCreating ? "Создание..." : `Создать ${selectedOrgs.size} записей`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
