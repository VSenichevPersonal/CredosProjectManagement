import { Suspense } from "react"
import { MyComplianceRecordsClient } from "@/components/my-compliance/my-compliance-records-client"

export const metadata = {
  title: "Мои записи соответствия",
  description: "Записи соответствия, назначенные на меня",
}

export default function MyComplianceRecordsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мои записи соответствия</h1>
          <p className="text-muted-foreground mt-2">Записи соответствия требованиям, назначенные на вас</p>
        </div>
      </div>

      <Suspense fallback={<div>Загрузка...</div>}>
        <MyComplianceRecordsClient />
      </Suspense>
    </div>
  )
}
