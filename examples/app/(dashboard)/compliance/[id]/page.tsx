import { createExecutionContext } from "@/lib/context/create-context"
import { ComplianceService } from "@/services/compliance-service"
import { ComplianceDetailClient } from "@/components/compliance/compliance-detail-client"
import { notFound } from "next/navigation"

export default async function ComplianceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const ctx = await createExecutionContext()

  if (!ctx.user) {
    return notFound()
  }

  try {
    const compliance = await ComplianceService.getById(ctx, params.id)

    return <ComplianceDetailClient compliance={compliance} />
  } catch (error) {
    console.error("[v0] Failed to load compliance detail", { id: params.id, error })
    return notFound()
  }
}
