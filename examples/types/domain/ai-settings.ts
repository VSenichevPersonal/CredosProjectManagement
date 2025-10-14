/**
 * @intent: Domain types for AI settings
 * @llm-note: Configuration for AI providers and models
 */

export type LLMProvider = 'openai' | 'anthropic' | 'grok' | 'local'

export type AITaskType = 
  | 'document_generation'      // Генерация документов из шаблонов
  | 'document_analysis'        // Анализ изменений между версиями
  | 'compliance_check'         // Проверка соответствия требованиям
  | 'risk_assessment'          // Оценка рисков
  | 'recommendation'           // Генерация рекомендаций
  | 'validation'               // Валидация документов
  | 'quick_analysis'           // Быстрые проверки

export interface AISetting {
  id: string
  tenantId?: string  // NULL = глобальные настройки
  
  // Задача
  taskType: AITaskType
  
  // Провайдер и модель
  provider: LLMProvider
  modelName: string  // gpt-4o, claude-sonnet-4.5, etc
  
  // Параметры
  temperature: number
  maxTokens: number
  
  // Настройки
  isEnabled: boolean
  isDefault: boolean  // Использовать по умолчанию для этой задачи
  
  // Лимиты
  maxRequestsPerDay?: number
  maxTokensPerRequest?: number
  
  // Специфичные для document_generation
  maxClarificationRounds?: number  // Максимальное количество кругов уточняющих вопросов (1-10)
  
  // Метаданные
  description?: string
  notes?: string
  
  // Audit
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateAISettingDTO {
  taskType: AITaskType
  provider: LLMProvider
  modelName: string
  temperature?: number
  maxTokens?: number
  description?: string
  isDefault?: boolean
}

export interface UpdateAISettingDTO {
  provider?: LLMProvider
  modelName?: string
  temperature?: number
  maxTokens?: number
  isEnabled?: boolean
  isDefault?: boolean
  description?: string
}

export interface AISettingsForTask {
  taskType: AITaskType
  provider: LLMProvider
  modelName: string
  temperature: number
  maxTokens: number
  maxClarificationRounds?: number  // Для document_generation
}

