"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Users, Edit, Trash2 } from "lucide-react"
import { useState } from "react"
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

interface RoleCardProps {
  role: {
    id: string
    name: string
    description: string
    isSystem: boolean
    usersCount: number
    permissionsCount: number
  }
  onEdit: () => void
  onRefresh: () => void
}

export function RoleCard({ role, onEdit, onRefresh }: RoleCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/rbac/roles/${role.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onRefresh()
        setDeleteDialogOpen(false)
      }
    } catch (error) {
      console.error("Failed to delete role:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="p-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{role.name}</h3>
          </div>
          {role.isSystem && (
            <Badge variant="secondary" className="text-xs">
              Системная
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{role.description}</p>

        <div className="flex items-center gap-3 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{role.usersCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{role.permissionsCount} прав</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 bg-transparent h-8 text-xs">
            <Edit className="h-3 w-3 mr-1" />
            Изменить
          </Button>
          {!role.isSystem && (
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="h-8">
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить роль?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить роль "{role.name}"? Это действие нельзя отменить. Пользователи с этой ролью
              потеряют доступ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
