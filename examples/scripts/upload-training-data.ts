/**
 * Скрипт для загрузки типовых документов в OpenAI Vector Store
 * 
 * Usage:
 *   npx tsx scripts/upload-training-data.ts
 */

import { config } from 'dotenv'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

// Загружаем .env.local
config({ path: '.env.local' })

const VECTOR_STORE_ID = process.env.OPENAI_DOCUMENT_VECTOR_STORE_ID || ''
const ASSISTANT_ID = process.env.OPENAI_DOCUMENT_ASSISTANT_ID || ''

async function main() {
  console.log('🚀 Uploading training data to OpenAI Vector Store...')
  console.log('')
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment')
    process.exit(1)
  }
  
  if (!VECTOR_STORE_ID) {
    console.error('❌ OPENAI_DOCUMENT_VECTOR_STORE_ID not found')
    console.error('   Run: npx tsx scripts/setup-openai-assistant.ts first')
    process.exit(1)
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  
  // 1. Получить список документов
  const docsDir = path.join(process.cwd(), 'training-data/pdn-documents')
  
  if (!fs.existsSync(docsDir)) {
    console.error('❌ Directory not found:', docsDir)
    process.exit(1)
  }
  
  const files = fs.readdirSync(docsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(docsDir, f))
  
  console.log(`📁 Found ${files.length} documents to upload`)
  console.log('')
  
  // 2. Загрузить файлы в OpenAI
  const fileIds: string[] = []
  let uploaded = 0
  
  for (const filePath of files) {
    try {
      const filename = path.basename(filePath)
      console.log(`⬆️  Uploading: ${filename}...`)
      
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
      })
      
      fileIds.push(file.id)
      uploaded++
      
      console.log(`   ✅ Uploaded: ${file.id}`)
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`)
    }
  }
  
  console.log('')
  console.log(`✅ Uploaded ${uploaded}/${files.length} files`)
  console.log('')
  
  // 3. Добавить файлы в Vector Store batch'ем
  if (fileIds.length > 0) {
    console.log(`📦 Adding files to Vector Store (batch)...`)
    
    try {
      const batch = await openai.beta.vectorStores.fileBatches.create(VECTOR_STORE_ID, {
        file_ids: fileIds
      })
      
      console.log(`✅ Batch created: ${batch.id}`)
      console.log(`   Status: ${batch.status}`)
      console.log(`   File counts: ${batch.file_counts.total} total`)
      
      // Ждём обработки
      console.log('')
      console.log('⏳ Waiting for files to be processed...')
      
      let attempts = 0
      const maxAttempts = 60
      
      while (attempts < maxAttempts) {
        const status = await openai.beta.vectorStores.fileBatches.retrieve(
          VECTOR_STORE_ID,
          batch.id
        )
        
        console.log(`   Status: ${status.status}, Completed: ${status.file_counts.completed}/${status.file_counts.total}`)
        
        if (status.status === 'completed') {
          console.log('')
          console.log('✅ All files processed successfully!')
          break
        }
        
        if (status.status === 'failed' || status.status === 'cancelled') {
          console.error('❌ Batch processing failed:', status.status)
          break
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++
      }
      
      if (attempts >= maxAttempts) {
        console.warn('⚠️  Timeout: files may still be processing')
      }
    } catch (error: any) {
      console.error('❌ Failed to create batch:', error.message)
    }
  }
  
  // 4. Проверить Vector Store
  console.log('')
  console.log('📊 Vector Store status:')
  
  const vectorStore = await openai.beta.vectorStores.retrieve(VECTOR_STORE_ID)
  console.log(`   Name: ${vectorStore.name}`)
  console.log(`   File counts: ${vectorStore.file_counts.completed} completed, ${vectorStore.file_counts.total} total`)
  console.log(`   Status: ${vectorStore.status}`)
  
  console.log('')
  console.log('✅ Upload complete!')
  console.log('')
  console.log('🎯 Next steps:')
  console.log('1. Test document generation: npm run dev')
  console.log('2. Navigate to /documents/wizard/new')
  console.log('3. Fill questionnaire and generate documents')
  console.log('')
}

main()

