/**
 * Setup script for OpenAI Assistant
 * Run once to create assistant and vector store
 * 
 * Usage:
 *   npx tsx scripts/setup-openai-assistant.ts
 */

import { config } from 'dotenv'
import { setupOpenAIAssistant } from "../services/document-generation-service"

// Загружаем .env.local
config({ path: '.env.local' })

async function main() {
  console.log("🚀 Setting up OpenAI Assistant for document generation...")
  console.log("")

  try {
    const result = await setupOpenAIAssistant()

    console.log("")
    console.log("✅ Setup completed successfully!")
    console.log("")
    console.log("📝 Add these to your .env file:")
    console.log(`OPENAI_DOCUMENT_ASSISTANT_ID=${result.assistantId}`)
    console.log(`OPENAI_DOCUMENT_VECTOR_STORE_ID=${result.vectorStoreId}`)
    console.log("")
    console.log("⚠️  Next steps:")
    console.log("1. Add assistant ID to .env")
    console.log("2. Prepare template files in templates/152fz-pdn/")
    console.log("3. Run: npx tsx scripts/upload-templates.ts")
    console.log("")
  } catch (error) {
    console.error("❌ Setup failed:", error)
    process.exit(1)
  }
}

main()

