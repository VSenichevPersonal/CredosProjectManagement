import { Suspense } from "react"
import { DocumentDetailView } from "@/components/documents/document-detail-view"
import { Skeleton } from "@/components/ui/skeleton"
import { notFound } from "next/navigation"

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Suspense fallback={<DocumentDetailSkeleton />}>
        <DocumentDetailWrapper documentId={params.id} />
      </Suspense>
    </div>
  )
}

async function DocumentDetailWrapper({ documentId }: { documentId: string }) {
  try {
    const [docResponse, versionsResponse, analysesResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/documents/${documentId}`, {
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/documents/${documentId}/versions`, {
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/documents/${documentId}/analyses`, {
        cache: "no-store",
      }),
    ])

    if (!docResponse.ok) {
      notFound()
    }

    const { data: document } = await docResponse.json()
    const { data: versions } = await versionsResponse.json()
    const { data: analyses } = await analysesResponse.json()

    return <DocumentDetailView document={document} initialVersions={versions || []} initialAnalyses={analyses || []} />
  } catch (error) {
    console.error("[Document Detail] Error:", error)
    notFound()
  }
}

function DocumentDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  )
}
