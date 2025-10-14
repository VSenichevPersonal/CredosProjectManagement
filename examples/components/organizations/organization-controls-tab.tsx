"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, CheckCircle2, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrganizationControl {
  id: string
  control: {
    id: string
    code: string
    title: string
    description: string
    type: string
    frequency: string
  }
  status: string
  effectiveness: number | null
  last_test_date: string | null
  next_test_date: string | null
  responsible_user_id: string | null
  notes: string | null
}

interface OrganizationControlsTabProps {
  organizationId: string
}

export function OrganizationControlsTab({ organizationId }: OrganizationControlsTabProps) {
  const [controls, setControls] = useState<OrganizationControl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadControls()
  }, [organizationId])

  const loadControls = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/organizations/${organizationId}/controls`)

      if (!response.ok) {
        throw new Error("Failed to load controls")
      }

      const data = await response.json()
      setControls(data.controls || [])
    } catch (error) {
      console.error("Failed to load controls:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить меры защиты",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "implemented":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Реализовано
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />В процессе
          </Badge>
        )
      case "planned":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Запланировано
          </Badge>
        )
      case "not_applicable":
        return <Badge variant="secondary">Не применимо</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "preventive":
        return (
          <Badge variant="outline" className="bg-blue-50">
            Превентивная
          </Badge>
        )
      case "detective":
        return (
          <Badge variant="outline" className="bg-yellow-50">
            Детективная
          </Badge>
        )
      case "corrective":
        return (
          <Badge variant="outline" className="bg-orange-50">
            Корректирующая
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (controls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Меры/Контроли</CardTitle>
          <CardDescription>Меры защиты информации, реализованные в организации</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет мер защиты</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Для этой организации еще не назначены меры защиты информации
            </p>
            <Button variant="outline">Назначить меры защиты</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = {
    total: controls.length,
    implemented: controls.filter((c) => c.status === "implemented").length,
    inProgress: controls.filter((c) => c.status === "in_progress").length,
    planned: controls.filter((c) => c.status === "planned").length,
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего мер</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Реализовано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.implemented}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.implemented / stats.total) * 100) : 0}% от общего числа
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">В процессе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Запланировано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.planned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls List */}
      <Card>
        <CardHeader>
          <CardTitle>Меры/Контроли</CardTitle>
          <CardDescription>Список мер защиты информации, реализованных в организации</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {controls.map((orgControl) => (
              <Card key={orgControl.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{orgControl.control.code}</code>
                        {getTypeBadge(orgControl.control.type)}
                        {getStatusBadge(orgControl.status)}
                      </div>
                      <CardTitle className="text-base">{orgControl.control.title}</CardTitle>
                    </div>
                    {orgControl.effectiveness !== null && (
                      <Badge variant="outline" className="ml-2">
                        Эффективность: {orgControl.effectiveness}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{orgControl.control.description}</p>

                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div>
                      <span className="font-medium">Частота проверки:</span>{" "}
                      <span className="text-muted-foreground">
                        {orgControl.control.frequency === "continuous" && "Непрерывно"}
                        {orgControl.control.frequency === "daily" && "Ежедневно"}
                        {orgControl.control.frequency === "weekly" && "Еженедельно"}
                        {orgControl.control.frequency === "monthly" && "Ежемесячно"}
                        {orgControl.control.frequency === "quarterly" && "Ежеквартально"}
                        {orgControl.control.frequency === "annually" && "Ежегодно"}
                        {orgControl.control.frequency === "on_demand" && "По требованию"}
                      </span>
                    </div>

                    {orgControl.last_test_date && (
                      <div>
                        <span className="font-medium">Последняя проверка:</span>{" "}
                        <span className="text-muted-foreground">
                          {new Date(orgControl.last_test_date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    )}

                    {orgControl.next_test_date && (
                      <div>
                        <span className="font-medium">Следующая проверка:</span>{" "}
                        <span className="text-muted-foreground">
                          {new Date(orgControl.next_test_date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    )}
                  </div>

                  {orgControl.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm">
                        <span className="font-medium">Примечания:</span>{" "}
                        <span className="text-muted-foreground">{orgControl.notes}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
