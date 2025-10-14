/**
 * @intent: Document generation service using OpenAI Assistants API
 * @llm-note: Orchestrates document generation using OpenAI GPT-4o with vector store
 * @architecture: Service layer - handles LLM integration for document generation
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type {
  DocumentGenerationSession,
  GeneratedDocument,
} from "@/types/domain/document-package"
import OpenAI from "openai"

// OpenAI Assistant ID (создается один раз при setup)
// TODO: Вынести в env переменные
const ASSISTANT_ID = process.env.OPENAI_DOCUMENT_ASSISTANT_ID || ""

// Список документов для генерации (полный пакет 152-ФЗ)
const DOCUMENT_TEMPLATES_152FZ = [
  // Категория А: Политики и положения
  { id: "doc-01", code: "policy-pdn", title: "Политика обработки персональных данных" },
  { id: "doc-02", code: "pologenie-pdn", title: "Положение об обработке персональных данных" },
  { id: "doc-03", code: "pologenie-komisii-uroven", title: "Положение о комиссии по определению уровня защищённости" },
  { id: "doc-04", code: "pologenie-komisii-unichtozhenie", title: "Положение о комиссии по уничтожению ПДн" },
  { id: "doc-05", code: "pologenie-vnutr-control", title: "Положение о внутреннем контроле обработки ПДн" },
  // Категория Б: Инструкции
  { id: "doc-06", code: "instruction-pdn", title: "Инструкция по обработке персональных данных" },
  { id: "doc-07", code: "instruction-otvet-obrabotka", title: "Инструкция ответственного за обработку ПДн" },
  { id: "doc-08", code: "instruction-admin-bezop", title: "Инструкция администратора безопасности ПДн" },
  { id: "doc-09", code: "reglament-zaprosy", title: "Регламент обработки запросов субъектов ПДн" },
  { id: "doc-10", code: "reglament-incidenty", title: "Регламент обработки инцидентов" },
  // Категория В: ОРД и приказы
  { id: "doc-11", code: "ord-ispdn", title: "ОРД по ИСПДн" },
  { id: "doc-12", code: "prikaz-otvetstvennyе", title: "Приказ о назначении ответственных лиц" },
  { id: "doc-13", code: "prikaz-spisok-dopusk", title: "Приказ об утверждении списка лиц с доступом к ПДн" },
  { id: "doc-14", code: "soglasie-template", title: "Согласие на обработку ПДн (шаблон для работников)" },
  { id: "doc-15", code: "uvedomlenie-pdn", title: "Уведомление об обработке персональных данных" },
]

export class DocumentGenerationService {
  /**
   * @intent: Generate all documents for a wizard session
   * @precondition: session has answers
   * @postcondition: returns array of generated documents
   */
  static async generateForSession(
    ctx: ExecutionContext,
    sessionId: string,
  ): Promise<GeneratedDocument[]> {
    ctx.logger.info("[v0] DocumentGenerationService.generateForSession", { sessionId })

    // Get session
    const { data: session, error: sessionError } = await ctx.db.supabase
      .from("document_generation_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error("Session not found")
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Create or get existing thread
    let threadId = session.openai_thread_id

    if (!threadId) {
      const thread = await openai.beta.threads.create({
        metadata: {
          sessionId,
          tenantId: ctx.tenantId,
          userId: ctx.user!.id,
        },
      })
      threadId = thread.id

      // Save thread ID
      await ctx.db.supabase
        .from("document_generation_sessions")
        .update({ openai_thread_id: threadId })
        .eq("id", sessionId)
    }

    // Get organization data
    const { data: org } = await ctx.db.supabase
      .from("organizations")
      .select("*")
      .eq("id", session.organization_id)
      .single()

    // Generate all documents
    const generatedDocs: GeneratedDocument[] = []

    for (const template of DOCUMENT_TEMPLATES_152FZ) {
      ctx.logger.info("[v0] Generating document", { templateCode: template.code })

      try {
        const doc = await this.generateDocument(
          openai,
          threadId,
          template,
          session.answers,
          org,
        )
        generatedDocs.push(doc)
      } catch (error: any) {
        ctx.logger.error("[v0] Failed to generate document", {
          templateCode: template.code,
          error: error.message,
        })
        // Добавляем документ с ошибкой
        generatedDocs.push({
          id: template.id,
          templateId: template.id,
          templateCode: template.code,
          title: template.title,
          content: `# Ошибка генерации\n\nНе удалось сгенерировать документ: ${error.message}`,
          format: "markdown",
          confidence: 0,
          warnings: [error.message],
        })
      }
    }

    ctx.logger.info("[v0] All documents generated", {
      sessionId,
      totalDocs: generatedDocs.length,
      successful: generatedDocs.filter((d) => d.confidence > 0).length,
    })
    return generatedDocs
  }

  /**
   * @intent: Generate single document using OpenAI Assistant
   * @precondition: threadId exists, answers provided
   * @postcondition: returns generated document with confidence score
   */
  private static async generateDocument(
    openai: OpenAI,
    threadId: string,
    template: { id: string; code: string; title: string },
    answers: Record<string, any>,
    organization: any,
  ): Promise<GeneratedDocument> {
    const startTime = Date.now()

    // Build prompt
    const prompt = this.buildPrompt(template, answers, organization)

    // Create message in thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: prompt,
    })

    // Run assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
      instructions: `Создай документ "${template.title}" для организации. Используй шаблон "${template.code}" из векторного хранилища.`,
    })

    // Wait for completion
    const result = await this.waitForRunCompletion(openai, threadId, run.id)

    const generationTime = Date.now() - startTime

    // Extract content from messages
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: "desc",
      limit: 1,
    })

    const content = messages.data[0]?.content[0]
    const documentContent =
      content && content.type === "text" ? content.text.value : "Ошибка: контент не получен"

    // Calculate confidence (based on completeness and quality indicators)
    const confidence = this.calculateConfidence(documentContent, template)

    return {
      id: template.id,
      templateId: template.id,
      templateCode: template.code,
      title: template.title,
      content: documentContent,
      format: "markdown",
      confidence,
      warnings: this.detectWarnings(documentContent),
      tokensUsed: result.usage?.total_tokens,
      generationTimeMs: generationTime,
    }
  }

  /**
   * @intent: Build prompt for document generation
   */
  private static buildPrompt(
    template: { code: string; title: string },
    answers: Record<string, any>,
    organization: any,
  ): string {
    // Маппинг значений для красивого отображения
    const subjectsMap: Record<string, string> = {
      employees: "Сотрудники",
      relatives: "Родственники сотрудников",
      "former-employees": "Бывшие сотрудники",
      clients: "Клиенты",
      contractors: "Контрагенты",
      candidates: "Кандидаты на работу",
    }

    const softwareMap: Record<string, string> = {
      "1c-salary": "1С: Зарплата и управление персоналом",
      "1c-accounting": "1С: Бухгалтерия",
      "ms-office": "Microsoft Office",
      email: "Электронная почта",
      ked: "Система электронного документооборота",
      other: "Другое",
    }

    const subjects = (answers["pdn-subjects"] || []).map((s: string) => subjectsMap[s] || s).join(", ")
    const software = (answers["ispdn-software"] || []).map((s: string) => softwareMap[s] || s).join(", ")

    return `
Создай документ "${template.title}" для организации.

ДАННЫЕ ОРГАНИЗАЦИИ:
- Название: ${answers["org-name"] || organization?.name || "[НЕ УКАЗАНО]"}
- ИНН: ${answers["org-inn"] || organization?.inn || "[НЕ УКАЗАНО]"}
- Адрес: ${answers["org-address"] || organization?.address || "[НЕ УКАЗАНО]"}
- Тип: ${answers["org-type"] || "[НЕ УКАЗАНО]"}
- Количество сотрудников: ${answers["employee-count"] || "[НЕ УКАЗАНО]"}

ОТВЕТСТВЕННЫЕ ЛИЦА:
- Ответственный за обработку ПДн: ${answers["responsible-processing-name"] || "[НЕ УКАЗАНО]"}, ${answers["responsible-processing-position"] || "[НЕ УКАЗАНО]"}
- Ответственный за безопасность ПДн: ${answers["responsible-security-name"] || "[НЕ УКАЗАНО]"}, ${answers["responsible-security-position"] || "[НЕ УКАЗАНО]"}

ОБЪЕМ ОБРАБОТКИ:
- Количество субъектов: ${answers["pdn-volume"] === "less-100k" ? "менее 100 000" : answers["pdn-volume"] === "more-100k" ? "более 100 000" : "[НЕ УКАЗАНО]"}
- Категории субъектов: ${subjects}

ИНФОРМАЦИОННЫЕ СИСТЕМЫ ПДн:
- Используемое ПО: ${software}
- Адрес расположения ИСПДн: ${answers["ispdn-location"] || "[НЕ УКАЗАНО]"}

---

ТРЕБОВАНИЯ К ДОКУМЕНТУ:
1. Используй шаблон "${template.code}" из твоего векторного хранилища как основу
2. Адаптируй шаблон под конкретные данные этой организации
3. Заполни ВСЕ реквизиты конкретными данными (не используй placeholder'ы типа "[НАЗВАНИЕ]")
4. Документ должен строго соответствовать требованиям 152-ФЗ "О персональных данных"
5. Используй точные юридические формулировки из законодательства РФ
6. Включи все обязательные разделы для этого типа документа
7. Формат вывода: Markdown с заголовками уровней ##, ###

ВАЖНО:
- НЕ выдумывай данные которых нет в анкете
- НЕ используй placeholder'ы - подставляй реальные данные
- Если данных недостаточно для раздела - укажи это явно
- Документ должен быть готов к использованию без дополнительного редактирования

Создай документ прямо сейчас.
`.trim()
  }

  /**
   * @intent: Wait for OpenAI run to complete
   */
  private static async waitForRunCompletion(
    openai: OpenAI,
    threadId: string,
    runId: string,
    maxAttempts = 60,
  ): Promise<OpenAI.Beta.Threads.Runs.Run> {
    let attempts = 0

    while (attempts < maxAttempts) {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId)

      if (run.status === "completed") {
        return run
      }

      if (run.status === "failed" || run.status === "cancelled" || run.status === "expired") {
        throw new Error(`Run ${run.status}: ${run.last_error?.message || "Unknown error"}`)
      }

      // Wait 1 second before next check
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++
    }

    throw new Error("Run timeout: exceeded max attempts")
  }

  /**
   * @intent: Calculate confidence score for generated document
   * @postcondition: returns score 0-100
   */
  private static calculateConfidence(content: string, template: { title: string }): number {
    let score = 100

    // Check for placeholders
    if (content.includes("[НЕ УКАЗАНО]")) {
      score -= 20
    }
    if (content.includes("[НАЗВАНИЕ]") || content.includes("[ИМЯ]")) {
      score -= 30
    }

    // Check for minimum length
    if (content.length < 500) {
      score -= 20
    }

    // Check for required sections (headers)
    const hasHeaders = content.match(/^##/gm)
    if (!hasHeaders || hasHeaders.length < 3) {
      score -= 15
    }

    // Check for specific keywords based on template
    if (template.title.includes("Политика") && !content.includes("152-ФЗ")) {
      score -= 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * @intent: Detect warnings in generated document
   */
  private static detectWarnings(content: string): string[] {
    const warnings: string[] = []

    if (content.includes("[НЕ УКАЗАНО]")) {
      warnings.push("Документ содержит пропущенные данные - требуется ручное заполнение")
    }

    if (content.length < 1000) {
      warnings.push("Документ слишком короткий - возможно генерация не завершена")
    }

    if (!content.includes("персональных данных")) {
      warnings.push("Документ может не соответствовать тематике ПДн")
    }

    return warnings
  }
}

/**
 * @intent: Setup OpenAI Assistant (run once)
 * @llm-note: Creates assistant with vector store for templates
 */
export async function setupOpenAIAssistant() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Create assistant
  const assistant = await openai.beta.assistants.create({
    name: "IB Compliance Document Generator",
    description: "Генератор документов по информационной безопасности для российских организаций",
    instructions: `
Ты эксперт по российскому законодательству в области информационной безопасности и защиты персональных данных.

СПЕЦИАЛИЗАЦИЯ:
- 152-ФЗ "О персональных данных"
- Приказ Роскомнадзора №996
- ГОСТ Р ИСО/МЭК 27001

ТВОЯ ЗАДАЧА:
Генерировать документы для российских организаций на основе:
1. Шаблонов из векторного хранилища (file_search)
2. Данных организации из анкеты
3. Требований российского законодательства

ТРЕБОВАНИЯ К ДОКУМЕНТАМ:
- Строгое соответствие 152-ФЗ и подзаконным актам
- Адаптация под конкретную организацию
- Использование точных юридических формулировок
- Заполнение всех реквизитов реальными данными
- Включение всех обязательных разделов
- Формат: Markdown с четкой структурой (заголовки ##, ###)

ЗАПРЕЩЕНО:
- Использовать placeholder'ы типа [НАЗВАНИЕ ОРГАНИЗАЦИИ], [ИНН], [ДАТА]
- Выдумывать данные которых нет в анкете
- Копировать шаблон без адаптации под организацию
- Использовать общие фразы вместо конкретных данных

СТРУКТУРА ДОКУМЕНТА:
- Начинай с заголовка первого уровня (название документа)
- Используй заголовки уровней ##, ### для разделов
- Нумеруй разделы (1., 1.1., 1.1.1.)
- В конце добавляй место для подписей и печатей

Генерируй качественные, готовые к использованию документы!
    `.trim(),
    model: "gpt-4o",
    tools: [{ type: "file_search" }],
    temperature: 0.3,
    top_p: 1.0,
  })

  console.log("✅ Assistant created:", assistant.id)
  console.log("📝 Add to .env: OPENAI_DOCUMENT_ASSISTANT_ID=" + assistant.id)

  // Create vector store
  const vectorStore = await openai.beta.vectorStores.create({
    name: "ПДн Document Templates",
  })

  console.log("✅ Vector Store created:", vectorStore.id)

  // TODO: Upload template files
  console.log("⚠️ Next step: Upload template files to vector store")
  console.log("   Run: node scripts/upload-templates.ts")

  return {
    assistantId: assistant.id,
    vectorStoreId: vectorStore.id,
  }
}

