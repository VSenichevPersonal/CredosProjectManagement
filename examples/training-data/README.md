# Training Data для AI генерации документов

**Назначение:** Типовые документы для обучения OpenAI Assistant

---

## 📁 Структура

```
training-data/
├─ pdn-documents/        # 47 типовых документов по 152-ФЗ (ПДн)
│  ├─ 01-13. Приказы
│  ├─ 15. Политика
│  ├─ 16. Положение
│  ├─ 17-66. Регламенты, акты, рекомендации
│  └─ 67-71. Модели угроз
│
└─ README.md (этот файл)
```

---

## 🎯 Использование

### 1. OpenAI Vector Store

Эти документы загружаются в OpenAI Vector Store для:
- **File Search** - поиск релевантных шаблонов
- **Контекст** - примеры формулировок и структуры
- **Качество** - генерация по образцу реальных документов

### 2. Дообучение (fine-tuning)

В будущем можно использовать для:
- Дообучения GPT-4o на российской специфике
- Создания датасета для fine-tuned модели
- Улучшения качества генерации

---

## 📊 Содержимое

### pdn-documents/ (47 файлов, 4MB)

**Приказы (13 штук):**
- О комиссии по определению уровня защищенности
- Об ответственных лицах
- Об утверждении перечней
- О безопасности носителей
- И другие...

**Политики и положения (2 штуки):**
- Политика обработки ПДн
- Положение по обеспечению безопасности

**Регламенты и порядки:**
- Хранение и передача ПДн
- Внутренний контроль
- Обновление ПО

**Акты:**
- Определения уровня защищенности
- Оценки вреда

**Технические документы:**
- Модели угроз (8 штук)
- Технические задания на СЗИ (8 штук)

---

## 🚀 Загрузка в OpenAI

### Скрипт загрузки:

```bash
# Загрузить все документы в Vector Store
npx tsx scripts/upload-training-data.ts
```

### Или вручную:

```typescript
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const openai = new OpenAI()

// Загрузить все файлы
const files = fs.readdirSync('training-data/pdn-documents')
const fileIds = []

for (const filename of files) {
  if (filename.endsWith('.md')) {
    const file = await openai.files.create({
      file: fs.createReadStream(path.join('training-data/pdn-documents', filename)),
      purpose: 'assistants'
    })
    fileIds.push(file.id)
  }
}

// Добавить в Vector Store
await openai.beta.vectorStores.fileBatches.create(vectorStoreId, {
  file_ids: fileIds
})
```

---

## ⚠️ Важно

### Не коммитить!

Эти файлы НЕ должны попадать в git:
- Большой размер (4MB)
- Могут содержать конфиденциальную информацию
- Используются только для AI обучения

**Уже добавлено в `.gitignore`:**
```
/training-data/
```

---

## 📝 Источник

**Откуда:** `/Users/vsenichev/Yandex.Disk.localized/AI CODE /CURSOR DOCS TEST /CURSOR_DOCS_TEST_1/SAMPLEDOCS`

**Дата копирования:** 13 октября 2025

**Использование:** OpenAI Vector Store для генерации документов по 152-ФЗ

---

**Статус:** ✅ 47 типовых документов готовы для загрузки в OpenAI!

