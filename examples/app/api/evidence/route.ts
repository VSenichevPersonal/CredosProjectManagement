import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { EvidenceService } from "@/services/evidence-service"
import { createExecutionContext } from "@/lib/context/create-context"
import { detectEvidenceType, validateFileType } from "@/lib/utils/evidence-type-helpers"
import { sanitizeFileName } from "@/lib/utils/transliterate"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    const searchParams = request.nextUrl.searchParams
    const complianceRecordId = searchParams.get("complianceRecordId")
    const requirementId = searchParams.get("requirementId")
    const controlId = searchParams.get("controlId")
    const status = searchParams.get("status")
    const evidenceType = searchParams.get("evidenceType")

    const filters: any = {}
    if (complianceRecordId) filters.complianceRecordId = complianceRecordId
    if (requirementId) filters.requirementId = requirementId
    if (controlId) filters.controlId = controlId
    if (status) filters.status = status
    if (evidenceType) filters.evidenceType = evidenceType

    const evidence = await EvidenceService.list(ctx, filters)

    return NextResponse.json({ data: evidence })
  } catch (error) {
    console.error("[Evidence API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    const formData = await request.formData()
    const file = formData.get("file") as File
    const complianceRecordId = formData.get("complianceRecordId") as string | null
    const requirementId = formData.get("requirementId") as string | null
    const controlId = formData.get("controlId") as string | null
    const title = formData.get("title") as string | null
    const description = formData.get("description") as string | null
    const tags = formData.get("tags") as string | null
    const evidenceTypeParam = formData.get("evidenceType") as string | null
    const evidenceTypeIdRaw = formData.get("evidence_type_id") as string | null || formData.get("evidenceTypeId") as string | null
    
    // Проверка на пустую строку (пустая строка = нет типа)
    const evidenceTypeId = evidenceTypeIdRaw && evidenceTypeIdRaw.trim().length > 0 ? evidenceTypeIdRaw : null

    console.error('[Evidence API] ========== FORMDATA RECEIVED ==========')
    console.error('[Evidence API] FormData received:', {
      file: file?.name,
      evidenceTypeIdRaw,
      evidenceTypeId,
      isEmpty: evidenceTypeIdRaw === '',
      isEmptyAfterTrim: !evidenceTypeId,
      evidence_type_id: formData.get("evidence_type_id"),
      evidenceTypeIdCamel: formData.get("evidenceTypeId"),
      complianceRecordId
    })

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const detectedType = detectEvidenceType(file.type)
    const evidenceType = evidenceTypeParam || detectedType

    if (!validateFileType(file.type, evidenceType as any)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed for evidence type ${evidenceType}` },
        { status: 400 },
      )
    }

    // Upload file to Supabase Storage
    // Транслитерация: кириллица → латиница
    const sanitizedName = sanitizeFileName(file.name)
    const fileName = `${Date.now()}-${sanitizedName}`
    
    console.log('[Evidence API] Original name:', file.name)
    console.log('[Evidence API] Transliterated name:', fileName)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("evidence-files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[Evidence API] Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("evidence-files")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year expiry

    if (signedUrlError || !signedUrlData) {
      console.error("[Evidence API] Signed URL error:", signedUrlError)
      return NextResponse.json({ error: "Failed to generate file URL" }, { status: 500 })
    }

    const evidenceData = {
      complianceRecordId: complianceRecordId || undefined,
      requirementId: requirementId || undefined,
      controlId: controlId || undefined,
      fileName: file.name,
      fileUrl: signedUrlData.signedUrl,
      fileSize: file.size,
      fileType: file.type,
      storagePath: fileName,
      evidenceType: evidenceType as any,
      evidenceTypeId: evidenceTypeId,  // ✅ Уже null если пусто
      title: title || undefined,
      description: description || undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
    }

    console.error('[Evidence API] ========== CREATING EVIDENCE ==========')
    console.error('[Evidence API] Creating evidence with data:', {
      evidenceTypeId: evidenceData.evidenceTypeId,
      hasEvidenceTypeId: !!evidenceData.evidenceTypeId,
      fullData: evidenceData
    })

    const evidence = await EvidenceService.create(ctx, evidenceData)
    
    console.error('[Evidence API] ========== EVIDENCE CREATED ==========')
    console.error('[Evidence API] Created evidence:', {
      id: evidence.id,
      evidenceTypeId: evidence.evidenceTypeId,
      saved: !!evidence.evidenceTypeId
    })

    return NextResponse.json({ data: evidence }, { status: 201 })
  } catch (error) {
    console.error("[Evidence API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
