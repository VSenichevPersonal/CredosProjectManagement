/**
 * Генерация уточняющих вопросов от OpenAI на основе ответов анкеты
 */

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers, previousClarifications = [], currentRound = 1, maxRounds = 3 } = body
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const ASSISTANT_ID = process.env.OPENAI_DOCUMENT_ASSISTANT_ID || ''
    
    // Создаём Thread
    const thread = await openai.beta.threads.create()
    
    // Формируем промпт для генерации вопросов
    const previousContext = previousClarifications.length > 0 
      ? `\n\nПРЕДЫДУЩИЕ КРУГИ ВОПРОСОВ И ОТВЕТОВ:\n${JSON.stringify(previousClarifications, null, 2)}\n\n`
      : ''
    
    const prompt = `
Ты эксперт по 152-ФЗ "О персональных данных".

ЗАДАЧА: Это КРУГ ${currentRound} из ${maxRounds} кругов уточняющих вопросов.
Сформируй 3-5 НОВЫХ уточняющих вопросов, которые помогут сгенерировать более точные документы.

ОТВЕТЫ НА АНКЕТУ:
${JSON.stringify(answers, null, 2)}
${previousContext}
ТРЕБОВАНИЯ К ВОПРОСАМ В ЭТОМ КРУГЕ:
1. Вопросы должны быть конкретными и важными для документов
2. НЕ дублировать информацию из анкеты и предыдущих кругов
3. ${currentRound === 1 ? 'Спрашивать основные детали' : currentRound === 2 ? 'Углубляться в технические детали' : 'Уточнять специфические моменты'}
4. Предлагать варианты ответов где возможно
5. Если в предыдущих кругах уже достаточно информации - верни ПУСТОЙ массив []

ПРИМЕРЫ ХОРОШИХ ВОПРОСОВ:
- "Какая версия 1С используется?" (если в анкете указана 1С)
- "Передаете ли вы ПДн в банки? Укажите названия банков"
- "Есть ли у вас трансграничная передача ПДн?"
- "Используются ли средства криптографической защиты? Какие?"

ФОРМАТ ОТВЕТА (строго JSON):
[
  {
    "question": "Текст вопроса?",
    "context": "Почему этот вопрос важен для документов",
    "suggestedAnswers": ["Вариант 1", "Вариант 2", "Вариант 3"]
  }
]

Верни ТОЛЬКО JSON массив, без дополнительного текста.
`.trim()
    
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    })
    
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: ASSISTANT_ID,
      response_format: { type: "json_object" }
    })
    
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id, {
        limit: 1,
        order: 'desc'
      })
      
      const lastMessage = messages.data[0]
      
      if (lastMessage.content[0].type === 'text') {
        const content = lastMessage.content[0].text.value
        
        try {
          // Парсим JSON ответ
          const questions = JSON.parse(content)
          
          // Добавляем ID к каждому вопросу
          const questionsWithIds = (Array.isArray(questions) ? questions : [questions]).map((q: any, i: number) => ({
            id: `clarify-${i + 1}`,
            question: q.question,
            context: q.context,
            suggestedAnswers: q.suggestedAnswers || []
          }))
          
          return NextResponse.json({
            success: true,
            questions: questionsWithIds
          })
          
        } catch (parseError) {
          console.error('[Clarifications] JSON parse error:', parseError)
          
          // Fallback - возвращаем текст как есть
          return NextResponse.json({
            success: true,
            questions: [
              {
                id: "clarify-1",
                question: "Пожалуйста, уточните детали вашей ИСПДн",
                context: "Это поможет создать более точные документы",
                suggestedAnswers: []
              }
            ]
          })
        }
      }
    }
    
    return NextResponse.json({
      success: false,
      error: `Run status: ${run.status}`
    }, { status: 500 })
    
  } catch (error: any) {
    console.error('[Generate Clarifications] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

