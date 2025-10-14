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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  resources: any[]
  actions: any[]
}

export function CreateRoleDialog({ open, onOpenChange, onSuccess, resources, actions }: CreateRoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({})
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const permissions = Object.entries(selectedPermissions)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => {
          const [resourceId, actionId] = key.split("-")
          return { resourceId, actionId }
        })

      const response = await fetch("/api/rbac/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, permissions }),
      })

      if (response.ok) {
        setName("")
        setDescription("")
        setSelectedPermissions({})
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to create role:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const togglePermission = (resourceId: string, actionId: string) => {
    const key = `${resourceId}-${actionId}`
    setSelectedPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать новую роль</DialogTitle>
          <DialogDescription>Укажите название, описание и выберите права для новой роли</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название роли *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Аналитик безопасности"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание роли и её назначения"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Права доступа</Label>
            <div className="border rounded-lg p-4 space-y-4">
              {resources.map((resource: any) => (
                <div key={resource.id} className="space-y-2">
                  <div className="font-medium">{resource.name}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-4">
                    {actions.map((action: any) => (
                      <div key={action.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`${resource.id}-${action.id}`}
                          checked={selectedPermissions[`${resource.id}-${action.id}`] || false}
                          onCheckedChange={() => togglePermission(resource.id, action.id)}
                        />
                        <Label htmlFor={`${resource.id}-${action.id}`} className="text-sm cursor-pointer">
                          {action.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={!name || isCreating}>
            {isCreating ? "Создание..." : "Создать роль"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
