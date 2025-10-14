"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Minus, RotateCcw } from "lucide-react"

interface Organization {
  id: string
  name: string
  mappingType: "automatic" | "manual_include" | "manual_exclude"
  reason?: string
}

interface OrganizationsListProps {
  organizations: Organization[]
  totalOrganizations: number
  onManualAction: (organizationId: string, action: "include" | "exclude" | "remove", reason?: string) => Promise<void>
}

export function OrganizationsList({ organizations, totalOrganizations, onManualAction }: OrganizationsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<"include" | "exclude" | null>(null)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [reason, setReason] = useState("")

  const filteredOrgs = organizations.filter((org) => org.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleOpenDialog = (org: Organization, action: "include" | "exclude") => {
    setSelectedOrg(org)
    setDialogAction(action)
    setReason("")
    setDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedOrg || !dialogAction) return

    await onManualAction(selectedOrg.id, dialogAction, reason)
    setDialogOpen(false)
    setSelectedOrg(null)
    setDialogAction(null)
    setReason("")
  }

  const handleRemove = async (org: Organization) => {
    await onManualAction(org.id, "remove")
  }

  const getMappingBadge = (mappingType: string) => {
    switch (mappingType) {
      case "automatic":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Автоматически
          </Badge>
        )
      case "manual_include":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Добавлено вручную
          </Badge>
        )
      case "manual_exclude":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Исключено вручную
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Поиск организаций..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          Показано {filteredOrgs.length} из {organizations.length} применимых организаций (всего {totalOrganizations})
        </div>
      </div>

      {/* Organizations List */}
      <div className="grid gap-3">
        {filteredOrgs.map((org) => (
          <Card key={org.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{org.name}</h4>
                  {getMappingBadge(org.mappingType)}
                </div>
                {org.reason && <p className="text-sm text-muted-foreground mt-1">Причина: {org.reason}</p>}
              </div>

              <div className="flex items-center gap-2">
                {org.mappingType === "automatic" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(org, "exclude")}>
                      <Minus className="mr-2 h-4 w-4" />
                      Исключить
                    </Button>
                  </>
                )}
                {org.mappingType === "manual_include" && (
                  <Button variant="outline" size="sm" onClick={() => handleRemove(org)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Отменить
                  </Button>
                )}
                {org.mappingType === "manual_exclude" && (
                  <Button variant="outline" size="sm" onClick={() => handleRemove(org)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Вернуть
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredOrgs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium">Организации не найдены</p>
          <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры или поисковый запрос</p>
        </div>
      )}

      {/* Manual Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogAction === "include" ? "Добавить организацию" : "Исключить организацию"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <Label>Организация</Label>
              <p className="text-sm font-medium mt-1">{selectedOrg?.name}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Причина</Label>
              <Textarea
                id="reason"
                placeholder="Укажите причину ручного добавления/исключения..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleConfirm}>{dialogAction === "include" ? "Добавить" : "Исключить"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
