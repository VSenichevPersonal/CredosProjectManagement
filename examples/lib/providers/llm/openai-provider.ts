import type { LLMProvider } from "./llm-provider.interface"
import type { CriticalChange, Recommendation } from "@/types/domain/document"

export class OpenAIProvider implements LLMProvider {
  name = "openai"
  model: string

  constructor(model = "gpt-4o") {
    this.model = model
  }

  async analyzeDocumentChanges(params: {
    documentTitle: string
    previousContent?: string
    currentContent: string
    context?: string
  }): Promise<{
    summary: string
    criticalChanges: CriticalChange[]
    impactAssessment: string
    recommendations: Recommendation[]
    tokensUsed?: number
    processingTimeMs?: number
  }> {
    const startTime = Date.now()

    try {
      // Use AI SDK for OpenAI
      const { generateText } = await import("ai")

      const prompt = this.buildPrompt(params)

      const { text, usage } = await generateText({
        model: `openai/${this.model}`,
        prompt,
        temperature: 0.3, // Lower temperature for more consistent analysis
      })

      const processingTimeMs = Date.now() - startTime

      // Parse the response
      const analysis = this.parseResponse(text)

      return {
        ...analysis,
        tokensUsed: usage?.totalTokens,
        processingTimeMs,
      }
    } catch (error) {
      console.error("[OpenAI Provider] Error:", error)
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    // Check if OpenAI is available via AI Gateway
    return true // AI Gateway handles OpenAI by default
  }

  private buildPrompt(params: {
    documentTitle: string
    previousContent?: string
    currentContent: string
    context?: string
  }): string {
    const { documentTitle, previousContent, currentContent, context } = params

    let prompt = `Вы - эксперт по информационной безопасности и комплаенсу в России. Проанализируйте изменения в документе "${documentTitle}".

${context ? `Контекст: ${context}\n\n` : ""}`

    if (previousContent) {
      prompt += `ПРЕДЫДУЩАЯ ВЕРСИЯ:
${previousContent}

ТЕКУЩАЯ ВЕРСИЯ:
${currentContent}

Проанализируйте изменения между версиями.`
    } else {
      prompt += `СОДЕРЖАНИЕ ДОКУМЕНТА:
${currentContent}

Это первая версия документа. Проанализируйте его содержание.`
    }

    prompt += `

Предоставьте анализ в следующем формате JSON:

{
  "summary": "Краткое описание изменений (2-3 предложения)",
  "criticalChanges": [
    {
      "type": "addition|deletion|modification",
      "section": "Название раздела",
      "description": "Описание изменения",
      "severity": "low|medium|high|critical"
    }
  ],
  "impactAssessment": "Оценка влияния изменений на соответствие требованиям ИБ",
  "recommendations": [
    {
      "priority": "low|medium|high",
      "action": "Рекомендуемое действие",
      "deadline": "Срок выполнения (опционально)",
      "relatedDocuments": ["Связанные документы"]
    }
  ]
}

Отвечайте ТОЛЬКО валидным JSON, без дополнительного текста.`

    return prompt
  }

  private parseResponse(text: string): {
    summary: string
    criticalChanges: CriticalChange[]
    impactAssessment: string
    recommendations: Recommendation[]
  } {
    try {
      // Remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      const parsed = JSON.parse(cleanText)

      return {
        summary: parsed.summary || "Анализ не выполнен",
        criticalChanges: parsed.criticalChanges || [],
        impactAssessment: parsed.impactAssessment || "Оценка влияния не выполнена",
        recommendations: parsed.recommendations || [],
      }
    } catch (error) {
      console.error("[OpenAI Provider] Failed to parse response:", error)
      console.error("[OpenAI Provider] Raw text:", text)

      // Return fallback response
      return {
        summary: "Не удалось проанализировать изменения",
        criticalChanges: [],
        impactAssessment: "Оценка влияния недоступна",
        recommendations: [],
      }
    }
  }
}
