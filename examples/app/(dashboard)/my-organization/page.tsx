"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, MapPin, Phone, Mail, Calendar } from "lucide-react"

export default function MyOrganizationPage() {
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyOrganization()
  }, [])

  const fetchMyOrganization = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/my-organization")
      if (!response.ok) throw new Error("Failed to fetch organization")
      const data = await response.json()
      setOrganization(data)
    } catch (error) {
      console.error("Failed to fetch my organization:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Организация не найдена</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground mt-2">Информация о вашей организации</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Основная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Тип организации</div>
              <div className="font-medium">{organization.organizationType?.name || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Уровень</div>
              <div className="font-medium">Уровень {organization.level}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ИНН</div>
              <div className="font-medium">{organization.inn || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ОГРН</div>
              <div className="font-medium">{organization.ogrn || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Статус</div>
              <Badge variant={organization.isActive ? "default" : "secondary"}>
                {organization.isActive ? "Активна" : "Неактивна"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Контактная информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Адрес
              </div>
              <div className="font-medium">{organization.address || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Телефон
              </div>
              <div className="font-medium">{organization.contact_person_phone || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <div className="font-medium">{organization.contact_person_email || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Контактное лицо
              </div>
              <div className="font-medium">{organization.contact_person_name || "—"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Атрибуты безопасности</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Обработка ПДн</span>
              <Badge variant={organization.has_pdn ? "default" : "secondary"}>
                {organization.has_pdn ? "Да" : "Нет"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Объект КИИ</span>
              <Badge variant={organization.has_kii ? "default" : "secondary"}>
                {organization.has_kii ? "Да" : "Нет"}
              </Badge>
            </div>
            {organization.attributes && (
              <>
                {organization.attributes.pdnLevel && (
                  <div>
                    <div className="text-sm text-muted-foreground">Уровень защиты ПДн</div>
                    <div className="font-medium">{organization.attributes.pdnLevel}</div>
                  </div>
                )}
                {organization.attributes.kiiCategory && (
                  <div>
                    <div className="text-sm text-muted-foreground">Категория КИИ</div>
                    <div className="font-medium">{organization.attributes.kiiCategory}</div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Дополнительно
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Количество сотрудников</div>
              <div className="font-medium">{organization.employee_count || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Отрасль</div>
              <div className="font-medium">{organization.industry || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Дата создания</div>
              <div className="font-medium">
                {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString("ru-RU") : "—"}
              </div>
            </div>
            {organization.description && (
              <div>
                <div className="text-sm text-muted-foreground">Описание</div>
                <div className="text-sm">{organization.description}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
