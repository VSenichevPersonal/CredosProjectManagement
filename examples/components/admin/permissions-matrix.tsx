"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import useSWR from "swr"

interface PermissionsMatrixProps {
  roles: any[]
  resources: any[]
  actions: any[]
  onUpdate: () => void
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PermissionsMatrix({ roles, resources, actions, onUpdate }: PermissionsMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(roles[0]?.id || null)
  const [changes, setChanges] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)

  const { data: permissionsData, mutate } = useSWR(
    selectedRole ? `/api/rbac/roles/${selectedRole}/permissions` : null,
    fetcher,
  )

  const permissions = permissionsData?.data || []

  const hasPermission = (resourceId: string, actionId: string) => {
    const key = `${resourceId}-${actionId}`
    if (key in changes) return changes[key]
    return permissions.some((p: any) => p.resourceId === resourceId && p.actionId === actionId)
  }

  const togglePermission = (resourceId: string, actionId: string) => {
    const key = `${resourceId}-${actionId}`
    setChanges((prev) => ({
      ...prev,
      [key]: !hasPermission(resourceId, actionId),
    }))
  }

  const handleSave = async () => {
    if (!selectedRole) return

    setIsSaving(true)
    try {
      const updates = Object.entries(changes).map(([key, enabled]) => {
        const [resourceId, actionId] = key.split("-")
        return { resourceId, actionId, enabled }
      })

      const response = await fetch(`/api/rbac/roles/${selectedRole}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })

      if (response.ok) {
        setChanges({})
        mutate()
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to save permissions:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedRoleData = roles.find((r) => r.id === selectedRole)
  const hasChanges = Object.keys(changes).length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {roles.map((role) => (
            <Button
              key={role.id}
              variant={selectedRole === role.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedRole(role.id)
                setChanges({})
              }}
            >
              {role.name}
            </Button>
          ))}
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        )}
      </div>

      {selectedRoleData && (
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold mb-1">{selectedRoleData.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedRoleData.description}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Ресурс</th>
                  {actions.map((action: any) => (
                    <th key={action.id} className="text-center p-2 font-medium">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs">{action.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resources.map((resource: any) => (
                  <tr key={resource.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-xs text-muted-foreground">{resource.description}</div>
                      </div>
                    </td>
                    {actions.map((action: any) => (
                      <td key={action.id} className="text-center p-2">
                        <Checkbox
                          checked={hasPermission(resource.id, action.id)}
                          onCheckedChange={() => togglePermission(resource.id, action.id)}
                          disabled={selectedRoleData.isSystem}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRoleData.isSystem && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Системные роли нельзя изменять. Создайте новую роль для кастомизации прав.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
