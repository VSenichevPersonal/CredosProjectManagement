"use client"

/**
 * Tenant Info Tab
 *
 * Displays general information about the tenant
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TenantWithRelations } from "@/types/domain/tenant"
import { Building2, Calendar, Settings } from "lucide-react"

interface TenantInfoTabProps {
  tenant: TenantWithRelations
  onRefresh: () => void
}

export function TenantInfoTab({ tenant }: TenantInfoTabProps) {
  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Основная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Название</p>
              <p className="text-base">{tenant.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Slug</p>
              <p className="text-base font-mono">{tenant.slug}</p>
            </div>
          </div>

          {tenant.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Описание</p>
              <p className="text-base">{tenant.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Статус</p>
              <Badge variant={tenant.isActive ? "default" : "secondary"}>{tenant.status}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Создан</p>
              <p className="text-base">{new Date(tenant.createdAt).toLocaleDateString("ru-RU")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      {tenant.settings && Object.keys(tenant.settings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Настройки
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.settings.features && (
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Функции</p>
                <div className="flex flex-wrap gap-2">
                  {tenant.settings.features.aiAnalysis && <Badge variant="outline">AI Анализ</Badge>}
                  {tenant.settings.features.documentVersioning && <Badge variant="outline">Версионирование</Badge>}
                  {tenant.settings.features.riskManagement && <Badge variant="outline">Управление рисками</Badge>}
                  {tenant.settings.features.complianceReporting && <Badge variant="outline">Отчетность</Badge>}
                </div>
              </div>
            )}

            {tenant.settings.limits && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Лимиты</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {tenant.settings.limits.maxUsers && (
                    <div>
                      Макс. пользователей: <span className="font-medium">{tenant.settings.limits.maxUsers}</span>
                    </div>
                  )}
                  {tenant.settings.limits.maxOrganizations && (
                    <div>
                      Макс. организаций: <span className="font-medium">{tenant.settings.limits.maxOrganizations}</span>
                    </div>
                  )}
                  {tenant.settings.limits.storageQuotaMB && (
                    <div>
                      Квота хранилища: <span className="font-medium">{tenant.settings.limits.storageQuotaMB} MB</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Временная шкала
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Создан</span>
            <span>{new Date(tenant.createdAt).toLocaleString("ru-RU")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Обновлен</span>
            <span>{new Date(tenant.updatedAt).toLocaleString("ru-RU")}</span>
          </div>
          {tenant.stats?.lastActivityAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Последняя активность</span>
              <span>{new Date(tenant.stats.lastActivityAt).toLocaleString("ru-RU")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
