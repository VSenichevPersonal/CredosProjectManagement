/**
 * Реальная генерация всех 15 документов через OpenAI Assistants API
 */

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Список документов для генерации
const DOCUMENTS_152FZ = [
  { id: "doc-01", code: "policy-pdn", title: "Политика обработки персональных данных" },
  { id: "doc-02", code: "pologenie-pdn", title: "Положение об обработке персональных данных" },
  { id: "doc-03", code: "pologenie-komisii-uroven", title: "Положение о комиссии по определению уровня защищённости" },
  { id: "doc-04", code: "pologenie-komisii-unichtozhenie", title: "Положение о комиссии по уничтожению ПДн" },
  { id: "doc-05", code: "pologenie-vnutr-control", title: "Положение о внутреннем контроле обработки ПДн" },
  { id: "doc-06", code: "instruction-pdn", title: "Инструкция по обработке персональных данных" },
  { id: "doc-07", code: "instruction-otvet-obrabotka", title: "Инструкция ответственного за обработку ПДн" },
  { id: "doc-08", code: "instruction-admin-bezop", title: "Инструкция администратора безопасности ПДн" },
  { id: "doc-09", code: "reglament-zaprosy", title: "Регламент обработки запросов субъектов ПДн" },
  { id: "doc-10", code: "reglament-incidenty", title: "Регламент обработки инцидентов" },
  { id: "doc-11", code: "ord-ispdn", title: "ОРД по ИСПДн" },
  { id: "doc-12", code: "prikaz-otvetstvennyе", title: "Приказ о назначении ответственных лиц" },
  { id: "doc-13", code: "prikaz-spisok-dopusk", title: "Приказ об утверждении списка лиц с доступом к ПДн" },
  { id: "doc-14", code: "soglasie-template", title: "Согласие на обработку ПДн (шаблон для работников)" },
  { id: "doc-15", code: "uvedomlenie-pdn", title: "Уведомление об обработке персональных данных" },
]

function buildPrompt(template: any, answers: Record<string, any>): string {
  const subjects = (answers["pdn-subjects"] || []).join(", ")
  const software = (answers["ispdn-software"] || []).join(", ")
  
  return `
Создай документ "${template.title}" для организации.

ДАННЫЕ ОРГАНИЗАЦИИ:
- Название: ${answers["org-name"] || "[НЕ УКАЗАНО]"}
- ИНН: ${answers["org-inn"] || "[НЕ УКАЗАНО]"}
- Адрес: ${answers["org-address"] || "[НЕ УКАЗАНО]"}
- Тип: ${answers["org-type"] || "[НЕ УКАЗАНО]"}

ОТВЕТСТВЕННЫЕ ЛИЦА:
- За обработку ПДн: ${answers["responsible-processing-name"] || "[НЕ УКАЗАНО]"}, ${answers["responsible-processing-position"] || "[НЕ УКАЗАНО]"}
- За безопасность ПДн: ${answers["responsible-security-name"] || "[НЕ УКАЗАНО]"}, ${answers["responsible-security-position"] || "[НЕ УКАЗАНО]"}

ОБЪЕМ ОБРАБОТКИ:
- Количество субъектов: ${answers["pdn-volume"] === "less-100k" ? "менее 100 000" : "более 100 000"}
- Категории субъектов: ${subjects}

ИСПДн:
- ПО: ${software}
- Расположение: ${answers["ispdn-location"] || "[НЕ УКАЗАНО]"}

ТРЕБОВАНИЯ:
1. Используй типовые шаблоны из векторного хранилища
2. Адаптируй под данные организации
3. Заполни ВСЕ реквизиты (не используй placeholder'ы)
4. Строгое соответствие 152-ФЗ
5. Формат: Markdown

Создай документ "${template.code}".
`.trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers } = body
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const ASSISTANT_ID = process.env.OPENAI_DOCUMENT_ASSISTANT_ID || ''
    
    // Генерируем документы небольшими батчами для избежания таймаутов
    const generatedDocs = []
    const BATCH_SIZE = 3 // По 3 документа за раз
    
    for (let i = 0; i < DOCUMENTS_152FZ.length; i += BATCH_SIZE) {
      const batch = DOCUMENTS_152FZ.slice(i, i + BATCH_SIZE)
      
      console.log(`[Generate] Batch ${Math.floor(i / BATCH_SIZE) + 1}: генерация ${batch.length} документов`)
      
      // Генерируем батч параллельно
      const batchPromises = batch.map(async (template) => {
        try {
          // Создаём отдельный Thread для каждого документа (параллельно!)
          const thread = await openai.beta.threads.create()
          
          const prompt = buildPrompt(template, answers)
          
          // Отправляем сообщение
          await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: prompt
          })
          
          // Запускаем Assistant с таймаутом
          const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: ASSISTANT_ID,
            max_prompt_tokens: 8000,
            max_completion_tokens: 4000
          })
        
          if (run.status === 'completed') {
            // Получаем ответ
            const messages = await openai.beta.threads.messages.list(thread.id, {
              limit: 1,
              order: 'desc'
            })
            
            const lastMessage = messages.data[0]
            
            if (lastMessage.content[0].type === 'text') {
              const content = lastMessage.content[0].text.value
              
              // Рассчитываем confidence
              let confidence = 100
              if (content.includes("[НЕ УКАЗАНО]")) confidence -= 20
              if (content.length < 500) confidence -= 15
              
              console.log(`[Generate] ✅ ${template.title} (${confidence}%)`)
              
              return {
                id: template.id,
                templateCode: template.code,
                title: template.title,
                content: content,
                confidence: Math.max(70, confidence)
              }
            }
          }
          
          console.error(`[Generate] ❌ ${template.title} - status: ${run.status}`)
          
          return {
            id: template.id,
            templateCode: template.code,
            title: template.title,
            content: `# Документ в процессе генерации\n\nСтатус: ${run.status}. Попробуйте позже.`,
            confidence: 50
          }
          
        } catch (error: any) {
          console.error(`[Generate] ❌ ${template.title}:`, error.message)
          
          return {
            id: template.id,
            templateCode: template.code,
            title: template.title,
            content: `# Ошибка генерации\n\n${error.message}`,
            confidence: 0
          }
        }
      })
      
      // Ждём результаты батча
      const batchResults = await Promise.all(batchPromises)
      generatedDocs.push(...batchResults)
      
      console.log(`[Generate] Batch завершён: ${batchResults.filter(d => d.confidence > 0).length}/${batchResults.length} успешно`)
    }
    
    return NextResponse.json({
      success: true,
      documents: generatedDocs,
      total: generatedDocs.length,
      avgConfidence: Math.round(
        generatedDocs.reduce((sum, d) => sum + d.confidence, 0) / generatedDocs.length
      )
    })
    
  } catch (error: any) {
    console.error('[Generate Documents] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

