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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { UserPlus } from "lucide-react"

interface AssignUserDialogProps {
  complianceId: string
  currentAssignee?: string | null
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function AssignUserDialog({ complianceId, currentAssignee, onSuccess, trigger }: AssignUserDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string>(currentAssignee || "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsers(data.data || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleAssign = async () => {
    if (!selectedUser) {
      toast({
        title: "Выберите пользователя",
        description: "Необходимо выбрать ответственного",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/compliance/${complianceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTo: selectedUser,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign user")
      }

      toast({
        title: "Ответственный назначен",
        description: "Пользователь успешно назначен ответственным",
      })

      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to assign user:", error)
      toast({
        title: "Ошибка назначения",
        description: "Не удалось назначить ответственного",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Назначить ответственного
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Назначить ответственного</DialogTitle>
          <DialogDescription>Выберите пользователя, который будет отвечать за выполнение требования</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">Ответственный</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger id="user">
                <SelectValue placeholder="Выберите пользователя" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? "Назначение..." : "Назначить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
