"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus } from "lucide-react"

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Заказы</h1>
          <p className="text-gray-600 mt-1">Управление заказами и контрактами</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить заказ
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Раздел в разработке
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Функционал управления заказами и контрактами находится в разработке. 
            Здесь будет доступен функционал для регистрации и отслеживания заказов клиентов.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

