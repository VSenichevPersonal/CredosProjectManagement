# Анализ раздела "Документы" и архитектура мастера генерации

**Дата:** 13 октября 2025  
**Stage:** 17  
**Статус:** Аналитика и архитектурное проектирование

---

## 📋 СОДЕРЖАНИЕ

1. [Текущее состояние системы](#1-текущее-состояние-системы)
2. [Анализ связей](#2-анализ-связей)
3. [Архитектура мастера генерации](#3-архитектура-мастера-генерации)
4. [Провайдерная модель](#4-провайдерная-модель)
5. [Воркфлоу и монетизация](#5-воркфлоу-и-монетизация)
6. [Структурированная база знаний](#6-структурированная-база-знаний)
7. [План реализации](#7-план-реализации)

---

## 1. ТЕКУЩЕЕ СОСТОЯНИЕ СИСТЕМЫ

### 1.1 Архитектура документов

#### Существующие типы данных

**Document** - отдельная сущность (НЕ extends Evidence!)
```typescript
interface Document {
  id: string
  tenantId: string
  organizationId?: string
  
  // Классификация
  documentTypeId: string
  templateId?: string          // ⭐ Связь с шаблоном
  
  // Основная информация
  title: string
  description?: string
  documentNumber?: string
  documentDate?: Date
  
  // Версионирование
  currentVersionId?: string
  versions?: DocumentVersion[]
  
  // Жизненный цикл
  lifecycleStatus: DocumentLifecycle
  approvedBy?: string
  approvedAt?: Date
  
  // Период действия
  effectiveFrom?: Date
  effectiveUntil?: Date
  validityPeriodDays?: number
  nextReviewDate?: Date
  
  // Конфиденциальность
  confidentialityLevel: ConfidentialityLevel
}
```

**Evidence** - может ссылаться на документ или файл
```typescript
interface Evidence {
  // Content: ЛИБО file, ЛИБО document
  fileName?: string
  fileUrl?: string
  documentId?: string          // ⭐ Ссылка на Document
  
  evidenceTypeId?: string
  
  // Relations
  complianceRecordId?: string
  requirementId?: string
  controlMeasures?: Array<{...}>  // Many-to-many через evidence_links
}
```

### 1.2 Существующие связи

#### Схема связей:
```
Requirement (требование)
    ↓ suggests
ControlMeasureTemplate (шаблон меры)
    ↓ instantiates
ControlMeasure (мера контроля)
    ↓ many-to-many (evidence_links)
Evidence (доказательство)
    ↓ references
Document (документ)
    ↓ has many
DocumentVersion (версия документа)
```

**Ключевые наблюдения:**
- ✅ Документ может использоваться как доказательство
- ✅ Есть версионирование документов
- ✅ Есть анализ изменений через LLM
- ✅ Есть workflow для апрувалов
- ❌ НЕТ генерации документов из шаблонов
- ❌ НЕТ мастера/визарда создания документов
- ❌ НЕТ структурированной базы знаний по документам

### 1.3 Существующие сервисы

#### DocumentService
```typescript
class DocumentService {
  static async list(ctx, filters)          // Список документов
  static async getById(ctx, id)            // Получить документ
  static async create(ctx, data)           // Создать документ
  static async update(ctx, id, data)       // Обновить
  static async delete(ctx, id)             // Удалить
  static async getExpiring(ctx, withinDays) // Истекающие
}
```

#### DocumentAnalysisService (LLM)
```typescript
class DocumentAnalysisService {
  async analyzeDocument(...)  // Анализ изменений между версиями
  // Использует OpenAI или Claude для:
  // - Выявления критических изменений
  // - Оценки влияния
  // - Рекомендаций по действиям
}
```

#### EvidenceService
```typescript
class EvidenceService {
  static async createAndLink(ctx, data, controlMeasureIds)
  static async linkToMeasure(ctx, evidenceId, measureId)
  // Поддержка документов как доказательств
}
```

### 1.4 LLM интеграция

#### Текущие провайдеры:
```typescript
// lib/providers/llm/
├─ llm-factory.ts           // Фабрика провайдеров
├─ openai-provider.ts       // gpt-4o
├─ anthropic-provider.ts    // claude-sonnet-4.5 ⭐
└─ llm-provider.interface.ts
```

**Что уже реализовано:**
- ✅ Анализ изменений между версиями
- ✅ Выявление критичных изменений
- ✅ Оценка влияния на комплаенс
- ✅ Рекомендации по действиям

**Что НЕ реализовано:**
- ❌ Генерация документов из шаблонов
- ❌ Заполнение анкет/форм
- ❌ Интерактивный диалог с пользователем
- ❌ Кастомизация под организацию

### 1.5 Workflow система

#### Существующий workflow
```typescript
// lib/workflow/compliance-workflow.ts
// Определены переходы статусов для compliance
// Есть WorkflowDefinition, WorkflowState, WorkflowTransition

// types/domain/workflow-definition.ts
interface WorkflowDefinition {
  workflow_type: 'compliance' | 'evidence' | 'document' | 'approval' | 'custom'
  states: WorkflowState[]
  transitions: WorkflowTransition[]
}
```

**Наблюдения:**
- ✅ Есть база для создания кастомных workflow
- ✅ Поддержка типа 'document'
- ✅ Можно сделать approval workflow
- ❌ Нет workflow для генерации документов
- ❌ Нет многошагового мастера

---

## 2. АНАЛИЗ СВЯЗЕЙ

### 2.1 Как документы связаны с доказательствами

#### Текущий подход:
```typescript
// Evidence может ссылаться на Document
Evidence {
  documentId?: string  // Ссылка на существующий документ
  // ИЛИ
  fileUrl?: string     // Прямой файл
}
```

#### Пример использования:
```
1. Создаём Document
   ├─ title: "Политика ИБ АО Щёкиноазот"
   ├─ documentTypeId: "policy"
   └─ versions: [DocumentVersion]

2. Создаём Evidence, ссылающийся на Document
   ├─ documentId: <document.id>
   └─ title: "Политика ИБ (доказательство)"

3. Связываем Evidence с ControlMeasure
   └─ EvidenceLink: evidence_id + control_measure_id
```

**Преимущества:**
- ✅ Документ хранится отдельно от доказательств
- ✅ Версионирование на уровне документа
- ✅ Можно использовать один документ как доказательство для разных мер
- ✅ Управление жизненным циклом документа

### 2.2 Связь требований → меры → доказательства → документы

```
Requirement "187-ФЗ ст.10"
    ↓ suggests
ControlMeasureTemplate "Политика ИБ"
    ↓ recommended_evidence_type_ids: ["doc-policy", "doc-procedure"]
    
OrganizationRequirement (назначение требования организации)
    ↓ creates
ComplianceRecord (запись соответствия)
    ↓ creates
ControlMeasure (мера для организации)
    ↓ allowed_evidence_type_ids: ["doc-policy"]
    
User uploads Evidence (документ или файл)
    ↓ if documentId is set
Document (с версионированием)
    
EvidenceLink (связь evidence → control_measure)
```

**Умная валидация:**
- **Strict mode:** Только разрешённые типы доказательств
- **Flexible mode:** Любые типы

---

## 3. АРХИТЕКТУРА МАСТЕРА ГЕНЕРАЦИИ

### 3.1 Концепция

**Мастер генерации документов** - многошаговый визард для создания комплекта документов по ИБ:

```
Шаг 1: Выбор темы/пакета
    ↓
Шаг 2: Анкета (общие вопросы)
    ↓
Шаг 3: Уточняющие вопросы от LLM
    ↓
Шаг 4: Выбор провайдера генерации
    ├─ LLM Agent (быстро, дёшево)
    ├─ Fine-tuned Model (точно)
    └─ Human Expert (дорого, качественно) 💰
    ↓
Шаг 5: Генерация/Ожидание
    ↓
Шаг 6: Предпросмотр и редактирование
    ↓
Шаг 7: Сохранение как Document
```

### 3.2 Типы данных для мастера

```typescript
// Пакет документов (тема)
interface DocumentPackage {
  id: string
  code: string              // "kii-category-2"
  title: string             // "Документы для КИИ категории 2"
  description: string
  regulatoryFrameworkIds: string[]  // [187-ФЗ, ФСТЭК №239]
  
  // Документы в пакете
  documentTemplateIds: string[]
  
  // Анкета
  questionnaire: QuestionnaireDefinition
  
  // Метаданные
  estimatedTime: number     // Минуты
  complexity: 'simple' | 'medium' | 'complex'
  price?: Money             // Для платных пакетов
  
  isActive: boolean
  createdAt: Date
}

// Определение анкеты
interface QuestionnaireDefinition {
  id: string
  title: string
  sections: QuestionSection[]
}

interface QuestionSection {
  id: string
  title: string
  description?: string
  questions: Question[]
}

interface Question {
  id: string
  type: 'text' | 'select' | 'multiselect' | 'number' | 'date' | 'boolean'
  label: string
  placeholder?: string
  required: boolean
  options?: Option[]        // Для select/multiselect
  validation?: ValidationRule
  dependsOn?: QuestionDependency  // Условное отображение
}

interface Option {
  value: string
  label: string
}

// Сессия мастера
interface DocumentGenerationWizard {
  id: string
  tenantId: string
  userId: string
  organizationId: string
  
  // Выбранный пакет
  packageId: string
  
  // Ответы на анкету
  answers: Record<string, any>  // questionId → answer
  
  // Уточняющие вопросы от LLM
  clarificationQuestions?: ClarificationQuestion[]
  clarificationAnswers?: Record<string, string>
  
  // Выбранный провайдер
  provider: GenerationProvider
  
  // Статус
  status: WizardStatus
  currentStep: number
  
  // Результаты
  generatedDocuments?: GeneratedDocument[]
  
  // Timestamps
  startedAt: Date
  completedAt?: Date
}

type WizardStatus = 
  | 'draft'              // Заполняется анкета
  | 'clarifying'         // LLM задаёт уточняющие вопросы
  | 'selecting_provider' // Выбор провайдера
  | 'pending'            // Ожидание генерации
  | 'processing'         // Генерация в процессе
  | 'completed'          // Готово
  | 'failed'             // Ошибка

interface ClarificationQuestion {
  id: string
  question: string
  context: string       // Почему этот вопрос важен
  suggestedAnswers?: string[]
}

interface GeneratedDocument {
  templateId: string
  title: string
  content: string       // Сгенерированный текст
  format: 'markdown' | 'html' | 'docx'
  confidence: number    // 0-100, уверенность LLM
  warnings?: string[]   // Что нужно проверить вручную
}

// Провайдеры генерации
type GenerationProvider = 
  | { type: 'llm'; model: 'gpt-4o' | 'claude-sonnet-4.5'; estimatedTime: number; price: number }
  | { type: 'finetuned'; modelId: string; estimatedTime: number; price: number }
  | { type: 'human'; expertId?: string; estimatedTime: number; price: number }

interface ProviderCapability {
  type: GenerationProvider['type']
  name: string
  description: string
  speed: 'fast' | 'medium' | 'slow'
  quality: 'good' | 'high' | 'excellent'
  price: Money
  estimatedTime: string  // "5-10 минут"
  isAvailable: boolean
}
```

### 3.3 Сервисы для мастера

```typescript
// services/document-generation-wizard-service.ts

class DocumentGenerationWizardService {
  /**
   * Создать новую сессию мастера
   */
  static async startWizard(
    ctx: ExecutionContext,
    packageId: string,
    organizationId: string
  ): Promise<DocumentGenerationWizard> {
    const wizard = await ctx.db.documentWizards.create({
      packageId,
      organizationId,
      userId: ctx.user!.id,
      tenantId: ctx.tenantId,
      status: 'draft',
      currentStep: 1,
      answers: {},
      startedAt: new Date()
    })
    
    return wizard
  }
  
  /**
   * Сохранить ответы на анкету
   */
  static async saveAnswers(
    ctx: ExecutionContext,
    wizardId: string,
    answers: Record<string, any>
  ): Promise<DocumentGenerationWizard> {
    const wizard = await ctx.db.documentWizards.update(wizardId, {
      answers,
      currentStep: 2
    })
    
    // Генерируем уточняющие вопросы через LLM
    const clarifications = await this.generateClarificationQuestions(
      ctx,
      wizard
    )
    
    return await ctx.db.documentWizards.update(wizardId, {
      clarificationQuestions: clarifications,
      status: 'clarifying'
    })
  }
  
  /**
   * Генерация уточняющих вопросов через LLM
   */
  static async generateClarificationQuestions(
    ctx: ExecutionContext,
    wizard: DocumentGenerationWizard
  ): Promise<ClarificationQuestion[]> {
    const llm = LLMFactory.create('anthropic', 'claude-sonnet-4.5')
    
    const pkg = await ctx.db.documentPackages.findById(wizard.packageId)
    const org = await ctx.db.organizations.findById(wizard.organizationId)
    
    const prompt = `
      Ты эксперт по российскому ИБ-комплаенсу.
      
      ЗАДАЧА: Нужно сгенерировать комплект документов "${pkg.title}" для организации.
      
      КОНТЕКСТ ОРГАНИЗАЦИИ:
      - Название: ${org.name}
      - Тип: ${org.type}
      
      ОТВЕТЫ ПОЛЬЗОВАТЕЛЯ НА АНКЕТУ:
      ${JSON.stringify(wizard.answers, null, 2)}
      
      На основе этих ответов, задай 3-5 УТОЧНЯЮЩИХ вопросов, которые помогут 
      сгенерировать более точные документы. Вопросы должны быть:
      - Конкретными
      - Важными для качества документов
      - Не дублировать информацию из анкеты
      
      Формат ответа: JSON массив объектов
      {
        "question": "Вопрос",
        "context": "Почему это важно",
        "suggestedAnswers": ["Вариант 1", "Вариант 2"]
      }
    `
    
    // Парсим ответ LLM
    const questions = JSON.parse(await llm.generate(prompt))
    
    return questions.map((q, i) => ({
      id: `clarify-${i}`,
      ...q
    }))
  }
  
  /**
   * Получить доступных провайдеров
   */
  static async getAvailableProviders(
    ctx: ExecutionContext,
    wizardId: string
  ): Promise<ProviderCapability[]> {
    const wizard = await ctx.db.documentWizards.findById(wizardId)
    const pkg = await ctx.db.documentPackages.findById(wizard.packageId)
    
    return [
      {
        type: 'llm',
        name: 'Claude 4.5 Sonnet (AI)',
        description: 'Быстрая автоматическая генерация с помощью ИИ',
        speed: 'fast',
        quality: 'high',
        price: { amount: 500, currency: 'RUB' },
        estimatedTime: '5-10 минут',
        isAvailable: true
      },
      {
        type: 'finetuned',
        name: 'Специализированная модель',
        description: 'Дообученная модель для российского ИБ-комплаенса',
        speed: 'medium',
        quality: 'excellent',
        price: { amount: 1500, currency: 'RUB' },
        estimatedTime: '15-20 минут',
        isAvailable: false  // Пока не готово
      },
      {
        type: 'human',
        name: 'Эксперт-интегратор',
        description: 'Ручная подготовка документов экспертом',
        speed: 'slow',
        quality: 'excellent',
        price: { amount: 15000, currency: 'RUB' },
        estimatedTime: '2-3 рабочих дня',
        isAvailable: true
      }
    ]
  }
  
  /**
   * Запустить генерацию
   */
  static async generate(
    ctx: ExecutionContext,
    wizardId: string,
    provider: GenerationProvider
  ): Promise<DocumentGenerationWizard> {
    const wizard = await ctx.db.documentWizards.update(wizardId, {
      provider,
      status: 'pending',
      currentStep: 5
    })
    
    // Запускаем генерацию асинхронно
    if (provider.type === 'llm' || provider.type === 'finetuned') {
      await this.generateWithLLM(ctx, wizard)
    } else if (provider.type === 'human') {
      await this.requestHumanGeneration(ctx, wizard)
    }
    
    return wizard
  }
  
  /**
   * Генерация через LLM
   */
  private static async generateWithLLM(
    ctx: ExecutionContext,
    wizard: DocumentGenerationWizard
  ): Promise<void> {
    // Обновляем статус
    await ctx.db.documentWizards.update(wizard.id, {
      status: 'processing'
    })
    
    try {
      const llm = LLMFactory.create('anthropic', 'claude-sonnet-4.5')
      
      // Загружаем шаблоны
      const pkg = await ctx.db.documentPackages.findById(wizard.packageId)
      const templates = await ctx.db.documentTemplates.findMany({
        ids: pkg.documentTemplateIds
      })
      
      // Загружаем контекст организации
      const org = await ctx.db.organizations.findById(wizard.organizationId)
      
      // Загружаем ВСЕ шаблоны для контекста (1M токенов!)
      const allTemplates = await ctx.db.documentTemplates.findAll()
      
      // Генерируем каждый документ
      const generatedDocs: GeneratedDocument[] = []
      
      for (const template of templates) {
        const doc = await this.generateDocument(
          llm,
          template,
          allTemplates,
          org,
          wizard.answers,
          wizard.clarificationAnswers
        )
        generatedDocs.push(doc)
      }
      
      // Сохраняем результаты
      await ctx.db.documentWizards.update(wizard.id, {
        generatedDocuments: generatedDocs,
        status: 'completed',
        currentStep: 6,
        completedAt: new Date()
      })
    } catch (error) {
      await ctx.db.documentWizards.update(wizard.id, {
        status: 'failed'
      })
      throw error
    }
  }
  
  /**
   * Генерация одного документа
   */
  private static async generateDocument(
    llm: LLMProvider,
    template: DocumentTemplate,
    allTemplates: DocumentTemplate[],
    organization: Organization,
    answers: Record<string, any>,
    clarifications?: Record<string, string>
  ): Promise<GeneratedDocument> {
    const templatesContext = allTemplates
      .map(t => `[${t.code}] ${t.title}\n${t.content}`)
      .join('\n\n---\n\n')
    
    const prompt = `
      Ты эксперт по российскому ИБ-комплаенсу.
      
      ЗАДАЧА: Создай документ "${template.title}" для организации.
      
      КОНТЕКСТ: У тебя есть следующие шаблоны документов:
      ${templatesContext}
      
      ОРГАНИЗАЦИЯ:
      - Название: ${organization.name}
      - Тип: ${organization.type}
      - ИНН: ${organization.inn}
      - Адрес: ${organization.address}
      
      ДАННЫЕ ИЗ АНКЕТЫ:
      ${JSON.stringify(answers, null, 2)}
      
      ${clarifications ? `
      УТОЧНЕНИЯ:
      ${JSON.stringify(clarifications, null, 2)}
      ` : ''}
      
      ТРЕБОВАНИЯ:
      1. Используй шаблон [${template.code}] как основу
      2. Адаптируй под организацию
      3. Заполни все обязательные разделы
      4. Используй российские стандарты оформления
      5. Укажи конкретные ссылки на НПА
      6. Добавь реквизиты организации
      
      Формат вывода: Markdown
    `
    
    const content = await llm.generate(prompt)
    
    return {
      templateId: template.id,
      title: template.title,
      content,
      format: 'markdown',
      confidence: 85,  // TODO: рассчитывать confidence
      warnings: this.detectWarnings(content)
    }
  }
  
  /**
   * Запрос генерации человеком
   */
  private static async requestHumanGeneration(
    ctx: ExecutionContext,
    wizard: DocumentGenerationWizard
  ): Promise<void> {
    // Создаём задачу для эксперта
    await ctx.db.expertTasks.create({
      type: 'document_generation',
      wizardId: wizard.id,
      organizationId: wizard.organizationId,
      status: 'pending',
      dueDate: addDays(new Date(), 3),
      price: 15000
    })
    
    // Отправляем уведомление экспертам
    await ctx.notifications.notifyExperts({
      type: 'new_task',
      taskId: wizard.id
    })
  }
  
  /**
   * Сохранить документы
   */
  static async saveDocuments(
    ctx: ExecutionContext,
    wizardId: string,
    documents: Array<{
      templateId: string
      content: string
      title: string
    }>
  ): Promise<Document[]> {
    const wizard = await ctx.db.documentWizards.findById(wizardId)
    const savedDocs: Document[] = []
    
    for (const doc of documents) {
      // Создаём Document
      const document = await DocumentService.create(ctx, {
        title: doc.title,
        organizationId: wizard.organizationId,
        templateId: doc.templateId,
        // ... другие поля
      })
      
      // Создаём версию с контентом
      await ctx.db.documentVersions.create({
        documentId: document.id,
        content: doc.content,
        versionNumber: 'v1.0',
        // ...
      })
      
      savedDocs.push(document)
    }
    
    return savedDocs
  }
}
```

---

## 4. ПРОВАЙДЕРНАЯ МОДЕЛЬ

### 4.1 Интерфейс провайдера генерации

```typescript
// lib/providers/document-generation/generation-provider.interface.ts

export interface DocumentGenerationProvider {
  name: string
  type: 'llm' | 'finetuned' | 'human'
  
  /**
   * Проверка доступности
   */
  isAvailable(): Promise<boolean>
  
  /**
   * Получить возможности провайдера
   */
  getCapabilities(): ProviderCapability
  
  /**
   * Генерация документа
   */
  generateDocument(params: GenerationParams): Promise<GeneratedDocument>
  
  /**
   * Оценка стоимости
   */
  estimateCost(params: GenerationParams): Promise<Money>
  
  /**
   * Оценка времени
   */
  estimateTime(params: GenerationParams): Promise<number>
}

interface GenerationParams {
  template: DocumentTemplate
  organization: Organization
  answers: Record<string, any>
  clarifications?: Record<string, string>
  context?: {
    allTemplates?: DocumentTemplate[]
    regulations?: RegulatoryDocument[]
    examples?: Document[]
  }
}
```

### 4.2 LLM провайдер

```typescript
// lib/providers/document-generation/llm-generation-provider.ts

export class LLMDocumentGenerationProvider implements DocumentGenerationProvider {
  name = 'Claude 4.5 AI Generator'
  type = 'llm' as const
  
  constructor(
    private llmProvider: LLMProvider = LLMFactory.create('anthropic')
  ) {}
  
  async isAvailable(): Promise<boolean> {
    return await this.llmProvider.isAvailable()
  }
  
  getCapabilities(): ProviderCapability {
    return {
      type: 'llm',
      name: this.name,
      description: 'Автоматическая генерация документов с помощью Claude 4.5',
      speed: 'fast',
      quality: 'high',
      price: { amount: 500, currency: 'RUB' },
      estimatedTime: '5-10 минут',
      isAvailable: true
    }
  }
  
  async generateDocument(params: GenerationParams): Promise<GeneratedDocument> {
    // См. реализацию выше в generateDocument()
  }
  
  async estimateCost(params: GenerationParams): Promise<Money> {
    // Оценка на основе токенов
    const estimatedTokens = this.estimateTokens(params)
    return {
      amount: Math.ceil(estimatedTokens / 1000 * 0.003), // $3 per 1M input
      currency: 'RUB'
    }
  }
}
```

### 4.3 Human провайдер

```typescript
// lib/providers/document-generation/human-generation-provider.ts

export class HumanDocumentGenerationProvider implements DocumentGenerationProvider {
  name = 'Эксперт-интегратор'
  type = 'human' as const
  
  getCapabilities(): ProviderCapability {
    return {
      type: 'human',
      name: this.name,
      description: 'Ручная подготовка документов экспертом по ИБ',
      speed: 'slow',
      quality: 'excellent',
      price: { amount: 15000, currency: 'RUB' },
      estimatedTime: '2-3 рабочих дня',
      isAvailable: true
    }
  }
  
  async generateDocument(params: GenerationParams): Promise<GeneratedDocument> {
    // Создаём задачу для эксперта
    // Возвращаем pending статус
    throw new Error('Human generation requires async workflow')
  }
}
```

### 4.4 Фабрика провайдеров

```typescript
// lib/providers/document-generation/generation-provider-factory.ts

export class DocumentGenerationProviderFactory {
  static create(type: 'llm' | 'finetuned' | 'human'): DocumentGenerationProvider {
    switch (type) {
      case 'llm':
        return new LLMDocumentGenerationProvider()
      case 'finetuned':
        throw new Error('Fine-tuned provider not yet implemented')
      case 'human':
        return new HumanDocumentGenerationProvider()
      default:
        throw new Error(`Unknown provider type: ${type}`)
    }
  }
  
  static async getAvailableProviders(): Promise<DocumentGenerationProvider[]> {
    const providers = [
      this.create('llm'),
      this.create('human')
    ]
    
    const available = []
    for (const provider of providers) {
      if (await provider.isAvailable()) {
        available.push(provider)
      }
    }
    
    return available
  }
}
```

---

## 5. ВОРКФЛОУ И МОНЕТИЗАЦИЯ

### 5.1 Workflow для генерации

```typescript
// lib/workflow/document-generation-workflow.ts

export const DOCUMENT_GENERATION_WORKFLOW: WorkflowDefinition = {
  id: 'document-generation',
  workflow_type: 'custom',
  name: 'Генерация документов',
  states: [
    {
      name: 'draft',
      state_type: 'initial',
      display_order: 1
    },
    {
      name: 'questionnaire_filled',
      state_type: 'intermediate',
      display_order: 2
    },
    {
      name: 'clarifying',
      state_type: 'intermediate',
      display_order: 3
    },
    {
      name: 'provider_selected',
      state_type: 'intermediate',
      display_order: 4
    },
    {
      name: 'payment_pending',
      state_type: 'intermediate',
      display_order: 5,
      on_enter_actions: {
        action: 'create_payment_intent',
        provider: 'stripe'
      }
    },
    {
      name: 'generating',
      state_type: 'intermediate',
      display_order: 6
    },
    {
      name: 'reviewing',
      state_type: 'intermediate',
      display_order: 7
    },
    {
      name: 'completed',
      state_type: 'final',
      display_order: 8
    }
  ],
  transitions: [
    {
      from_state_name: 'draft',
      to_state_name: 'questionnaire_filled',
      name: 'Заполнить анкету',
      requires_comment: false
    },
    {
      from_state_name: 'questionnaire_filled',
      to_state_name: 'clarifying',
      name: 'Сгенерировать уточняющие вопросы',
      actions: {
        action: 'generate_clarifications',
        provider: 'llm'
      }
    },
    {
      from_state_name: 'clarifying',
      to_state_name: 'provider_selected',
      name: 'Выбрать провайдера'
    },
    {
      from_state_name: 'provider_selected',
      to_state_name: 'payment_pending',
      name: 'Перейти к оплате',
      conditions: {
        if: 'price > 0'
      }
    },
    {
      from_state_name: 'payment_pending',
      to_state_name: 'generating',
      name: 'Оплата получена'
    },
    {
      from_state_name: 'generating',
      to_state_name: 'reviewing',
      name: 'Генерация завершена'
    },
    {
      from_state_name: 'reviewing',
      to_state_name: 'completed',
      name: 'Документы сохранены'
    }
  ]
}
```

### 5.2 Модель оплаты

```typescript
// types/domain/payment.ts

interface PaymentIntent {
  id: string
  tenantId: string
  userId: string
  
  // Связь с заказом
  wizardId: string
  provider: GenerationProvider
  
  // Сумма
  amount: number
  currency: string
  
  // Статус
  status: PaymentStatus
  
  // Провайдер оплаты
  paymentProvider: 'stripe' | 'yookassa' | 'invoice'
  paymentProviderId?: string  // ID в системе провайдера
  
  // Timestamps
  createdAt: Date
  paidAt?: Date
  cancelledAt?: Date
}

type PaymentStatus = 
  | 'pending'       // Ожидает оплаты
  | 'processing'    // Обрабатывается
  | 'succeeded'     // Оплачен
  | 'failed'        // Ошибка
  | 'cancelled'     // Отменён

// Тарифы
interface PricingTier {
  providerId: string
  name: string
  basePrice: Money
  perDocumentPrice: Money
  features: string[]
}

const PRICING_TIERS: PricingTier[] = [
  {
    providerId: 'llm',
    name: 'AI Генератор',
    basePrice: { amount: 500, currency: 'RUB' },
    perDocumentPrice: { amount: 100, currency: 'RUB' },
    features: [
      'Быстрая генерация (5-10 мин)',
      'Высокое качество',
      'Автоматическая адаптация',
      'Неограниченные правки'
    ]
  },
  {
    providerId: 'human',
    name: 'Эксперт-интегратор',
    basePrice: { amount: 15000, currency: 'RUB' },
    perDocumentPrice: { amount: 3000, currency: 'RUB' },
    features: [
      'Экспертное качество',
      'Ручная проработка',
      '2-3 рабочих дня',
      '1 итерация правок включена',
      'Консультация эксперта'
    ]
  }
]
```

---

## 6. СТРУКТУРИРОВАННАЯ БАЗА ЗНАНИЙ

### 6.1 Типы данных

```typescript
// types/domain/knowledge-base-structured.ts

// Существующая структура (базовая)
interface KBArticle {
  id: string
  title: string
  category: 'regulator' | 'requirement_type' | 'how_to' | 'faq' | 'templates'
  content: string
}

// ⭐ НОВАЯ структурированная база знаний
interface StructuredKBArticle {
  id: string
  type: DocumentKBType
  
  // Метаданные
  title: string
  slug: string
  excerpt?: string
  
  // Таксономия
  regulatorIds?: string[]          // [ФСТЭК, ФСБ, РКН]
  regulatoryFrameworkIds?: string[] // [187-ФЗ, 152-ФЗ]
  documentTypeIds?: string[]        // [policy, procedure, instruction]
  requirementCategories?: string[]  // [organizational, technical]
  
  // Контент
  sections: KBSection[]
  
  // Связи
  relatedArticles?: string[]
  relatedTemplates?: string[]
  
  // Метаданные
  authorId?: string
  reviewedBy?: string[]
  lastReviewedAt?: Date
  views: number
  helpfulCount: number
  
  // Статус
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

type DocumentKBType = 
  | 'guide'              // Руководство (как делать)
  | 'template_guide'     // Инструкция по шаблону
  | 'best_practice'      // Лучшие практики
  | 'checklist'          // Чек-лист
  | 'faq'                // FAQ
  | 'case_study'         // Кейс
  | 'legal_commentary'   // Комментарий к НПА

interface KBSection {
  id: string
  title: string
  content: string
  order: number
  
  // Структурированные элементы
  elements?: KBElement[]
}

type KBElement = 
  | { type: 'text'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code'; language: string; code: string }
  | { type: 'warning'; message: string }
  | { type: 'tip'; message: string }
  | { type: 'example'; title: string; content: string }
  | { type: 'reference'; documentId: string; title: string }

// Шаблон документа с расширенными метаданными
interface DocumentTemplate {
  id: string
  code: string          // "policy-ib-kii-cat2"
  title: string
  description?: string
  
  // Классификация
  documentTypeId: string
  category?: string
  
  // Применимость
  regulatoryFrameworkIds: string[]  // К каким НПА относится
  organizationTypes?: string[]      // Для каких типов организаций
  kiiCategory?: number[]            // Для каких категорий КИИ
  
  // Контент шаблона
  content: string                   // Markdown с плейсхолдерами
  placeholders: TemplatePlaceholder[]
  sections: TemplateSection[]
  
  // Метаданные
  complexity: 'simple' | 'medium' | 'complex'
  estimatedTime: number             // Минуты на заполнение
  requiredFields: string[]
  
  // База знаний
  kbArticleIds?: string[]           // Связанные статьи
  instructionsUrl?: string
  
  // Версионирование
  version: string
  isActive: boolean
  deprecatedBy?: string             // ID нового шаблона
  
  createdAt: Date
  updatedAt: Date
}

interface TemplatePlaceholder {
  key: string                 // {{organization.name}}
  label: string              // "Название организации"
  type: 'text' | 'date' | 'select' | 'multiline'
  required: boolean
  defaultValue?: string
  description?: string
  example?: string
}

interface TemplateSection {
  id: string
  title: string
  content: string
  isRequired: boolean
  order: number
  canBeCustomized: boolean
  guidance?: string          // Подсказка по заполнению
}
```

### 6.2 Структура БЗ для документов

```
База знаний "Как делать документы по ИБ"

├─ Типы документов
│  ├─ Политики
│  │  ├─ Что такое политика ИБ
│  │  ├─ Структура политики
│  │  ├─ Обязательные разделы
│  │  ├─ Требования регуляторов
│  │  └─ Шаблоны политик
│  │
│  ├─ Инструкции
│  ├─ Процедуры
│  ├─ Положения
│  └─ Акты
│
├─ Регуляторы
│  ├─ ФСТЭК
│  │  ├─ 187-ФЗ (КИИ)
│  │  │  ├─ Обзор требований
│  │  │  ├─ Какие документы нужны
│  │  │  ├─ Шаблоны для КИИ категория 1
│  │  │  ├─ Шаблоны для КИИ категория 2
│  │  │  └─ Чек-листы проверки
│  │  │
│  │  └─ Приказ №17, №21, №239
│  │
│  ├─ ФСБ
│  ├─ Роскомнадзор (152-ФЗ)
│  └─ Минцифры
│
├─ Процессы
│  ├─ Разработка нового документа
│  ├─ Согласование и утверждение
│  ├─ Ввод в действие
│  ├─ Актуализация
│  └─ Архивирование
│
├─ Лучшие практики
│  ├─ Как писать понятные политики
│  ├─ Частые ошибки
│  ├─ Советы от экспертов
│  └─ Кейсы успешных проектов
│
└─ Инструменты
   ├─ Мастер генерации
   ├─ Шаблоны
   └─ Автоматизация
```

### 6.3 Интеграция БЗ с мастером

```typescript
// Мастер использует БЗ для:

1. Подсказок при заполнении анкеты
   - "Что такое категория КИИ?" → статья из БЗ
   
2. Контекста для LLM
   - Передаём статьи БЗ как контекст
   - LLM использует их для генерации
   
3. Валидации
   - Проверяем что документ соответствует структуре из БЗ
   
4. Рекомендаций
   - "Для вашего типа организации также рекомендуется..."
```

---

## 7. ПЛАН РЕАЛИЗАЦИИ

### Фаза 1: Базовая инфраструктура (3-4 дня)

#### 1.1 Типы и схема БД
- [ ] Создать типы для мастера (`DocumentGenerationWizard`, `DocumentPackage`)
- [ ] Создать типы для структурированной БЗ
- [ ] Миграция БД (таблицы)
- [ ] Обновить провайдеры

#### 1.2 Сервисы
- [ ] `DocumentGenerationWizardService`
- [ ] `DocumentPackageService`
- [ ] `StructuredKBService`
- [ ] Провайдеры генерации

#### 1.3 API
- [ ] `/api/document-wizard` (CRUD)
- [ ] `/api/document-packages` (список пакетов)
- [ ] `/api/document-generation/providers` (доступные провайдеры)
- [ ] `/api/kb/structured` (БЗ)

### Фаза 2: Мастер UI (4-5 дней)

#### 2.1 Компоненты мастера
- [ ] `DocumentGenerationWizard` (основной компонент)
- [ ] `PackageSelectionStep`
- [ ] `QuestionnaireStep`
- [ ] `ClarificationStep`
- [ ] `ProviderSelectionStep`
- [ ] `GenerationProgressStep`
- [ ] `DocumentReviewStep`

#### 2.2 Страницы
- [ ] `/documents/wizard/new` (точка входа)
- [ ] `/documents/wizard/[id]` (сессия мастера)

### Фаза 3: LLM генерация (3-4 дня)

#### 3.1 Промпт-инжиниринг
- [ ] Системный промпт для российского комплаенса
- [ ] Промпты для уточняющих вопросов
- [ ] Промпты для генерации документов
- [ ] Валидация качества ответов

#### 3.2 Интеграция
- [ ] Использование Claude 4.5 с 1M контекстом
- [ ] Загрузка всех шаблонов в контекст
- [ ] Потоковая генерация (streaming)

### Фаза 4: База знаний (2-3 дня)

#### 4.1 Структурированная БЗ
- [ ] Создать первые статьи
- [ ] Редактор статей
- [ ] Поиск по БЗ
- [ ] Интеграция с мастером

#### 4.2 Контент
- [ ] 10 статей "Как делать документы"
- [ ] 5 руководств по регуляторам
- [ ] 3 кейса

### Фаза 5: Монетизация (3-4 дня)

#### 5.1 Платежи
- [ ] Интеграция с платёжной системой (YooKassa)
- [ ] Создание PaymentIntent
- [ ] Обработка webhook'ов
- [ ] Отображение статуса оплаты

#### 5.2 Human провайдер
- [ ] Создание задач для экспертов
- [ ] Интерфейс для экспертов
- [ ] Загрузка готовых документов
- [ ] Уведомления

### Фаза 6: Полировка (2-3 дня)

#### 6.1 UX
- [ ] Автосохранение прогресса
- [ ] Возобновление прерванных сессий
- [ ] Предпросмотр документов
- [ ] Экспорт в DOCX

#### 6.2 Тестирование
- [ ] E2E тесты мастера
- [ ] Тесты LLM генерации
- [ ] Нагрузочное тестирование

---

## ИТОГО

### Что будет реализовано

✅ **Мастер генерации документов**
- Многошаговый визард
- Анкета с валидацией
- Уточняющие вопросы от LLM
- Выбор провайдера генерации

✅ **Провайдерная архитектура**
- LLM провайдер (Claude 4.5)
- Human провайдер (эксперты)
- Расширяемая для fine-tuned моделей

✅ **Структурированная база знаний**
- Инструкции по созданию документов
- Руководства по регуляторам
- Интеграция с мастером

✅ **Монетизация**
- Платные пакеты документов
- Оплата за экспертов
- Гибкие тарифы

✅ **Интеграция с существующей системой**
- Документы сохраняются как Document
- Могут использоваться как Evidence
- Версионирование и апрувалы работают

### Оценка сроков

**Общее время:** 17-23 дня разработки

**MVP (минимально жизнеспособный продукт):**
- Фаза 1 + Фаза 2 + Фаза 3 = **10-13 дней**
- Только LLM провайдер
- Базовая БЗ (без редактора)
- Без платежей

**Full Version:**
- Все фазы = **17-23 дня**

---

## СЛЕДУЮЩИЕ ШАГИ

1. **Обсудить с пользователем:**
   - Приоритеты функций
   - Готовность к монетизации
   - Какие регуляторы важнее
   
2. **Получить пример анкеты GLy/**
   - Изучить структуру
   - Адаптировать под нашу модель
   
3. **Начать реализацию:**
   - Старт с Фазы 1 (инфраструктура)

---

**Готовы обсудить детали и начать реализацию?** 🚀

