/**
 * @intent: Handle document file uploads to Supabase Storage
 * @architecture: Separate upload endpoint for multipart/form-data
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createExecutionContext } from "@/lib/context/create-context"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 })
    }

    // Validate file type (documents only)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed. Only PDF, DOC, DOCX, TXT are supported.` },
        { status: 400 },
      )
    }

    // Generate unique file name
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `documents/${ctx.user!.id}/${timestamp}-${sanitizedName}`

    console.log("[v0] Uploading file:", { fileName, size: file.size, type: file.type })

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("evidence-files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 })
    }

    // Generate signed URL (1 year expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("evidence-files")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365)

    if (signedUrlError || !signedUrlData) {
      console.error("[v0] Signed URL error:", signedUrlError)
      return NextResponse.json({ error: "Failed to generate file URL" }, { status: 500 })
    }

    console.log("[v0] File uploaded successfully:", { fileName, url: signedUrlData.signedUrl })

    return NextResponse.json({
      data: {
        fileName: file.name,
        fileUrl: signedUrlData.signedUrl,
        fileType: file.type,
        fileSize: file.size,
        storagePath: fileName,
      },
    })
  } catch (error) {
    console.error("[Documents Upload API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
