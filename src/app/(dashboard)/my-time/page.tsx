"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, List } from "lucide-react"
import WeeklyTimesheet from "@/components/time-tracking/WeeklyTimesheet"

// TODO: Get actual employee ID from auth session
const MOCK_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000001"

export default function MyTimePage() {
  const [activeTab, setActiveTab] = useState("weekly")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['PT_Sans']">Учёт времени</h1>
          <p className="text-gray-600 mt-1">
            Управление рабочим временем и табелями
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weekly" className="gap-2">
            <Calendar className="h-4 w-4" />
            Недельный табель
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Список записей
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyTimesheet employeeId={MOCK_EMPLOYEE_ID} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="text-center py-12 text-gray-500">
            Список записей времени (в разработке)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

