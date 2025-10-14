import { Suspense } from "react"
import { DocumentsLibrary } from "@/components/documents/documents-library"
import { Skeleton } from "@/components/ui/skeleton"

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-semibold text-3xl">Документы</h1>
        <p className="text-muted-foreground">Управление документами с версионированием и AI-анализом</p>
      </div>

      <Suspense fallback={<DocumentsLibrarySkeleton />}>
        <DocumentsLibraryWrapper />
      </Suspense>
    </div>
  )
}

async function DocumentsLibraryWrapper() {
  try {
    // Server-side: используем абсолютный URL для Railway
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 
                    'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/documents`, {
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[Documents Page] Response not OK:", response.status)
      return <DocumentsLibrary initialDocuments={[]} />
    }

    const { data } = await response.json()

    return <DocumentsLibrary initialDocuments={data || []} />
  } catch (error) {
    console.error("[Documents Page] Error:", error)
    return <DocumentsLibrary initialDocuments={[]} />
  }
}

function DocumentsLibrarySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
    </div>
  )
}
