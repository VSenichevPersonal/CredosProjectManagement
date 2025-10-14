/**
 * Тестовый endpoint для проверки генерации через OpenAI
 * Временный - для тестирования без полного Backend
 */

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers } = body
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    const ASSISTANT_ID = process.env.OPENAI_DOCUMENT_ASSISTANT_ID || ''
    
    // Создаём Thread
    const thread = await openai.beta.threads.create()
    
    // Простой тест - генерируем один документ
    const prompt = `
Создай краткую Политику обработки ПДн для организации.

ДАННЫЕ:
- Организация: ${answers['org-name'] || 'ООО Тестовая'}
- ИНН: ${answers['org-inn'] || '1234567890'}
- Адрес: ${answers['org-address'] || 'г. Москва'}
- Ответственный за обработку: ${answers['responsible-processing-name'] || 'Не указан'}

Используй шаблоны из векторного хранилища.
Документ должен быть кратким (1-2 страницы).
Формат: Markdown.
    `.trim()
    
    // Отправляем сообщение
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    })
    
    // Запускаем Assistant
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: ASSISTANT_ID
    })
    
    if (run.status === 'completed') {
      // Получаем ответ
      const messages = await openai.beta.threads.messages.list(thread.id)
      const lastMessage = messages.data[0]
      
      if (lastMessage.content[0].type === 'text') {
        const content = lastMessage.content[0].text.value
        
        return NextResponse.json({
          success: true,
          document: {
            title: "Политика обработки ПДн",
            content: content,
            confidence: 85
          }
        })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: `Run status: ${run.status}`
    }, { status: 500 })
    
  } catch (error: any) {
    console.error('[Test Generate] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

