/**
 * @intent: Domain types for document packages and generation wizard
 * @llm-note: Document packages are pre-configured sets of documents for compliance
 * @architecture: DDD - Aggregate root for document generation workflow
 */

export type PackageComplexity = "simple" | "medium" | "complex"
export type WizardStatus = 
  | "draft"              // Заполняется анкета
  | "clarifying"         // LLM задаёт уточняющие вопросы
  | "selecting_provider" // Выбор провайдера
  | "pending"            // Ожидание генерации
  | "processing"         // Генерация в процессе
  | "completed"          // Готово
  | "failed"             // Ошибка

export type GenerationProviderType = "llm" | "finetuned" | "human"

// =====================================================
// ENTITIES
// =====================================================

/**
 * @intent: Document Package - пакет документов для генерации
 * @llm-note: Represents a set of related documents (e.g. "152-FZ PDn")
 */
export interface DocumentPackage {
  id: string
  code: string
  title: string
  description: string
  
  // Классификация
  regulators: string[]                    // ["Роскомнадзор", "ФСТЭК"]
  regulatoryFrameworkIds: string[]        // UUID ссылки на regulatory_frameworks
  
  // Документы в пакете
  documentTemplateIds: string[]           // UUID ссылки на document_templates
  documentsCount: number
  
  // Анкета (JSON structure)
  questionnaire: QuestionnaireDefinition
  
  // Метаданные
  estimatedTimeMinutes: number
  complexity: PackageComplexity
  
  // Статус
  isAvailable: boolean
  isActive: boolean
  
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

/**
 * @intent: Questionnaire definition structure
 * @llm-note: Defines questions for document generation
 */
export interface QuestionnaireDefinition {
  id: string
  title: string
  sections: QuestionSection[]
}

export interface QuestionSection {
  id: string
  title: string
  description?: string
  questions: Question[]
}

export type QuestionType = "text" | "select" | "multiselect" | "number" | "date" | "boolean" | "textarea"

export interface Question {
  id: string
  type: QuestionType
  label: string
  placeholder?: string
  required: boolean
  options?: QuestionOption[]
  validation?: ValidationRule
  dependsOn?: QuestionDependency
  helpText?: string
}

export interface QuestionOption {
  value: string
  label: string
}

export interface ValidationRule {
  pattern?: string
  min?: number
  max?: number
  message?: string
}

export interface QuestionDependency {
  questionId: string
  values: any[]  // Show this question only if dependency question has one of these values
}

/**
 * @intent: Document generation session (wizard state)
 * @llm-note: Tracks user progress through document generation wizard
 */
export interface DocumentGenerationSession {
  id: string
  tenantId: string
  userId: string
  organizationId: string
  
  // Выбранный пакет
  packageId: string
  
  // Ответы на анкету
  answers: Record<string, any>
  
  // Уточняющие вопросы от LLM (опционально)
  clarificationQuestions?: ClarificationQuestion[]
  clarificationAnswers?: Record<string, string>
  
  // Выбранный провайдер
  providerType?: GenerationProviderType
  providerConfig?: ProviderConfig
  
  // Статус
  status: WizardStatus
  currentStep: number
  
  // Результаты генерации
  generatedDocuments?: GeneratedDocument[]
  
  // OpenAI Assistant
  openaiThreadId?: string                 // ID треда в OpenAI
  openaiRunId?: string                    // ID последнего run
  
  // Timestamps
  startedAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * @intent: Clarification question from LLM
 */
export interface ClarificationQuestion {
  id: string
  question: string
  context: string
  suggestedAnswers?: string[]
}

/**
 * @intent: Provider configuration
 */
export interface ProviderConfig {
  type: GenerationProviderType
  model?: string                          // "gpt-4o", "claude-sonnet-4.5"
  temperature?: number
  maxTokens?: number
  estimatedTime?: string
  price?: number
}

/**
 * @intent: Generated document result
 */
export interface GeneratedDocument {
  id: string
  templateId: string
  templateCode: string
  title: string
  content: string
  format: "markdown" | "html" | "docx"
  confidence: number                      // 0-100
  warnings?: string[]
  tokensUsed?: number
  generationTimeMs?: number
}

/**
 * @intent: Link between session and saved documents
 */
export interface SessionDocument {
  id: string
  sessionId: string
  documentId: string                      // ID в таблице evidence (documents)
  
  templateId?: string
  confidenceScore?: number
  
  createdAt: Date
}

// =====================================================
// DTOs
// =====================================================

export interface CreateDocumentPackageDTO {
  code: string
  title: string
  description: string
  regulators: string[]
  regulatoryFrameworkIds: string[]
  documentTemplateIds: string[]
  questionnaire: QuestionnaireDefinition
  estimatedTimeMinutes: number
  complexity: PackageComplexity
  isAvailable?: boolean
}

export interface UpdateDocumentPackageDTO {
  title?: string
  description?: string
  questionnaire?: QuestionnaireDefinition
  estimatedTimeMinutes?: number
  complexity?: PackageComplexity
  isAvailable?: boolean
  isActive?: boolean
}

export interface StartWizardDTO {
  packageId: string
  organizationId: string
}

export interface SaveAnswersDTO {
  answers: Record<string, any>
}

export interface SelectProviderDTO {
  providerType: GenerationProviderType
  providerConfig?: ProviderConfig
}

export interface GenerateDocumentsDTO {
  sessionId: string
}

