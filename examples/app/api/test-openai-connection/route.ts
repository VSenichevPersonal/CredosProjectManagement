/**
 * API для проверки подключения к OpenAI
 * Проверяет API ключ, Assistant и Vector Store
 */

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    const assistantId = process.env.OPENAI_DOCUMENT_ASSISTANT_ID
    const vectorStoreId = process.env.OPENAI_DOCUMENT_VECTOR_STORE_ID
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "OPENAI_API_KEY не настроен в переменных окружения"
      }, { status: 400 })
    }
    
    const openai = new OpenAI({ apiKey })
    
    // Проверяем подключение через простой запрос
    try {
      const models = await openai.models.list()
      
      // Проверяем Assistant
      let assistantStatus = "не настроен"
      if (assistantId) {
        try {
          const assistant = await openai.beta.assistants.retrieve(assistantId)
          assistantStatus = assistant.name || "найден"
        } catch (e) {
          assistantStatus = "не найден"
        }
      }
      
      // Проверяем Vector Store
      let vectorStoreStatus = "не настроен"
      let filesCount = 0
      if (vectorStoreId) {
        try {
          const vectorStore = await openai.vectorStores.retrieve(vectorStoreId)
          vectorStoreStatus = vectorStore.name || "найден"
          filesCount = vectorStore.file_counts?.completed || 0
        } catch (e) {
          vectorStoreStatus = "не найден"
        }
      }
      
      return NextResponse.json({
        success: true,
        apiKeyStatus: "✅ Валиден",
        assistantId: assistantId || "не настроен",
        assistantStatus,
        vectorStoreId: vectorStoreId || "не настроен",
        vectorStoreStatus,
        filesCount,
        modelsAvailable: models.data.length
      })
      
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: `Ошибка API: ${error.message}`
      }, { status: 500 })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

