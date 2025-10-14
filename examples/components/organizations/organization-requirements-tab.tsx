"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { RequirementsList } from "./requirements-list"
import { AddRequirementsDialog } from "./add-requirements-dialog"
import type { OrganizationRequirementsResult } from "@/types/domain/organization-requirements"
import { useToast } from "@/hooks/use-toast"

interface OrganizationRequirementsTabProps {
  organizationId: string
}

export function OrganizationRequirementsTab({ organizationId }: OrganizationRequirementsTabProps) {
  const [result, setResult] = useState<OrganizationRequirementsResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRequirements()
  }, [organizationId])

  const fetchRequirements = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/requirements`)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("[v0] Failed to fetch organization requirements:", error)
      setResult({
        organizationId,
        totalRequirements: 0,
        applicableRequirements: 0,
        automaticCount: 0,
        manualIncludeCount: 0,
        manualExcludeCount: 0,
        requirements: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualAction = async (requirementId: string, action: "remove" | "exclude", reason?: string) => {
    try {
      if (action === "exclude") {
        // Исключить требование
        const response = await fetch(`/api/organizations/${organizationId}/requirements/${requirementId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mappingType: "manual_exclude", reason }),
        })

        if (!response.ok) {
          throw new Error("Failed to exclude requirement")
        }

        toast({
          title: "Требование исключено",
          description: "Требование успешно исключено из организации",
        })
      } else if (action === "remove") {
        // Удалить mapping (отменить ручное действие)
        const response = await fetch(`/api/organizations/${organizationId}/requirements/${requirementId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to remove requirement")
        }

        toast({
          title: "Действие отменено",
          description: "Ручное действие успешно отменено",
        })
      }

      await fetchRequirements()
    } catch (error) {
      console.error("[v0] Failed to update requirement mapping:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить требование",
        variant: "destructive",
      })
    }
  }

  const handleAddRequirements = async () => {
    await fetchRequirements()
    setDialogOpen(false)
  }

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Применимые требования</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchRequirements}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить требования
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{result?.applicableRequirements || 0}</div>
            <div className="text-sm text-muted-foreground">Применимых требований</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-blue-600">{result?.automaticCount || 0}</div>
            <div className="text-sm text-muted-foreground">Автоматически</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-green-600">{result?.manualIncludeCount || 0}</div>
            <div className="text-sm text-muted-foreground">Добавлено вручную</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-red-600">{result?.manualExcludeCount || 0}</div>
            <div className="text-sm text-muted-foreground">Исключено вручную</div>
          </div>
        </div>
      </Card>

      {/* Requirements List */}
      <RequirementsList
        requirements={result?.requirements || []}
        totalRequirements={result?.totalRequirements || 0}
        onManualAction={handleManualAction}
      />

      {/* Add Requirements Dialog */}
      <AddRequirementsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        organizationId={organizationId}
        onSuccess={handleAddRequirements}
      />
    </div>
  )
}
