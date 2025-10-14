/**
 * Создание Vector Store и загрузка типовых документов
 * SDK 6.3.0 - vectorStores в client.vectorStores (не в beta!)
 * 
 * Usage:
 *   npx tsx scripts/create-vector-store.ts
 */

import { config } from 'dotenv'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

config({ path: '.env.local' })

const ASSISTANT_ID = process.env.OPENAI_DOCUMENT_ASSISTANT_ID || ''

async function main() {
  console.log('🚀 Создание Vector Store и загрузка документов...')
  console.log('')
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found')
    process.exit(1)
  }
  
  if (!ASSISTANT_ID) {
    console.error('❌ OPENAI_DOCUMENT_ASSISTANT_ID not found')
    process.exit(1)
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  console.log(`📝 Assistant ID: ${ASSISTANT_ID}`)
  console.log('')
  
  // 1. Создать Vector Store (НЕ beta!)
  console.log('📦 Создаю Vector Store...')
  
  const vectorStore = await openai.vectorStores.create({
    name: "ПДн Document Templates"
  })
  
  console.log(`✅ Vector Store created: ${vectorStore.id}`)
  console.log('')
  
  // 2. Загрузить файлы
  const docsDir = path.join(process.cwd(), 'training-data/pdn-documents')
  const files = fs.readdirSync(docsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(docsDir, f))
  
  console.log(`📁 Найдено ${files.length} документов для загрузки`)
  console.log('')
  
  const fileIds: string[] = []
  
  for (const filePath of files) {
    const filename = path.basename(filePath)
    console.log(`⬆️  ${filename}`)
    
    try {
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
      })
      
      fileIds.push(file.id)
    } catch (error: any) {
      console.error(`   ❌ Ошибка: ${error.message}`)
    }
  }
  
  console.log('')
  console.log(`✅ Загружено ${fileIds.length}/${files.length} файлов`)
  console.log('')
  
  // 3. Добавить файлы в Vector Store batch'ем
  console.log('📎 Добавляю файлы в Vector Store...')
  
  const batch = await openai.vectorStores.fileBatches.createAndPoll(vectorStore.id, {
    file_ids: fileIds
  })
  
  console.log(`✅ Batch создан: ${batch.id}`)
  console.log(`   Статус: ${batch.status}`)
  console.log(`   Файлов: ${batch.file_counts.completed}/${batch.file_counts.total}`)
  console.log('')
  
  // 4. Прикрепить Vector Store к Assistant
  console.log('🔗 Привязываю Vector Store к Assistant...')
  
  const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id]
      }
    }
  })
  
  console.log('✅ Vector Store привязан к Assistant!')
  console.log('')
  
  // 5. Сохранить ID в .env
  console.log('📝 Добавьте в .env.local:')
  console.log(`OPENAI_DOCUMENT_VECTOR_STORE_ID=${vectorStore.id}`)
  console.log('')
  
  // Обновляем .env.local автоматически
  const envPath = path.join(process.cwd(), '.env.local')
  let envContent = fs.readFileSync(envPath, 'utf-8')
  
  if (!envContent.includes('OPENAI_DOCUMENT_VECTOR_STORE_ID')) {
    envContent += `\nOPENAI_DOCUMENT_VECTOR_STORE_ID=${vectorStore.id}\n`
    fs.writeFileSync(envPath, envContent)
    console.log('✅ Автоматически добавлено в .env.local')
  }
  
  console.log('')
  console.log('✅ Setup завершён полностью!')
  console.log('')
  console.log('📊 Итого:')
  console.log(`   Assistant: ${ASSISTANT_ID}`)
  console.log(`   Vector Store: ${vectorStore.id}`)
  console.log(`   Файлов: ${batch.file_counts.completed}`)
  console.log('')
  console.log('🎯 Следующий шаг:')
  console.log('   npm run dev')
  console.log('   → http://localhost:3000/documents/wizard/new')
  console.log('')
}

main()

