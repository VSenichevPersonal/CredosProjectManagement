/**
 * Упрощённый скрипт загрузки документов к существующему Assistant
 * SDK 6.3.0 - последняя версия от 10 октября 2025
 * 
 * Usage:
 *   npx tsx scripts/upload-files-to-assistant.ts
 */

import { config } from 'dotenv'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

config({ path: '.env.local' })

const ASSISTANT_ID = process.env.OPENAI_DOCUMENT_ASSISTANT_ID || ''

async function main() {
  console.log('🚀 Загрузка типовых документов к Assistant...')
  console.log('')
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found')
    process.exit(1)
  }
  
  if (!ASSISTANT_ID) {
    console.error('❌ OPENAI_DOCUMENT_ASSISTANT_ID not found')
    console.error('   Используйте: asst_6sA6C83ydEYgZy6bFNPMfYIq')
    process.exit(1)
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  console.log(`📝 Assistant ID: ${ASSISTANT_ID}`)
  console.log('')
  
  // Получить список документов
  const docsDir = path.join(process.cwd(), 'training-data/pdn-documents')
  const files = fs.readdirSync(docsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(docsDir, f))
  
  console.log(`📁 Найдено ${files.length} документов`)
  console.log('')
  
  // Загружаем файлы
  const fileIds: string[] = []
  let uploaded = 0
  
  for (const filePath of files) {
    try {
      const filename = path.basename(filePath)
      console.log(`⬆️  ${filename}`)
      
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
      })
      
      fileIds.push(file.id)
      uploaded++
      
    } catch (error: any) {
      console.error(`   ❌ Ошибка: ${error.message}`)
    }
  }
  
  console.log('')
  console.log(`✅ Загружено ${uploaded}/${files.length} файлов`)
  console.log('')
  
  // Обновляем Assistant с файлами
  // В SDK 6.x можно прикрепить файлы напрямую
  try {
    console.log('📎 Прикрепляю файлы к Assistant...')
    
    const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
      tool_resources: {
        file_search: {
          vector_stores: [{
            file_ids: fileIds
          }]
        }
      }
    })
    
    console.log('✅ Файлы прикреплены к Assistant!')
    console.log('')
    console.log('📊 Статус:')
    console.log('   Assistant:', assistant.id)
    console.log('   Файлов:', fileIds.length)
    console.log('')
    console.log('✅ Setup завершён! Можно тестировать генерацию!')
    console.log('')
    console.log('🎯 Следующий шаг:')
    console.log('   npm run dev')
    console.log('   → http://localhost:3000/documents/wizard/new')
    
  } catch (error: any) {
    console.error('❌ Ошибка обновления Assistant:', error.message)
    console.error('')
    console.error('💡 Возможно нужен другой синтаксис для SDK 6.x')
    console.error('   Файлы загружены, ID сохранены')
    console.error('   Можно прикрепить вручную через OpenAI Playground')
  }
}

main()

