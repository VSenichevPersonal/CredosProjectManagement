import { Suspense } from "react"
import { RegulatoryDocumentTypesClient } from "@/components/admin/regulatory-document-types-client"

export default function RegulatoryDocumentTypesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Виды нормативной документации</h1>
        <p className="text-muted-foreground mt-2">
          Управление справочником видов нормативных документов (Законодательные, Внутренние, СМК)
        </p>
      </div>

      <Suspense fallback={<div>Загрузка...</div>}>
        <RegulatoryDocumentTypesClient />
      </Suspense>
    </div>
  )
}
