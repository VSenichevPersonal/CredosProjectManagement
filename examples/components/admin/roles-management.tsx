"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Shield, Users, Settings } from "lucide-react"
import { RoleCard } from "./role-card"
import { CreateRoleDialog } from "./create-role-dialog"
import { PermissionsMatrix } from "./permissions-matrix"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RolesManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const { data: rolesData, mutate } = useSWR("/api/rbac/roles", fetcher)
  const { data: resourcesData } = useSWR("/api/rbac/resources", fetcher)
  const { data: actionsData } = useSWR("/api/rbac/actions", fetcher)

  const roles = rolesData?.data || []
  const resources = resourcesData?.data || []
  const actions = actionsData?.data || []

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Роли системы</h2>
            <Badge variant="secondary">{roles.length}</Badge>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать роль
          </Button>
        </div>

        <Tabs defaultValue="roles" className="w-full">
          <TabsList>
            <TabsTrigger value="roles">
              <Users className="h-4 w-4 mr-2" />
              Роли
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Settings className="h-4 w-4 mr-2" />
              Матрица прав
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role: any) => (
                <RoleCard key={role.id} role={role} onEdit={() => setSelectedRole(role.id)} onRefresh={mutate} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <PermissionsMatrix roles={roles} resources={resources} actions={actions} onUpdate={mutate} />
          </TabsContent>
        </Tabs>
      </Card>

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={mutate}
        resources={resources}
        actions={actions}
      />
    </div>
  )
}
