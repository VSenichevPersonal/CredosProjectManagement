# Анализ требований клиента: Щёкиноазот
# Скорректированная версия с реальным состоянием функционала

**Дата:** 10 января 2025  
**Версия:** 2.0 (Corrected)  
**Статус:** Детальный анализ с проверкой реализации

---

## Executive Summary

После детальной проверки кодовой базы выявлено, что **реальная готовность системы составляет 35-40%** (не 65% как в первоначальной оценке). Многие компоненты имеют только архитектурную основу (таблицы БД, типы, сервисы), но **не имеют реальной реализации функционала**.

**Критические находки:**
- ❌ Diff система - только placeholder (TODO в коде)
- ❌ AI-анализ - работает, но использует placeholder контент (нет извлечения текста из PDF/DOCX)
- ❌ Шаблоны документов - отсутствуют полностью
- ❌ Автоматическая отгрузка - не реализована
- ❌ Интеграции с внешними источниками - отсутствуют

---

## Детальный анализ требований

### 1. Управление шаблонами документов

#### 1.1 Автоматическая отгрузка шаблонов при изменении нормативов

**Требование клиента:**
> При изменении нормативных документов (ФСТЭК, ФСБ, 152-ФЗ) система должна автоматически получать обновлённые шаблоны документов и уведомлять пользователей.

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО**

**Что есть:**
- Таблица `regulatory_frameworks` для хранения нормативных актов
- Базовая структура для requirements

**Что отсутствует:**
- Интеграция с внешними источниками (ФСТЭК, ФСБ, Консультант+)
- Система мониторинга изменений нормативов
- Автоматическая загрузка шаблонов
- Система уведомлений об изменениях

**Как реализовать:**
\`\`\`typescript
// Архитектура решения:
1. Создать RegulatoryMonitoringService
   - Периодический опрос API ФСТЭК/ФСБ (если доступны)
   - Парсинг RSS-лент или веб-скрейпинг
   - Сравнение версий документов (checksum, дата изменения)

2. Создать TemplateDistributionService
   - Загрузка новых шаблонов из внешних источников
   - Версионирование шаблонов
   - Маппинг шаблонов к нормативным актам

3. Создать NotificationService
   - Email уведомления
   - In-app уведомления
   - Webhook для интеграции с внешними системами
\`\`\`

**Ограничения:**
- ⚠️ API ФСТЭК/ФСБ могут быть недоступны или требовать специального доступа
- ⚠️ Веб-скрейпинг может нарушать ToS и быть нестабильным
- ⚠️ Требуется ручная валидация изменений перед применением
- ⚠️ Сложность определения "что изменилось" в нормативных актах

**Оценка трудозатрат:** 6-8 недель

---

#### 1.2 Ручная загрузка шаблонов

**Требование клиента:**
> Возможность вручную загружать шаблоны документов в систему с указанием связи с нормативными актами.

**Текущее состояние:** ⚠️ **ЧАСТИЧНО РЕАЛИЗОВАНО (30%)**

**Что есть:**
- ✅ Загрузка файлов через Supabase Storage
- ✅ Таблица `evidence` для хранения документов
- ✅ UI компонент `UploadDocumentDialog`

**Что отсутствует:**
- ❌ Концепция "шаблона" как отдельной сущности
- ❌ Связь шаблонов с нормативными актами
- ❌ Метаданные шаблонов (категория, применимость, обязательность)
- ❌ Валидация формата шаблонов

**Как реализовать:**
\`\`\`sql
-- Добавить таблицу для шаблонов
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'policy', 'procedure', 'instruction', 'form'
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  version TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  applicability_conditions JSONB, -- Условия применимости
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь шаблонов с requirements
CREATE TABLE template_requirements (
  template_id UUID REFERENCES document_templates(id),
  requirement_id UUID REFERENCES requirements(id),
  PRIMARY KEY (template_id, requirement_id)
);
\`\`\`

\`\`\`typescript
// Сервис для работы с шаблонами
class DocumentTemplateService {
  static async uploadTemplate(
    ctx: ExecutionContext,
    data: {
      file: File
      title: string
      description?: string
      category: string
      regulatoryFrameworkId?: string
      requirementIds?: string[]
      isMandatory?: boolean
      applicabilityConditions?: Record<string, any>
    }
  ): Promise<DocumentTemplate> {
    // 1. Загрузить файл в storage
    const filePath = await StorageService.upload(ctx, data.file, 'templates')
    
    // 2. Извлечь метаданные из файла (если DOCX/PDF)
    const metadata = await extractTemplateMetadata(data.file)
    
    // 3. Создать запись шаблона
    const template = await db.documentTemplates.create({
      ...data,
      filePath,
      metadata
    })
    
    // 4. Связать с requirements
    if (data.requirementIds) {
      await db.templateRequirements.createMany(
        data.requirementIds.map(reqId => ({
          templateId: template.id,
          requirementId: reqId
        }))
      )
    }
    
    return template
  }
}
\`\`\`

**Ограничения:**
- ⚠️ Нет автоматической валидации структуры шаблонов
- ⚠️ Требуется ручное указание связей с requirements
- ⚠️ Нет проверки на дубликаты шаблонов

**Оценка трудозатрат:** 2-3 недели

---

#### 1.3 Версионность и журнал изменений шаблонов

**Требование клиента:**
> Хранение всех версий шаблонов с возможностью отката и просмотра истории изменений.

**Текущее состояние:** ✅ **РЕАЛИЗОВАНО (80%)**

**Что есть:**
- ✅ Таблица `document_versions` для версионирования
- ✅ DocumentVersionService для управления версиями
- ✅ UI компонент `DocumentVersionsView` для отображения истории

**Что отсутствует:**
- ❌ Автоматическое создание версии при изменении шаблона
- ❌ Rollback функционал в UI
- ❌ Сравнение версий шаблонов (diff)

**Как доработать:**
\`\`\`typescript
class DocumentTemplateService {
  static async updateTemplate(
    ctx: ExecutionContext,
    templateId: string,
    updates: Partial<DocumentTemplate>,
    newFile?: File
  ): Promise<DocumentTemplate> {
    // 1. Получить текущую версию
    const currentTemplate = await db.documentTemplates.findById(templateId)
    
    // 2. Создать новую версию ПЕРЕД обновлением
    await DocumentVersionService.create(ctx, {
      documentId: templateId,
      versionNumber: currentTemplate.version + 1,
      filePath: newFile ? await StorageService.upload(ctx, newFile) : currentTemplate.filePath,
      changeDescription: updates.changeDescription || 'Обновление шаблона',
      createdBy: ctx.userId
    })
    
    // 3. Обновить текущую версию
    return await db.documentTemplates.update(templateId, updates)
  }
  
  static async rollbackTemplate(
    ctx: ExecutionContext,
    templateId: string,
    targetVersionId: string
  ): Promise<DocumentTemplate> {
    // 1. Получить целевую версию
    const targetVersion = await DocumentVersionService.getById(ctx, targetVersionId)
    
    // 2. Создать новую версию с содержимым целевой
    await DocumentVersionService.create(ctx, {
      documentId: templateId,
      filePath: targetVersion.filePath,
      changeDescription: `Откат к версии ${targetVersion.versionNumber}`,
      createdBy: ctx.userId
    })
    
    // 3. Обновить текущий шаблон
    return await db.documentTemplates.update(templateId, {
      filePath: targetVersion.filePath,
      version: targetVersion.versionNumber
    })
  }
}
\`\`\`

**Ограничения:**
- ⚠️ Нет автоматического определения "значимых" изменений
- ⚠️ Rollback не отменяет связанные изменения в документах

**Оценка трудозатрат:** 1-2 недели

---

### 2. Подсветка изменений и комментарии

#### 2.1 Сравнение версий документов с визуальным выделением

**Требование клиента:**
> Визуальное сравнение двух версий документа с подсветкой добавленного (зелёный), удалённого (красный) и изменённого (жёлтый) текста.

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО (только placeholder)**

**Что есть:**
- ✅ Таблица `document_diffs` для хранения diff
- ✅ UI компонент `DocumentDiffView` для отображения
- ✅ API endpoint `/api/documents/[id]/diff`
- ✅ DocumentDiffService

**Что НЕ работает:**
\`\`\`typescript
// services/document-diff-service.ts, строка 31
// TODO: Implement actual diff logic using diff-match-patch or similar
// For now, create a placeholder diff
const diffChanges: DiffChange[] = [
  {
    type: "add",
    lineNumber: 1,
    content: "New content added", // ❌ PLACEHOLDER!
  },
]
\`\`\`

**Реальная реализация:**
\`\`\`typescript
import * as Diff from 'diff' // npm install diff
import mammoth from 'mammoth' // npm install mammoth - для DOCX
import pdfParse from 'pdf-parse' // npm install pdf-parse - для PDF

class DocumentDiffService {
  static async generateDiff(
    ctx: ExecutionContext,
    documentId: string,
    fromVersionId: string | null,
    toVersionId: string,
    diffType: 'text' | 'visual' | 'semantic' = 'text'
  ): Promise<DocumentDiff> {
    // 1. Получить версии документов
    const toVersion = await DocumentVersionService.getById(ctx, toVersionId)
    const fromVersion = fromVersionId 
      ? await DocumentVersionService.getById(ctx, fromVersionId)
      : null
    
    // 2. Извлечь текст из файлов
    const toText = await this.extractText(toVersion.filePath, toVersion.mimeType)
    const fromText = fromVersion 
      ? await this.extractText(fromVersion.filePath, fromVersion.mimeType)
      : ''
    
    // 3. Выполнить diff в зависимости от типа
    let diffResult: DiffChange[]
    
    if (diffType === 'text') {
      // Построчное сравнение
      diffResult = this.generateTextDiff(fromText, toText)
    } else if (diffType === 'visual') {
      // Визуальное сравнение с HTML
      diffResult = this.generateVisualDiff(fromText, toText)
    } else {
      // Семантическое сравнение через LLM
      diffResult = await this.generateSemanticDiff(ctx, fromText, toText)
    }
    
    // 4. Сохранить diff в БД
    return await db.documentDiffs.create({
      documentId,
      fromVersionId,
      toVersionId,
      diffType,
      diffData: diffResult,
      additionsCount: diffResult.filter(c => c.type === 'add').length,
      deletionsCount: diffResult.filter(c => c.type === 'delete').length,
      modificationsCount: diffResult.filter(c => c.type === 'modify').length
    })
  }
  
  private static async extractText(filePath: string, mimeType: string): Promise<string> {
    // Скачать файл из storage
    const fileBuffer = await StorageService.download(filePath)
    
    if (mimeType === 'application/pdf') {
      const pdfData = await pdfParse(fileBuffer)
      return pdfData.text
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      return result.value
    } else if (mimeType === 'text/plain') {
      return fileBuffer.toString('utf-8')
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`)
    }
  }
  
  private static generateTextDiff(oldText: string, newText: string): DiffChange[] {
    const changes: DiffChange[] = []
    const diff = Diff.diffLines(oldText, newText)
    
    let lineNumber = 1
    diff.forEach(part => {
      if (part.added) {
        changes.push({
          type: 'add',
          lineNumber,
          content: part.value,
          newContent: part.value
        })
      } else if (part.removed) {
        changes.push({
          type: 'delete',
          lineNumber,
          content: part.value,
          oldContent: part.value
        })
      } else {
        // Unchanged - можно пропустить или добавить для контекста
      }
      lineNumber += part.count || 0
    })
    
    return changes
  }
  
  private static generateVisualDiff(oldText: string, newText: string): DiffChange[] {
    // Использовать diff-match-patch для визуального diff
    const dmp = new DiffMatchPatch()
    const diffs = dmp.diff_main(oldText, newText)
    dmp.diff_cleanupSemantic(diffs)
    
    // Конвертировать в HTML с подсветкой
    const diffHtml = dmp.diff_prettyHtml(diffs)
    
    return [{
      type: 'modify',
      lineNumber: 0,
      content: diffHtml,
      isHtml: true
    }]
  }
  
  private static async generateSemanticDiff(
    ctx: ExecutionContext,
    oldText: string,
    newText: string
  ): Promise<DiffChange[]> {
    // Использовать LLM для семантического анализа изменений
    const llm = LLMFactory.create('openai')
    
    const prompt = `Сравни два текста и выдели СЕМАНТИЧЕСКИЕ изменения (не просто текстовые).
    
Старый текст:
${oldText}

Новый текст:
${newText}

Верни JSON массив изменений:
[
  {
    "type": "add|delete|modify",
    "section": "Название раздела",
    "description": "Что изменилось по смыслу",
    "severity": "low|medium|high"
  }
]`
    
    const result = await llm.generateText({ prompt })
    return JSON.parse(result.text)
  }
}
\`\`\`

**Ограничения:**
- ⚠️ Извлечение текста из PDF может быть неточным (особенно для сканов)
- ⚠️ DOCX с таблицами и изображениями могут терять форматирование
- ⚠️ Семантический diff требует LLM и может быть медленным/дорогим
- ⚠️ Большие документы (>100 страниц) могут вызывать проблемы с производительностью

**Оценка трудозатрат:** 3-4 недели

---

#### 2.2 Отображение источников изменений

**Требование клиента:**
> Для каждого изменения указывать источник (какой нормативный акт или требование вызвало изменение).

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО**

**Как реализовать:**
\`\`\`sql
-- Добавить поля в document_diffs
ALTER TABLE document_diffs ADD COLUMN change_sources JSONB;

-- Структура change_sources:
{
  "changes": [
    {
      "changeId": "uuid",
      "sources": [
        {
          "type": "regulatory_framework",
          "id": "uuid",
          "title": "ФСТЭК Приказ №17",
          "section": "п. 5.3.2",
          "changeDate": "2024-12-01"
        },
        {
          "type": "requirement",
          "id": "uuid",
          "code": "REQ-001",
          "title": "Требование к аудиту"
        }
      ]
    }
  ]
}
\`\`\`

\`\`\`typescript
class ChangeSourceTrackingService {
  static async trackChangeSource(
    ctx: ExecutionContext,
    diffId: string,
    changeId: string,
    source: {
      type: 'regulatory_framework' | 'requirement' | 'manual'
      id?: string
      description: string
    }
  ): Promise<void> {
    const diff = await db.documentDiffs.findById(diffId)
    
    const changeSources = diff.changeSources || { changes: [] }
    const changeEntry = changeSources.changes.find(c => c.changeId === changeId)
    
    if (changeEntry) {
      changeEntry.sources.push(source)
    } else {
      changeSources.changes.push({
        changeId,
        sources: [source]
      })
    }
    
    await db.documentDiffs.update(diffId, { changeSources })
  }
}
\`\`\`

**Ограничения:**
- ⚠️ Требует ручного указания источников (автоматическое определение сложно)
- ⚠️ Нужна интеграция с системой мониторинга нормативов

**Оценка трудозатрат:** 2-3 недели

---

#### 2.3 Комментарии к изменениям

**Требование клиента:**
> Возможность добавлять комментарии к конкретным изменениям для обсуждения в команде.

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО**

**Как реализовать:**
\`\`\`sql
CREATE TABLE diff_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  diff_id UUID REFERENCES document_diffs(id),
  change_id TEXT NOT NULL, -- ID конкретного изменения в diff
  user_id UUID REFERENCES users(id),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'resolved', 'rejected'
  parent_comment_id UUID REFERENCES diff_comments(id), -- Для вложенных комментариев
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diff_comments_diff ON diff_comments(diff_id);
CREATE INDEX idx_diff_comments_change ON diff_comments(change_id);
\`\`\`

\`\`\`typescript
class DiffCommentService {
  static async addComment(
    ctx: ExecutionContext,
    data: {
      diffId: string
      changeId: string
      comment: string
      parentCommentId?: string
    }
  ): Promise<DiffComment> {
    ctx.access.require('diff_comments', 'create')
    
    const comment = await db.diffComments.create({
      ...data,
      tenantId: ctx.tenantId,
      userId: ctx.userId
    })
    
    // Уведомить участников обсуждения
    await NotificationService.notifyDiffComment(ctx, comment)
    
    return comment
  }
  
  static async resolveComment(
    ctx: ExecutionContext,
    commentId: string
  ): Promise<void> {
    ctx.access.require('diff_comments', 'update')
    
    await db.diffComments.update(commentId, {
      status: 'resolved',
      resolvedBy: ctx.userId,
      resolvedAt: new Date()
    })
  }
}
\`\`\`

**UI компонент:**
\`\`\`tsx
function DiffChangeWithComments({ change, diffId }: Props) {
  const [comments, setComments] = useState<DiffComment[]>([])
  const [newComment, setNewComment] = useState('')
  
  const handleAddComment = async () => {
    await fetch(`/api/diffs/${diffId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        changeId: change.id,
        comment: newComment
      })
    })
    setNewComment('')
    // Reload comments
  }
  
  return (
    <div className="border-l-4 border-blue-500 pl-4">
      {/* Отображение изменения */}
      <DiffChange change={change} />
      
      {/* Комментарии */}
      <div className="mt-4 space-y-2">
        {comments.map(comment => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
        
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Добавить комментарий..."
        />
        <Button onClick={handleAddComment}>Отправить</Button>
      </div>
    </div>
  )
}
\`\`\`

**Ограничения:**
- ⚠️ Нужна система уведомлений (email, in-app)
- ⚠️ Требуется модерация комментариев

**Оценка трудозатрат:** 2 недели

---

### 3. Актуализация уникальных документов

#### 3.1 Применение обновлений к кастомизированным документам

**Требование клиента:**
> При обновлении шаблона система должна предлагать применить изменения к документам, созданным на основе этого шаблона, с учётом кастомизации.

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО**

**Архитектура решения:**
\`\`\`sql
-- Связь документов с шаблонами
CREATE TABLE document_template_links (
  document_id UUID REFERENCES evidence(id),
  template_id UUID REFERENCES document_templates(id),
  template_version TEXT, -- Версия шаблона, на основе которой создан документ
  customizations JSONB, -- Какие части документа кастомизированы
  last_sync_at TIMESTAMPTZ, -- Когда последний раз синхронизировали с шаблоном
  PRIMARY KEY (document_id, template_id)
);

-- Предложения по обновлению
CREATE TABLE document_update_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  document_id UUID REFERENCES evidence(id),
  template_id UUID REFERENCES document_templates(id),
  from_template_version TEXT,
  to_template_version TEXT,
  proposed_changes JSONB, -- Какие изменения предлагаются
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'partially_accepted'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

\`\`\`typescript
class DocumentActualizationService {
  static async proposeUpdates(
    ctx: ExecutionContext,
    templateId: string,
    newTemplateVersion: string
  ): Promise<DocumentUpdateProposal[]> {
    // 1. Найти все документы, созданные на основе этого шаблона
    const linkedDocuments = await db.documentTemplateLinks.findByTemplate(templateId)
    
    const proposals: DocumentUpdateProposal[] = []
    
    for (const link of linkedDocuments) {
      // 2. Сравнить старую и новую версию шаблона
      const templateDiff = await DocumentDiffService.generateDiff(
        ctx,
        templateId,
        link.templateVersion,
        newTemplateVersion
      )
      
      // 3. Определить, какие изменения можно применить автоматически
      const applicableChanges = await this.analyzeApplicability(
        ctx,
        link.document,
        link.customizations,
        templateDiff
      )
      
      // 4. Создать предложение по обновлению
      const proposal = await db.documentUpdateProposals.create({
        tenantId: ctx.tenantId,
        documentId: link.documentId,
        templateId,
        fromTemplateVersion: link.templateVersion,
        toTemplateVersion: newTemplateVersion,
        proposedChanges: applicableChanges
      })
      
      proposals.push(proposal)
    }
    
    // 5. Уведомить ответственных
    await NotificationService.notifyDocumentUpdates(ctx, proposals)
    
    return proposals
  }
  
  private static async analyzeApplicability(
    ctx: ExecutionContext,
    document: Evidence,
    customizations: any,
    templateDiff: DocumentDiff
  ): Promise<any> {
    // Использовать LLM для анализа применимости изменений
    const llm = LLMFactory.create('openai')
    
    const prompt = `Проанализируй, какие изменения из шаблона можно применить к кастомизированному документу.

Изменения в шаблоне:
${JSON.stringify(templateDiff.diffData, null, 2)}

Кастомизации в документе:
${JSON.stringify(customizations, null, 2)}

Верни JSON:
{
  "autoApplicable": [/* изменения, которые можно применить автоматически */],
  "requiresReview": [/* изменения, требующие ручной проверки */],
  "conflicts": [/* изменения, конфликтующие с кастомизацией */]
}`
    
    const result = await llm.generateText({ prompt })
    return JSON.parse(result.text)
  }
  
  static async applyUpdate(
    ctx: ExecutionContext,
    proposalId: string,
    acceptedChanges: string[] // IDs изменений, которые пользователь принял
  ): Promise<Evidence> {
    const proposal = await db.documentUpdateProposals.findById(proposalId)
    
    // 1. Получить текущий документ
    const document = await db.evidence.findById(proposal.documentId)
    const documentText = await this.extractText(document.storagePath)
    
    // 2. Применить принятые изменения
    let updatedText = documentText
    for (const changeId of acceptedChanges) {
      const change = proposal.proposedChanges.find(c => c.id === changeId)
      updatedText = this.applyChange(updatedText, change)
    }
    
    // 3. Создать новую версию документа
    const newVersion = await DocumentVersionService.create(ctx, {
      documentId: proposal.documentId,
      content: updatedText,
      changeDescription: `Применены обновления из шаблона ${proposal.toTemplateVersion}`
    })
    
    // 4. Обновить связь с шаблоном
    await db.documentTemplateLinks.update({
      documentId: proposal.documentId,
      templateId: proposal.templateId
    }, {
      templateVersion: proposal.toTemplateVersion,
      lastSyncAt: new Date()
    })
    
    // 5. Обновить статус предложения
    await db.documentUpdateProposals.update(proposalId, {
      status: acceptedChanges.length === proposal.proposedChanges.length 
        ? 'accepted' 
        : 'partially_accepted',
      reviewedBy: ctx.userId,
      reviewedAt: new Date()
    })
    
    return document
  }
}
\`\`\`

**UI компонент:**
\`\`\`tsx
function DocumentUpdateProposalView({ proposalId }: Props) {
  const { data: proposal } = useSWR(`/api/proposals/${proposalId}`)
  const [selectedChanges, setSelectedChanges] = useState<string[]>([])
  
  const handleApply = async () => {
    await fetch(`/api/proposals/${proposalId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ acceptedChanges: selectedChanges })
    })
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Предложение по обновлению документа</CardTitle>
          <CardDescription>
            Шаблон обновлён с версии {proposal.fromTemplateVersion} до {proposal.toTemplateVersion}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="space-y-4">
        {proposal.proposedChanges.autoApplicable.map(change => (
          <ChangeCard
            key={change.id}
            change={change}
            type="auto"
            selected={selectedChanges.includes(change.id)}
            onToggle={() => toggleChange(change.id)}
          />
        ))}
        
        {proposal.proposedChanges.requiresReview.map(change => (
          <ChangeCard
            key={change.id}
            change={change}
            type="review"
            selected={selectedChanges.includes(change.id)}
            onToggle={() => toggleChange(change.id)}
          />
        ))}
        
        {proposal.proposedChanges.conflicts.map(change => (
          <ChangeCard
            key={change.id}
            change={change}
            type="conflict"
            disabled
          />
        ))}
      </div>
      
      <div className="flex gap-4">
        <Button onClick={handleApply}>
          Применить выбранные изменения
        </Button>
        <Button variant="outline" onClick={() => rejectProposal()}>
          Отклонить все
        </Button>
      </div>
    </div>
  )
}
\`\`\`

**Ограничения:**
- ⚠️ Автоматическое применение изменений может быть неточным
- ⚠️ Требуется ручная проверка критичных изменений
- ⚠️ Конфликты кастомизации могут быть сложными для разрешения
- ⚠️ LLM-анализ может быть дорогим для большого количества документов

**Оценка трудозатрат:** 4-5 недель

---

#### 3.2 Гибкое редактирование с утверждением/отклонением

**Требование клиента:**
> Пользователь может принять, отклонить или изменить каждое предложенное изменение.

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО**

**Реализация:** См. UI компонент выше в разделе 3.1

**Дополнительно:**
\`\`\`typescript
class DocumentUpdateProposalService {
  static async modifyChange(
    ctx: ExecutionContext,
    proposalId: string,
    changeId: string,
    modifiedContent: string
  ): Promise<void> {
    const proposal = await db.documentUpdateProposals.findById(proposalId)
    
    // Найти изменение и обновить его
    const change = proposal.proposedChanges.find(c => c.id === changeId)
    if (!change) throw new Error('Change not found')
    
    change.modifiedContent = modifiedContent
    change.status = 'modified'
    
    await db.documentUpdateProposals.update(proposalId, {
      proposedChanges: proposal.proposedChanges
    })
    
    // Логировать модификацию
    await ctx.audit.log('proposal_change_modified', {
      proposalId,
      changeId,
      originalContent: change.content,
      modifiedContent
    })
  }
}
\`\`\`

**Оценка трудозатрат:** Включено в 3.1

---

#### 3.3 Аналитика актуальности документов

**Требование клиента:**
> Дашборд с информацией о том, какие документы устарели и требуют обновления.

**Текущее состояние:** ⚠️ **ЧАСТИЧНО РЕАЛИЗОВАНО (20%)**

**Что есть:**
- ✅ Базовая аналитика в `/app/(dashboard)/reports/page.tsx`
- ✅ Таблица `compliance_records` для отслеживания статусов

**Что отсутствует:**
- ❌ Специфичная аналитика для документов
- ❌ Определение "устаревших" документов
- ❌ Приоритизация обновлений

**Как реализовать:**
\`\`\`typescript
class DocumentActualityAnalyticsService {
  static async getActualityDashboard(
    ctx: ExecutionContext
  ): Promise<ActualityDashboard> {
    // 1. Документы с устаревшими шаблонами
    const outdatedByTemplate = await db.query(`
      SELECT 
        d.id,
        d.title,
        dtl.template_version as current_version,
        dt.version as latest_version,
        dt.updated_at as template_updated_at,
        EXTRACT(EPOCH FROM (NOW() - dtl.last_sync_at)) / 86400 as days_since_sync
      FROM evidence d
      JOIN document_template_links dtl ON d.id = dtl.document_id
      JOIN document_templates dt ON dtl.template_id = dt.id
      WHERE dtl.template_version != dt.version
        AND d.tenant_id = $1
      ORDER BY days_since_sync DESC
    `, [ctx.tenantId])
    
    // 2. Документы с истекшим сроком действия
    const expired = await db.query(`
      SELECT id, title, expires_at
      FROM evidence
      WHERE tenant_id = $1
        AND expires_at < NOW()
        AND document_status != 'archived'
    `, [ctx.tenantId])
    
    // 3. Документы без обновлений более N дней
    const stale = await db.query(`
      SELECT 
        id, 
        title, 
        updated_at,
        EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400 as days_since_update
      FROM evidence
      WHERE tenant_id = $1
        AND updated_at < NOW() - INTERVAL '180 days'
        AND document_status = 'active'
      ORDER BY days_since_update DESC
    `, [ctx.tenantId])
    
    // 4. Документы с непримененными предложениями
    const pendingProposals = await db.query(`
      SELECT 
        d.id,
        d.title,
        COUNT(dup.id) as pending_proposals_count
      FROM evidence d
      JOIN document_update_proposals dup ON d.id = dup.document_id
      WHERE d.tenant_id = $1
        AND dup.status = 'pending'
      GROUP BY d.id, d.title
      ORDER BY pending_proposals_count DESC
    `, [ctx.tenantId])
    
    return {
      outdatedByTemplate,
      expired,
      stale,
      pendingProposals,
      summary: {
        totalDocuments: await db.evidence.count({ tenantId: ctx.tenantId }),
        outdatedCount: outdatedByTemplate.length,
        expiredCount: expired.length,
        staleCount: stale.length,
        pendingProposalsCount: pendingProposals.reduce((sum, d) => sum + d.pending_proposals_count, 0)
      }
    }
  }
}
\`\`\`

**UI компонент:**
\`\`\`tsx
function DocumentActualityDashboard() {
  const { data: analytics } = useSWR('/api/analytics/document-actuality')
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Устаревшие шаблоны</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {analytics.summary.outdatedCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Истёк срок действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {analytics.summary.expiredCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Давно не обновлялись</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {analytics.summary.staleCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ожидают обновления</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {analytics.summary.pendingProposalsCount}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Lists */}
      <Tabs defaultValue="outdated">
        <TabsList>
          <TabsTrigger value="outdated">Устаревшие шаблоны</TabsTrigger>
          <TabsTrigger value="expired">Истёк срок</TabsTrigger>
          <TabsTrigger value="stale">Давно не обновлялись</TabsTrigger>
          <TabsTrigger value="proposals">Предложения</TabsTrigger>
        </TabsList>
        
        <TabsContent value="outdated">
          <DocumentList documents={analytics.outdatedByTemplate} />
        </TabsContent>
        
        {/* ... другие табы */}
      </Tabs>
    </div>
  )
}
\`\`\`

**Ограничения:**
- ⚠️ Определение "устаревшего" документа может быть субъективным
- ⚠️ Требуется настройка пороговых значений (сколько дней = устаревший)

**Оценка трудозатрат:** 2-3 недели

---

### 4. Защита ДСП (Для служебного пользования)

**Требование клиента:**
> Работа с документами категории ДСП в защищённом контуре с ограниченным доступом.

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО**

**Что есть:**
- ✅ RBAC система для контроля доступа
- ✅ Audit logging для отслеживания действий

**Что отсутствует:**
- ❌ Классификация документов по уровню конфиденциальности
- ❌ Защищённый контур для ДСП
- ❌ Водяные знаки на документах
- ❌ Запрет на скачивание/печать для ДСП

**Как реализовать:**
\`\`\`sql
-- Добавить классификацию документов
CREATE TYPE document_classification AS ENUM (
  'public',           -- Публичный
  'internal',         -- Внутренний
  'confidential',     -- Конфиденциальный
  'dsp',             -- Для служебного пользования
  'secret'           -- Секретный (если требуется)
);

ALTER TABLE evidence ADD COLUMN classification document_classification DEFAULT 'internal';
ALTER TABLE evidence ADD COLUMN classification_reason TEXT;
ALTER TABLE evidence ADD COLUMN classified_by UUID REFERENCES users(id);
ALTER TABLE evidence ADD COLUMN classified_at TIMESTAMPTZ;

-- Таблица для отслеживания доступа к ДСП
CREATE TABLE dsp_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  document_id UUID REFERENCES evidence(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'view', 'download', 'print'
  ip_address INET,
  user_agent TEXT,
  access_granted BOOLEAN,
  denial_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dsp_access_log_document ON dsp_access_log(document_id);
CREATE INDEX idx_dsp_access_log_user ON dsp_access_log(user_id);
\`\`\`

\`\`\`typescript
class DSPProtectionService {
  static async classifyDocument(
    ctx: ExecutionContext,
    documentId: string,
    classification: DocumentClassification,
    reason: string
  ): Promise<void> {
    // Только определённые роли могут классифицировать документы
    ctx.access.require('documents', 'classify')
    
    await db.evidence.update(documentId, {
      classification,
      classificationReason: reason,
      classifiedBy: ctx.userId,
      classifiedAt: new Date()
    })
    
    await ctx.audit.log('document_classified', {
      documentId,
      classification,
      reason
    })
    
    // Если документ стал ДСП, ограничить доступ
    if (classification === 'dsp' || classification === 'secret') {
      await this.restrictAccess(ctx, documentId)
    }
  }
  
  static async checkDSPAccess(
    ctx: ExecutionContext,
    documentId: string,
    action: 'view' | 'download' | 'print'
  ): Promise<boolean> {
    const document = await db.evidence.findById(documentId)
    
    if (document.classification !== 'dsp' && document.classification !== 'secret') {
      return true // Не ДСП, доступ разрешён
    }
    
    // Проверить права доступа к ДСП
    const hasAccess = await this.checkDSPPermission(ctx, document, action)
    
    // Логировать попытку доступа
    await db.dspAccessLog.create({
      tenantId: ctx.tenantId,
      documentId,
      userId: ctx.userId,
      action,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      accessGranted: hasAccess,
      denialReason: hasAccess ? null : 'Insufficient permissions'
    })
    
    return hasAccess
  }
  
  private static async checkDSPPermission(
    ctx: ExecutionContext,
    document: Evidence,
    action: string
  ): Promise<boolean> {
    // 1. Проверить роль пользователя
    const userRole = await db.users.getRole(ctx.userId)
    const allowedRoles = ['security_officer', 'compliance_manager', 'admin']
    
    if (!allowedRoles.includes(userRole)) {
      return false
    }
    
    // 2. Проверить явное разрешение на доступ к ДСП
    const hasDSPPermission = await ctx.access.check('dsp_documents', action)
    if (!hasDSPPermission) {
      return false
    }
    
    // 3. Для скачивания и печати - дополнительная проверка
    if (action === 'download' || action === 'print') {
      const hasExplicitPermission = await db.dspPermissions.check({
        userId: ctx.userId,
        documentId: document.id,
        action
      })
      
      return hasExplicitPermission
    }
    
    return true
  }
  
  static async addWatermark(
    ctx: ExecutionContext,
    documentId: string
  ): Promise<string> {
    const document = await db.evidence.findById(documentId)
    
    // Скачать оригинальный файл
    const originalFile = await StorageService.download(document.storagePath)
    
    // Добавить водяной знак
    const watermarkedFile = await this.applyWatermark(originalFile, {
      text: `ДСП - ${ctx.user.fullName} - ${new Date().toISOString()}`,
      classification: document.classification
    })
    
    // Сохранить временный файл с водяным знаком
    const tempPath = await StorageService.uploadTemp(watermarkedFile)
    
    return tempPath
  }
  
  private static async applyWatermark(
    file: Buffer,
    options: { text: string; classification: string }
  ): Promise<Buffer> {
    // Использовать библиотеку для добавления водяных знаков
    // Например, pdf-lib для PDF или sharp для изображений
    
    if (file.toString().startsWith('%PDF')) {
      // PDF файл
      const { PDFDocument, rgb } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.load(file)
      const pages = pdfDoc.getPages()
      
      for (const page of pages) {
        const { width, height } = page.getSize()
        page.drawText(options.text, {
          x: 50,
          y: height - 50,
          size: 12,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.5
        })
      }
      
      return Buffer.from(await pdfDoc.save())
    } else {
      // Изображение
      const sharp = await import('sharp')
      return await sharp(file)
        .composite([{
          input: Buffer.from(`<svg><text x="10" y="20">${options.text}</text></svg>`),
          gravity: 'northwest'
        }])
        .toBuffer()
    }
  }
}
\`\`\`

**UI компонент:**
\`\`\`tsx
function DSPDocumentViewer({ documentId }: Props) {
  const { data: document } = useSWR(`/api/documents/${documentId}`)
  const [accessGranted, setAccessGranted] = useState(false)
  
  useEffect(() => {
    // Проверить доступ при загрузке
    checkAccess()
  }, [documentId])
  
  const checkAccess = async () => {
    const response = await fetch(`/api/documents/${documentId}/check-dsp-access`)
    const { granted } = await response.json()
    setAccessGranted(granted)
  }
  
  const handleDownload = async () => {
    // Скачать файл с водяным знаком
    const response = await fetch(`/api/documents/${documentId}/download-dsp`)
    const blob = await response.blob()
    
    // Сохранить файл
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${document.title}_DSP.pdf`
    a.click()
  }
  
  if (!accessGranted) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Доступ запрещён</h3>
          <p className="text-muted-foreground">
            У вас нет прав для просмотра документов категории ДСП
          </p>
        </div>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Предупреждение о ДСП */}
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Документ категории ДСП</AlertTitle>
        <AlertDescription>
          Этот документ содержит информацию для служебного пользования. 
          Все действия с документом логируются.
        </AlertDescription>
      </Alert>
      
      {/* Просмотр документа с водяным знаком */}
      <Card>
        <CardContent className="p-0">
          <DocumentPreview 
            documentId={documentId} 
            watermark={`ДСП - ${user.fullName}`}
          />
        </CardContent>
      </Card>
      
      {/* Действия */}
      <div className="flex gap-4">
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Скачать с водяным знаком
        </Button>
        
        {/* Печать запрещена для ДСП */}
        <Button disabled variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Печать запрещена
        </Button>
      </div>
    </div>
  )
}
\`\`\`

**Ограничения:**
- ⚠️ Водяные знаки можно удалить с помощью специальных инструментов
- ⚠️ Нельзя полностью запретить скриншоты экрана
- ⚠️ Требуется физическая защита серверов для "защищённого контура"
- ⚠️ Нужна сертификация ФСТЭК для работы с реальными ДСП документами

**Оценка трудозатрат:** 4-5 недель

---

### 5. AI-анализ изменений

**Требование клиента:**
> Использование LLM для анализа изменений в документах и оценки их влияния на соответствие требованиям.

**Текущее состояние:** ⚠️ **ЧАСТИЧНО РЕАЛИЗОВАНО (60%)**

**Что есть:**
- ✅ DocumentAnalysisService с интеграцией OpenAI/Anthropic
- ✅ LLM провайдеры (OpenAI, Anthropic)
- ✅ Таблица `document_analyses` для хранения результатов
- ✅ API endpoint `/api/documents/[id]/analyze`

**Что НЕ работает:**
\`\`\`typescript
// services/document-analysis-service.ts, строка 48
// TODO: Extract text from documents (PDF, DOCX, etc.)
// For now, use placeholder content
const previousContent = fromVersion ? `Содержание версии ${fromVersion.versionNumber}` : undefined
const currentContent = `Содержание версии ${toVersion.versionNumber}`
\`\`\`

**Реальная реализация:**
\`\`\`typescript
class DocumentAnalysisService {
  static async analyzeDocument(
    ctx: ExecutionContext,
    documentId: string,
    fromVersionId: string | null,
    toVersionId: string,
    provider: LLMProviderType = 'openai'
  ): Promise<DocumentAnalysis> {
    // 1. Получить версии документов
    const toVersion = await DocumentVersionService.getById(ctx, toVersionId)
    const fromVersion = fromVersionId 
      ? await DocumentVersionService.getById(ctx, fromVersionId)
      : null
    
    // 2. Извлечь текст из файлов (РЕАЛЬНАЯ РЕАЛИЗАЦИЯ)
    const toText = await this.extractTextFromFile(toVersion.filePath, toVersion.mimeType)
    const fromText = fromVersion 
      ? await this.extractTextFromFile(fromVersion.filePath, fromVersion.mimeType)
      : null
    
    // 3. Получить контекст документа
    const document = await db.evidence.findById(documentId)
    const relatedRequirements = await db.requirements.findByDocument(documentId)
    
    // 4. Создать запись анализа
    const analysis = await db.documentAnalyses.create({
      documentId,
      fromVersionId,
      toVersionId,
      status: 'processing',
      llmProvider: provider,
      llmModel: provider === 'openai' ? 'gpt-4o' : 'claude-sonnet-4.5'
    })
    
    try {
      // 5. Выполнить AI-анализ
      const llm = LLMFactory.create(provider)
      
      const result = await llm.analyzeDocumentChanges({
        documentTitle: document.title || document.fileName,
        previousContent: fromText,
        currentContent: toText,
        context: this.buildAnalysisContext(document, relatedRequirements)
      })
      
      // 6. Обновить анализ с результатами
      await db.documentAnalyses.update(analysis.id, {
        status: 'completed',
        summary: result.summary,
        criticalChanges: result.criticalChanges,
        impactAssessment: result.impactAssessment,
        recommendations: result.recommendations,
        tokensUsed: result.tokensUsed,
        processingTimeMs: result.processingTimeMs,
        completedAt: new Date()
      })
      
      return await db.documentAnalyses.findById(analysis.id)
    } catch (error) {
      await db.documentAnalyses.update(analysis.id, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      })
      throw error
    }
  }
  
  private static async extractTextFromFile(
    filePath: string,
    mimeType: string
  ): Promise<string> {
    // Скачать файл из storage
    const fileBuffer = await StorageService.download(filePath)
    
    if (mimeType === 'application/pdf') {
      // Извлечь текст из PDF
      const pdfParse = await import('pdf-parse')
      const pdfData = await pdfParse(fileBuffer)
      return pdfData.text
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Извлечь текст из DOCX
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      return result.value
    } else if (mimeType === 'text/plain') {
      return fileBuffer.toString('utf-8')
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      // Извлечь текст из XLSX
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      let text = ''
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        text += XLSX.utils.sheet_to_txt(sheet) + '\n\n'
      })
      return text
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`)
    }
  }
  
  private static buildAnalysisContext(
    document: Evidence,
    requirements: Requirement[]
  ): string {
    let context = `Документ: ${document.title}\n`
    
    if (document.description) {
      context += `Описание: ${document.description}\n`
    }
    
    if (requirements.length > 0) {
      context += `\nСвязанные требования:\n`
      requirements.forEach(req => {
        context += `- ${req.code}: ${req.title}\n`
      })
    }
    
    return context
  }
}
\`\`\`

**Улучшенный промпт для LLM:**
\`\`\`typescript
private buildPrompt(params: {
  documentTitle: string
  previousContent?: string
  currentContent: string
  context?: string
}): string {
  const { documentTitle, previousContent, currentContent, context } = params

  let prompt = `Вы - эксперт по информационной безопасности и комплаенсу в России с глубокими знаниями:
- ФСТЭК: Приказы №17, №21, №31, №239
- ФСБ: Приказы №378, №66
- 152-ФЗ "О персональных данных"
- 187-ФЗ "О безопасности критической информационной инфраструктуры"

Проанализируйте изменения в документе "${documentTitle}".

${context ? `КОНТЕКСТ:\n${context}\n\n` : ""}`

  if (previousContent) {
    prompt += `ПРЕДЫДУЩАЯ ВЕРСИЯ (${previousContent.length} символов):\n${previousContent}\n\n`
    prompt += `ТЕКУЩАЯ ВЕРСИЯ (${currentContent.length} символов):\n${currentContent}\n\n`
    prompt += `Проанализируйте ИЗМЕНЕНИЯ между версиями.`
  } else {
    prompt += `СОДЕРЖАНИЕ ДОКУМЕНТА (${currentContent.length} символов):\n${currentContent}\n\n`
    prompt += `Это первая версия документа. Проанализируйте его содержание.`
  }

  prompt += `

ЗАДАЧА:
1. Определите ВСЕ изменения (добавления, удаления, модификации)
2. Оцените КРИТИЧНОСТЬ каждого изменения для соответствия требованиям ИБ
3. Определите ВЛИЯНИЕ изменений на:
   - Соответствие нормативным актам
   - Уровень защищённости
   - Риски информационной безопасности
4. Предоставьте КОНКРЕТНЫЕ рекомендации по действиям

ФОРМАТ ОТВЕТА (ТОЛЬКО валидный JSON):
{
  "summary": "Краткое описание изменений (2-3 предложения)",
  "criticalChanges": [
    {
      "type": "addition|deletion|modification",
      "section": "Название раздела документа",
      "description": "Подробное описание изменения",
      "severity": "low|medium|high|critical",
      "affectedRequirements": ["REQ-001", "REQ-002"],
      "regulatoryImpact": "Как это влияет на соответствие нормативам"
    }
  ],
  "impactAssessment": "Детальная оценка влияния изменений на соответствие требованиям ИБ (3-5 предложений)",
  "recommendations": [
    {
      "priority": "low|medium|high|critical",
      "action": "Конкретное действие, которое нужно выполнить",
      "deadline": "Рекомендуемый срок выполнения (например, '7 дней', '1 месяц')",
      "relatedDocuments": ["Список связанных документов, которые нужно обновить"],
      "rationale": "Почему это важно"
    }
  ],
  "riskAssessment": {
    "newRisks": ["Новые риски, появившиеся из-за изменений"],
    "mitigatedRisks": ["Риски, которые были снижены"],
    "overallRiskLevel": "low|medium|high|critical"
  }
}

ВАЖНО: Отвечайте ТОЛЬКО валидным JSON, без markdown форматирования и дополнительного текста.`

  return prompt
}
\`\`\`

**Ограничения:**
- ⚠️ Извлечение текста из PDF может быть неточным для сканов (нужен OCR)
- ⚠️ Большие документы (>100 страниц) могут превышать context window LLM
- ⚠️ Стоимость анализа через OpenAI/Anthropic может быть высокой
- ⚠️ LLM может "галлюцинировать" и давать неточные рекомендации

**Оценка трудозатрат:** 2-3 недели (для доработки извлечения текста)

---

### 6. Интеграция с 1С:Документооборот

**Требование клиента:**
> Двусторонняя синхронизация документов с 1С:Документооборот.

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО**

**Как реализовать:**
\`\`\`typescript
// Архитектура интеграции с 1С
class OneCIntegrationService {
  private apiUrl: string
  private apiKey: string
  
  constructor() {
    this.apiUrl = process.env.ONEC_API_URL!
    this.apiKey = process.env.ONEC_API_KEY!
  }
  
  // 1. Синхронизация документов из 1С в нашу систему
  async syncFromOneC(ctx: ExecutionContext): Promise<SyncResult> {
    // Получить список документов из 1С
    const oneCDocuments = await this.fetchDocumentsFromOneC()
    
    const results = {
      created: 0,
      updated: 0,
      errors: []
    }
    
    for (const oneCDoc of oneCDocuments) {
      try {
        // Проверить, существует ли документ в нашей системе
        const existing = await db.evidence.findByExternalId('1c', oneCDoc.id)
        
        if (existing) {
          // Обновить существующий документ
          await this.updateDocumentFromOneC(ctx, existing.id, oneCDoc)
          results.updated++
        } else {
          // Создать новый документ
          await this.createDocumentFromOneC(ctx, oneCDoc)
          results.created++
        }
      } catch (error) {
        results.errors.push({
          documentId: oneCDoc.id,
          error: error.message
        })
      }
    }
    
    return results
  }
  
  private async fetchDocumentsFromOneC(): Promise<OneCDocument[]> {
    // Вызов REST API 1С
    const response = await fetch(`${this.apiUrl}/documents`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`1C API error: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  private async createDocumentFromOneC(
    ctx: ExecutionContext,
    oneCDoc: OneCDocument
  ): Promise<Evidence> {
    // 1. Скачать файл из 1С
    const fileBuffer = await this.downloadFileFromOneC(oneCDoc.fileUrl)
    
    // 2. Загрузить файл в наш storage
    const filePath = await StorageService.uploadBuffer(
      ctx,
      fileBuffer,
      oneCDoc.fileName,
      'documents'
    )
    
    // 3. Создать документ в нашей системе
    const document = await db.evidence.create({
      tenantId: ctx.tenantId,
      title: oneCDoc.title,
      description: oneCDoc.description,
      fileName: oneCDoc.fileName,
      storagePath: filePath,
      fileSize: fileBuffer.length,
      mimeType: oneCDoc.mimeType,
      isDocument: true,
      externalSystem: '1c',
      externalId: oneCDoc.id,
      metadata: {
        oneCData: oneCDoc
      },
      createdBy: ctx.userId
    })
    
    await ctx.audit.log('document_synced_from_1c', {
      documentId: document.id,
      oneCId: oneCDoc.id
    })
    
    return document
  }
  
  // 2. Синхронизация документов из нашей системы в 1С
  async syncToOneC(
    ctx: ExecutionContext,
    documentId: string
  ): Promise<void> {
    const document = await db.evidence.findById(documentId)
    
    // Скачать файл из нашего storage
    const fileBuffer = await StorageService.download(document.storagePath)
    
    // Загрузить в 1С
    const oneCId = await this.uploadToOneC({
      title: document.title,
      description: document.description,
      fileName: document.fileName,
      fileBuffer,
      metadata: {
        sourceSystem: 'compliance-platform',
        sourceId: document.id
      }
    })
    
    // Сохранить связь с 1С
    await db.evidence.update(documentId, {
      externalSystem: '1c',
      externalId: oneCId
    })
    
    await ctx.audit.log('document_synced_to_1c', {
      documentId,
      oneCId
    })
  }
  
  private async uploadToOneC(data: {
    title: string
    description?: string
    fileName: string
    fileBuffer: Buffer
    metadata?: any
  }): Promise<string> {
    // Создать FormData для загрузки файла
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    formData.append('file', new Blob([data.fileBuffer]), data.fileName)
    if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata))
    
    const response = await fetch(`${this.apiUrl}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Failed to upload to 1C: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.id
  }
  
  // 3. Webhook для получения уведомлений от 1С
  async handleOneCWebhook(
    ctx: ExecutionContext,
    event: OneCWebhookEvent
  ): Promise<void> {
    switch (event.type) {
      case 'document.created':
        await this.createDocumentFromOneC(ctx, event.data)
        break
        
      case 'document.updated':
        const existing = await db.evidence.findByExternalId('1c', event.data.id)
        if (existing) {
          await this.updateDocumentFromOneC(ctx, existing.id, event.data)
        }
        break
        
      case 'document.deleted':
        const doc = await db.evidence.findByExternalId('1c', event.data.id)
        if (doc) {
          await db.evidence.update(doc.id, {
            documentStatus: 'archived',
            archivedAt: new Date()
          })
        }
        break
    }
  }
}
\`\`\`

**API endpoint для webhook:**
\`\`\`typescript
// app/api/integrations/1c/webhook/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валидация подписи webhook (для безопасности)
    const signature = request.headers.get('X-1C-Signature')
    if (!validateOneCSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const ctx = await createExecutionContext(request)
    const oneCService = new OneCIntegrationService()
    
    await oneCService.handleOneCWebhook(ctx, body)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[1C Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
\`\`\`

**Ограничения:**
- ⚠️ Требуется доступ к API 1С:Документооборот (может быть платным)
- ⚠️ Нужна настройка webhook в 1С (может требовать прав администратора)
- ⚠️ Конфликты при одновременном редактировании в обеих системах
- ⚠️ Различия в структуре метаданных между системами

**Оценка трудозатрат:** 4-6 недель

---

### 7. Модель угроз и управление инфраструктурой

**Требование клиента:**
> Автоматическое определение документов для актуализации при изменении инфраструктуры или модели угроз.

**Текущее состояние:** ❌ **НЕ РЕАЛИЗОВАНО**

**Что есть:**
- ✅ Таблица `risks` для управления рисками
- ✅ Базовая структура для requirements

**Что отсутствует:**
- ❌ Модель угроз (threat model)
- ❌ Инвентаризация инфраструктуры
- ❌ Связь документов с инфраструктурой и угрозами
- ❌ Автоматическое определение затронутых документов

**Как реализовать:**
\`\`\`sql
-- Модель угроз
CREATE TABLE threat_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  version TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  threat_model_id UUID REFERENCES threat_model(id),
  code TEXT NOT NULL, -- УБИ.001, УБИ.002 и т.д.
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'confidentiality', 'integrity', 'availability'
  severity TEXT, -- 'low', 'medium', 'high', 'critical'
  likelihood TEXT, -- 'low', 'medium', 'high'
  source TEXT, -- 'ФСТЭК БДУ', 'internal'
  is_relevant BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Инфраструктура
CREATE TABLE infrastructure_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'server', 'network', 'application', 'database'
  description TEXT,
  criticality TEXT, -- 'low', 'medium', 'high', 'critical'
  location TEXT,
  owner_id UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь угроз с активами
CREATE TABLE asset_threats (
  asset_id UUID REFERENCES infrastructure_assets(id),
  threat_id UUID REFERENCES threats(id),
  risk_level TEXT, -- 'low', 'medium', 'high', 'critical'
  mitigation_status TEXT, -- 'not_mitigated', 'partially_mitigated', 'fully_mitigated'
  PRIMARY KEY (asset_id, threat_id)
);

-- Связь документов с активами
CREATE TABLE document_assets (
  document_id UUID REFERENCES evidence(id),
  asset_id UUID REFERENCES infrastructure_assets(id),
  relevance TEXT, -- 'direct', 'indirect'
  PRIMARY KEY (document_id, asset_id)
);

-- Связь документов с угрозами
CREATE TABLE document_threats (
  document_id UUID REFERENCES evidence(id),
  threat_id UUID REFERENCES threats(id),
  addresses_threat BOOLEAN DEFAULT true,
  PRIMARY KEY (document_id, threat_id)
);
\`\`\`

\`\`\`typescript
class ThreatModelService {
  static async updateThreatModel(
    ctx: ExecutionContext,
    updates: {
      addedThreats?: Threat[]
      removedThreats?: string[]
      modifiedThreats?: Partial<Threat>[]
    }
  ): Promise<ImpactAnalysis> {
    // 1. Создать новую версию модели угроз
    const newThreatModel = await db.threatModel.create({
      tenantId: ctx.tenantId,
      version: this.generateVersion(),
      description: 'Обновление модели угроз',
      isActive: true
    })
    
    // 2. Деактивировать старую модель
    await db.threatModel.deactivateAll(ctx.tenantId)
    
    // 3. Применить изменения
    if (updates.addedThreats) {
      for (const threat of updates.addedThreats) {
        await db.threats.create({
          ...threat,
          tenantId: ctx.tenantId,
          threatModelId: newThreatModel.id
        })
      }
    }
    
    if (updates.removedThreats) {
      await db.threats.markIrrelevant(updates.removedThreats)
    }
    
    if (updates.modifiedThreats) {
      for (const threat of updates.modifiedThreats) {
        await db.threats.update(threat.id, threat)
      }
    }
    
    // 4. Определить затронутые документы
    const impactedDocuments = await this.findImpactedDocuments(ctx, updates)
    
    // 5. Создать задачи на актуализацию
    for (const doc of impactedDocuments) {
      await db.documentUpdateTasks.create({
        tenantId: ctx.tenantId,
        documentId: doc.id,
        reason: 'threat_model_update',
        priority: doc.priority,
        dueDate: this.calculateDueDate(doc.priority),
        assignedTo: doc.ownerId
      })
    }
    
    // 6. Уведомить ответственных
    await NotificationService.notifyThreatModelUpdate(ctx, impactedDocuments)
    
    return {
      newThreatModelId: newThreatModel.id,
      impactedDocumentsCount: impactedDocuments.length,
      impactedDocuments
    }
  }
  
  private static async findImpactedDocuments(
    ctx: ExecutionContext,
    updates: any
  ): Promise<ImpactedDocument[]> {
    const impacted: ImpactedDocument[] = []
    
    // Документы, связанные с добавленными угрозами
    if (updates.addedThreats) {
      for (const threat of updates.addedThreats) {
        // Найти активы, подверженные этой угрозе
        const vulnerableAssets = await db.infrastructureAssets.findVulnerableTo(threat)
        
        // Найти документы, связанные с этими активами
        for (const asset of vulnerableAssets) {
          const docs = await db.evidence.findByAsset(asset.id)
          impacted.push(...docs.map(doc => ({
            ...doc,
            reason: `Новая угроза ${threat.code}: ${threat.title}`,
            priority: threat.severity
          })))
        }
      }
    }
    
    // Документы, связанные с удалёнными угрозами
    if (updates.removedThreats) {
      const docs = await db.evidence.findByThreats(updates.removedThreats)
      impacted.push(...docs.map(doc => ({
        ...doc,
        reason: 'Угроза больше не актуальна',
        priority: 'low'
      })))
    }
    
    // Документы, связанные с изменёнными угрозами
    if (updates.modifiedThreats) {
      for (const threat of updates.modifiedThreats) {
        const docs = await db.evidence.findByThreat(threat.id)
        impacted.push(...docs.map(doc => ({
          ...doc,
          reason: `Изменение угрозы ${threat.code}`,
          priority: threat.severity
        })))
      }
    }
    
    // Удалить дубликаты
    return Array.from(new Map(impacted.map(doc => [doc.id, doc])).values())
  }
}

class InfrastructureService {
  static async updateInfrastructure(
    ctx: ExecutionContext,
    updates: {
      addedAssets?: InfrastructureAsset[]
      removedAssets?: string[]
      modifiedAssets?: Partial<InfrastructureAsset>[]
    }
  ): Promise<ImpactAnalysis> {
    // Аналогично ThreatModelService
    // 1. Применить изменения в инфраструктуре
    // 2. Определить затронутые документы
    // 3. Создать задачи на актуализацию
    // 4. Уведомить ответственных
  }
}
\`\`\`

**UI компонент:**
\`\`\`tsx
function ThreatModelUpdateImpactView({ threatModelId }: Props) {
  const { data: impact } = useSWR(`/api/threat-model/${threatModelId}/impact`)
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Анализ влияния изменений модели угроз</CardTitle>
          <CardDescription>
            Обновление модели угроз затронет {impact.impactedDocumentsCount} документов
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Документы, требующие актуализации</h3>
        
        {impact.impactedDocuments.map(doc => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{doc.title}</CardTitle>
                <Badge variant={getPriorityVariant(doc.priority)}>
                  {doc.priority}
                </Badge>
              </div>
              <CardDescription>{doc.reason}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button size="sm" onClick={() => startActualization(doc.id)}>
                  Начать актуализацию
                </Button>
                <Button size="sm" variant="outline" onClick={() => viewDocument(doc.id)}>
                  Просмотреть документ
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
\`\`\`

**Ограничения:**
- ⚠️ Требуется ручная инвентаризация инфраструктуры
- ⚠️ Связь документов с активами и угрозами нужно указывать вручную
- ⚠️ Автоматическое определение затронутых документов может быть неточным

**Оценка трудозатрат:** 6-8 недель

---

## Итоговая оценка готовности (скорректированная)

| Требование | Готовность | Трудозатраты | Приоритет |
|------------|-----------|--------------|-----------|
| 1.1 Автоматическая отгрузка шаблонов | 0% | 6-8 недель | HIGH |
| 1.2 Ручная загрузка шаблонов | 30% | 2-3 недели | HIGH |
| 1.3 Версионность шаблонов | 80% | 1-2 недели | MEDIUM |
| 2.1 Сравнение версий (diff) | 10% | 3-4 недели | CRITICAL |
| 2.2 Источники изменений | 0% | 2-3 недели | MEDIUM |
| 2.3 Комментарии к изменениям | 0% | 2 недели | LOW |
| 3.1 Применение обновлений к кастомизированным документам | 0% | 4-5 недель | HIGH |
| 3.2 Гибкое редактирование | 0% | Включено в 3.1 | HIGH |
| 3.3 Аналитика актуальности | 20% | 2-3 недели | MEDIUM |
| 4. Защита ДСП | 0% | 4-5 недель | HIGH |
| 5. AI-анализ изменений | 60% | 2-3 недели | MEDIUM |
| 6. Интеграция с 1С | 0% | 4-6 недель | MEDIUM |
| 7. Модель угроз и инфраструктура | 0% | 6-8 недель | HIGH |

**Общая готовность: 35-40%** (скорректировано с 65%)

**Общие трудозатраты: 40-55 человеко-недель**

---

## Roadmap реализации (3 фазы)

### Фаза 1: Критичный функционал (12-16 недель)
**Цель:** Реализовать минимально работающую систему для пилота

**Задачи:**
1. ✅ **Реальное сравнение документов (diff)** - 3-4 недели
   - Извлечение текста из PDF/DOCX
   - Построчное сравнение
   - Визуальное отображение изменений
   
2. ✅ **Доработка AI-анализа** - 2-3 недели
   - Интеграция извлечения текста
   - Улучшенные промпты
   - Обработка больших документов
   
3. ✅ **Система шаблонов** - 2-3 недели
   - Таблицы для шаблонов
   - Ручная загрузка
   - Связь с requirements
   
4. ✅ **Защита ДСП (базовая)** - 4-5 недель
   - Классификация документов
   - Контроль доступа
   - Водяные знаки
   - Audit logging

**Deliverables:**
- Работающее сравнение документов
- AI-анализ с реальным извлечением текста
- Базовая система шаблонов
- Защита ДСП документов

---

### Фаза 2: Автоматизация (14-18 недель)
**Цель:** Автоматизировать процессы актуализации

**Задачи:**
1. ✅ **Автоматическая отгрузка шаблонов** - 6-8 недель
   - Мониторинг нормативов
   - Загрузка шаблонов
   - Уведомления
   
2. ✅ **Применение обновлений к кастомизированным документам** - 4-5 недель
   - Анализ применимости изменений
   - UI для принятия/отклонения
   - Автоматическое применение
   
3. ✅ **Аналитика актуальности** - 2-3 недели
   - Дашборд устаревших документов
   - Приоритизация обновлений
   
4. ✅ **Комментарии и обсуждения** - 2 недели
   - Комментарии к изменениям
   - Уведомления

**Deliverables:**
- Автоматическая отгрузка шаблонов
- Система применения обновлений
- Дашборд актуальности
- Коллаборация через комментарии

---

### Фаза 3: Интеграции и расширенный функционал (14-21 неделя)
**Цель:** Интеграция с внешними системами и расширенная аналитика

**Задачи:**
1. ✅ **Интеграция с 1С** - 4-6 недель
   - REST API интеграция
   - Webhook
   - Двусторонняя синхронизация
   
2. ✅ **Модель угроз** - 6-8 недель
   - Таблицы для угроз и инфраструктуры
   - Связь с документами
   - Автоматическое определение затронутых документов
   
3. ✅ **Источники изменений** - 2-3 недели
   - Трекинг источников
   - Отображение в UI
   
4. ✅ **Расширенная защита ДСП** - 2-4 недели
   - Защищённый контур
   - DLP функции
   - Сертификация ФСТЭК (если требуется)

**Deliverables:**
- Интеграция с 1С
- Модель угроз и управление инфраструктурой
- Полная трассируемость изменений
- Сертифицированная защита ДСП

---

## Рекомендации

### Для клиента (Щёкиноазот):

1. **Начать с Фазы 1** - критичный функционал для пилота
2. **Предоставить тестовые данные:**
   - Примеры документов (PDF, DOCX)
   - Список нормативных актов
   - Структура инфраструктуры
3. **Выделить ответственных:**
   - Специалист по ИБ для валидации AI-анализа
   - Администратор 1С для интеграции
   - Пользователи для тестирования
4. **Определить приоритеты:**
   - Какие требования критичны для пилота?
   - Можно ли отложить интеграцию с 1С?
   - Нужна ли сертификация ФСТЭК для ДСП?

### Для команды разработки:

1. **Сфокусироваться на Фазе 1** - довести до production quality
2. **Реализовать извлечение текста** - критично для diff и AI-анализа
3. **Улучшить промпты для LLM** - точность анализа критична
4. **Добавить тесты:**
   - Unit тесты для извлечения текста
   - Integration тесты для diff
   - E2E тесты для UI
5. **Документировать API** - для будущих интеграций

---

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Извлечение текста из PDF неточное | HIGH | HIGH | Использовать OCR для сканов, тестировать на реальных документах |
| LLM "галлюцинирует" в анализе | MEDIUM | HIGH | Добавить валидацию результатов, использовать temperature=0.3 |
| API ФСТЭК/ФСБ недоступны | HIGH | MEDIUM | Использовать веб-скрейпинг как fallback, ручная загрузка |
| Интеграция с 1С сложная | MEDIUM | MEDIUM | Начать с простой синхронизации, расширять постепенно |
| Сертификация ФСТЭК для ДСП долгая | HIGH | LOW | Начать с базовой защиты, сертификацию отложить |
| Большие документы превышают context window LLM | MEDIUM | MEDIUM | Разбивать на chunks, использовать map-reduce подход |

---

## Заключение

После детального аудита кодовой базы выявлено, что **реальная готовность системы составляет 35-40%**, а не 65% как в первоначальной оценке. Многие компоненты имеют только архитектурную основу, но не имеют реальной реализации функционала.

**Критичные gaps:**
- Diff система - только placeholder
- AI-анализ - работает, но без извлечения текста
- Шаблоны документов - отсутствуют
- Автоматическая отгрузка - не реализована
- Интеграции - отсутствуют

**Рекомендация:** Начать с **Фазы 1 (12-16 недель)** для реализации критичного функционала и запуска пилота. После успешного пилота переходить к Фазам 2 и 3.

**Общие трудозатраты:** 40-55 человеко-недель для полной реализации всех требований.
