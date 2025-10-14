/**
 * Скрипт для замены реальных данных на placeholder'ы в типовых документах
 * 
 * Usage:
 *   npx tsx scripts/anonymize-training-data.ts
 */

import fs from 'fs'
import path from 'path'

// Карта замен: реальные данные → placeholder'ы
const replacements = [
  // Организации
  { pattern: /ООО «КРЕДОС»/g, replacement: '{{org-name}}' },
  { pattern: /ООО «КРЕДО-С»/g, replacement: '{{org-name}}' },
  { pattern: /ООО "КРЕДОС"/g, replacement: '{{org-name}}' },
  { pattern: /ООО "КРЕДО-С"/g, replacement: '{{org-name}}' },
  { pattern: /Общество с ограниченной ответственностью «КРЕДОС»/g, replacement: '{{org-full-name}}' },
  
  // ФИО
  { pattern: /Сеничев Н\.Г\./g, replacement: '{{director-name}}' },
  { pattern: /Н\.Г\. Сеничев/g, replacement: '{{director-name}}' },
  { pattern: /Сеничев Николай Георгиевич/g, replacement: '{{director-full-name}}' },
  { pattern: /Николай Георгиевич Сеничев/g, replacement: '{{director-full-name}}' },
  
  // Города
  { pattern: /г\. Тула/g, replacement: '{{org-city}}' },
  { pattern: /город Тула/g, replacement: '{{org-city}}' },
  
  // Адреса
  { pattern: /г\. Тула, ул\. [А-Яа-я\s]+, д\. \d+[А-Яа-я]?, [^,\n]+/g, replacement: '{{org-address}}' },
  { pattern: /300012,\s*г\.\s*Тула[^,\n]*/g, replacement: '{{org-postal-address}}' },
  
  // Сайты
  { pattern: /https?:\/\/www\.credos\.ru\/?/g, replacement: '{{org-website}}' },
  { pattern: /https?:\/\/cert\.credos\.ru\/?/g, replacement: '{{org-cert-website}}' },
  { pattern: /https?:\/\/cyberosnova\.ru\/?/g, replacement: '{{org-cyber-website}}' },
  
  // ИНН, ОГРН, КПП
  { pattern: /ИНН\s+\d{10,12}/g, replacement: 'ИНН {{org-inn}}' },
  { pattern: /ОГРН\s+\d{13,15}/g, replacement: 'ОГРН {{org-ogrn}}' },
  { pattern: /КПП\s+\d{9}/g, replacement: 'КПП {{org-kpp}}' },
  
  // Телефоны
  { pattern: /\+7\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}/g, replacement: '{{org-phone}}' },
  { pattern: /8\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}/g, replacement: '{{org-phone}}' },
  
  // Email
  { pattern: /[a-zA-Z0-9._%+-]+@credos\.ru/g, replacement: '{{org-email}}' },
  { pattern: /[a-zA-Z0-9._%+-]+@cyberosnova\.ru/g, replacement: '{{org-email}}' },
  
  // Другие возможные организации (если есть)
  { pattern: /АО «[^»]+»/g, replacement: '{{contractor-name}}' },
  { pattern: /ПАО «[^»]+»/g, replacement: '{{contractor-name}}' },
  
  // Даты в реквизитах (оставляем placeholder)
  { pattern: /«__» __________20__г\./g, replacement: '«__» __________ {{current-year}} г.' },
]

async function anonymizeFile(filePath: string): Promise<void> {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let modified = false
    
    // Применяем все замены
    for (const { pattern, replacement } of replacements) {
      const before = content
      content = content.replace(pattern, replacement)
      if (before !== content) {
        modified = true
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`✅ Anonymized: ${path.basename(filePath)}`)
      return
    }
    
    console.log(`⏭️  Skipped (no changes): ${path.basename(filePath)}`)
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error)
  }
}

async function main() {
  console.log('🚀 Anonymizing training data...')
  console.log('')
  
  const docsDir = path.join(process.cwd(), 'training-data/pdn-documents')
  
  if (!fs.existsSync(docsDir)) {
    console.error('❌ Directory not found:', docsDir)
    process.exit(1)
  }
  
  const files = fs.readdirSync(docsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(docsDir, f))
  
  console.log(`📁 Found ${files.length} documents`)
  console.log('')
  
  for (const file of files) {
    await anonymizeFile(file)
  }
  
  console.log('')
  console.log(`✅ Anonymization complete! Processed ${files.length} files`)
  console.log('')
  console.log('📝 Placeholders используемые:')
  console.log('   {{org-name}} - название организации')
  console.log('   {{director-name}} - ФИО директора')
  console.log('   {{org-city}} - город')
  console.log('   {{org-address}} - адрес')
  console.log('   {{org-inn}} - ИНН')
  console.log('   {{org-website}} - сайт')
  console.log('   ... и другие')
}

main()

