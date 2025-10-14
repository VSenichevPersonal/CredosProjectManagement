/**
 * Загрузка .txt файлов в Vector Store
 * .md не поддерживается, используем .txt
 */

import { config } from 'dotenv'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

config({ path: '.env.local' })

async function main() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  console.log('🚀 Загрузка .txt файлов в Vector Store...')
  console.log('')
  
  // Создаём НОВЫЙ Vector Store для .txt
  const vectorStore = await openai.vectorStores.create({
    name: "ПДн Templates (TXT format)"
  })
  
  console.log(`✅ Vector Store создан: ${vectorStore.id}`)
  console.log('')
  
  // Загружаем .txt файлы
  const txtDir = 'training-data/pdn-documents/txt-versions'
  const files = fs.readdirSync(txtDir)
    .filter(f => f.endsWith('.txt'))
    .map(f => path.join(txtDir, f))
  
  console.log(`📁 Загружаю ${files.length} .txt файлов...`)
  console.log('')
  
  const fileIds: string[] = []
  
  for (const filePath of files) {
    const filename = path.basename(filePath)
    process.stdout.write(`⬆️  ${filename.substring(0, 60)}...`)
    
    try {
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
      })
      
      fileIds.push(file.id)
      console.log(' ✅')
    } catch (error: any) {
      console.log(` ❌ ${error.message}`)
    }
  }
  
  console.log('')
  console.log(`✅ Загружено ${fileIds.length}/${files.length} файлов`)
  console.log('')
  
  // Добавляем в Vector Store batch'ем
  console.log('📦 Добавляю в Vector Store (индексация)...')
  
  const batch = await openai.vectorStores.fileBatches.createAndPoll(vectorStore.id, {
    file_ids: fileIds
  })
  
  console.log(`✅ Статус: ${batch.status}`)
  console.log(`   Completed: ${batch.file_counts.completed}/${batch.file_counts.total}`)
  console.log(`   Failed: ${batch.file_counts.failed}`)
  console.log('')
  
  // Привязываем к Assistant
  const ASSISTANT_ID = process.env.OPENAI_DOCUMENT_ASSISTANT_ID
  
  console.log('🔗 Привязываю к Assistant...')
  
  await openai.beta.assistants.update(ASSISTANT_ID!, {
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id]
      }
    }
  })
  
  console.log('✅ Готово!')
  console.log('')
  console.log('📝 Обновите .env.local:')
  console.log(`OPENAI_DOCUMENT_VECTOR_STORE_ID=${vectorStore.id}`)
  console.log('')
  
  // Автообновление .env
  const envPath = '.env.local'
  let envContent = fs.readFileSync(envPath, 'utf-8')
  
  if (envContent.includes('OPENAI_DOCUMENT_VECTOR_STORE_ID')) {
    envContent = envContent.replace(
      /OPENAI_DOCUMENT_VECTOR_STORE_ID=.*/,
      `OPENAI_DOCUMENT_VECTOR_STORE_ID=${vectorStore.id}`
    )
  } else {
    envContent += `\nOPENAI_DOCUMENT_VECTOR_STORE_ID=${vectorStore.id}\n`
  }
  
  fs.writeFileSync(envPath, envContent)
  console.log('✅ .env.local обновлён автоматически')
  console.log('')
  console.log('📊 Финальный статус:')
  console.log(`   Assistant: ${ASSISTANT_ID}`)
  console.log(`   Vector Store: ${vectorStore.id}`)
  console.log(`   Файлов успешно: ${batch.file_counts.completed}`)
  console.log('')
  console.log('🎯 Можно тестировать:')
  console.log('   npm run dev (уже запущен)')
  console.log('   → http://localhost:3001/documents/wizard/new')
}

main()

