"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, Plus } from "lucide-react"

export default function AllocationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Правила распределения</h1>
          <p className="text-gray-600 mt-1">Настройка правил распределения затрат</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить правило
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Раздел в разработке
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Функционал настройки правил распределения находится в разработке. 
            Здесь будет доступен функционал для автоматического распределения затрат между проектами и направлениями.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

