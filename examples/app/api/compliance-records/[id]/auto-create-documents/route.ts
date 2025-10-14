/**
 * @intent: Auto-create recommended documents for compliance record
 * @llm-note: POST /api/compliance-records/[id]/auto-create-documents
 */

import { NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { DocumentRecommendationService } from "@/services/document-recommendation-service"
import { handleApiError } from "@/lib/utils/errors"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: complianceRecordId } = params
    const ctx = await createExecutionContext(request)
    
    const result = await DocumentRecommendationService.autoCreateDocuments(
      ctx,
      complianceRecordId
    )
    
    return NextResponse.json({
      data: result,
      message: `Created ${result.documents.length} documents, ${result.evidence.length} evidence, ${result.measures.length} links`
    }, { status: 201 })
    
  } catch (error) {
    return handleApiError(error)
  }
}

