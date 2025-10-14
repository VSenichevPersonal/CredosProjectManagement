import { EvidenceDetailClient } from "@/components/evidence/evidence-detail-client"

export default function EvidenceDetailPage({ params }: { params: { id: string } }) {
  return <EvidenceDetailClient evidenceId={params.id} />
}
