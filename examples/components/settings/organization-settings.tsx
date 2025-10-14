"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Shield } from "lucide-react"

export function OrganizationSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Информация об организации</CardTitle>
          </div>
          <CardDescription>Данные вашей организации в системе</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Название</p>
              <p className="text-base font-medium mt-1">Правительство Московской области</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ИНН</p>
              <p className="text-base font-medium mt-1">5024123456</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Тип</p>
              <p className="text-base font-medium mt-1">Головная организация</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Отрасль</p>
              <p className="text-base font-medium mt-1">Государственное управление</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Ваша роль</CardTitle>
          </div>
          <CardDescription>Права доступа и полномочия в системе</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Роль</p>
              <p className="text-base font-medium mt-1">Super Admin</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Права доступа</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Полный доступ к системе</li>
                <li>Управление пользователями</li>
                <li>Управление организациями</li>
                <li>Управление требованиями</li>
                <li>Просмотр всех отчетов</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Безопасность организации</CardTitle>
          </div>
          <CardDescription>Настройки безопасности для всей организации</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Обязательная 2FA</p>
                <p className="text-sm text-muted-foreground">
                  Требовать двухфакторную аутентификацию для всех пользователей
                </p>
              </div>
              <p className="text-sm text-muted-foreground">Не активирована</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Политика паролей</p>
                <p className="text-sm text-muted-foreground">
                  Минимальная длина: 8 символов, обязательны буквы и цифры
                </p>
              </div>
              <p className="text-sm text-muted-foreground">Активна</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Срок действия сессии</p>
                <p className="text-sm text-muted-foreground">Автоматический выход после неактивности</p>
              </div>
              <p className="text-sm text-muted-foreground">24 часа</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
