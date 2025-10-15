"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Услуги заказа</h1>
          <p className="text-gray-600 mt-1">Управление услугами в рамках заказов</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить услугу
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Раздел в разработке
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Функционал управления услугами заказов находится в разработке. 
            Здесь будет доступен функционал для детализации услуг в рамках контрактов.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

