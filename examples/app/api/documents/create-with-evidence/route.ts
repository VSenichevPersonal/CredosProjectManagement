/**
 * @intent: Create document and evidence in one request
 * @llm-note: POST /api/documents/create-with-evidence
 */

import { NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import type { CreateEvidenceWithDocumentDTO } from "@/types/dto/document-dto"

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const body: CreateEvidenceWithDocumentDTO = await request.json()
    
    let documentId = body.documentId
    
    // Если нужно создать новый документ
    if (body.createDocument) {
      const document = await ctx.db.documents.create({
        ...body.createDocument,
        tenantId: ctx.tenantId,
        createdBy: ctx.user!.id
      })
      
      // Создать первую версию
      await ctx.db.documentVersions.create({
        documentId: document.id,
        tenantId: ctx.tenantId,
        versionNumber: 'v1.0',
        majorVersion: 1,
        minorVersion: 0,
        fileName: body.createDocument.fileName,
        fileUrl: body.createDocument.fileUrl,
        fileType: body.createDocument.fileType,
        fileSize: body.createDocument.fileSize,
        storagePath: body.createDocument.storagePath,
        changeSummary: 'Initial version',
        createdBy: ctx.user!.id,
        isCurrent: true
      })
      
      documentId = document.id
    }
    
    // Создать evidence
    const evidence = await ctx.db.evidence.create({
      tenantId: ctx.tenantId,
      documentId,  // ⭐ Ссылка на документ
      fileName: body.file?.fileName,
      fileUrl: body.file?.fileUrl,
      evidenceTypeId: body.evidenceTypeId,
      title: body.title,
      description: body.description,
      tags: body.tags,
      complianceRecordId: body.complianceRecordId,
      requirementId: body.requirementId,
      uploadedBy: ctx.user!.id
    })
    
    // Связать с мерами если указаны
    if (body.controlMeasureIds && body.controlMeasureIds.length > 0) {
      for (const measureId of body.controlMeasureIds) {
        await ctx.db.evidenceLinks.create({
          evidenceId: evidence.id,
          controlMeasureId: measureId,
          createdBy: ctx.user!.id
        })
      }
    }
    
    // Получить созданные данные с relations
    const result = await ctx.db.evidence.findById(evidence.id)
    
    return NextResponse.json({ 
      data: result,
      message: "Document and evidence created successfully"
    }, { status: 201 })
    
  } catch (error) {
    return handleApiError(error)
  }
}

