# Жизненный цикл документов - Краткая справка

**Миграция:** 610  
**Статус:** ✅ Готово к запуску

---

## 🎯 Что добавлено

### Поля в evidence:
- `lifecycle_status` - draft | active | archived | destroyed
- `document_number` - Номер документа (№123-ИБ)
- `document_date` - Дата документа
- `effective_from` - Действует С
- `effective_until` - Действует ДО
- `retention_period_years` - Срок хранения (3,5,10,75,null)
- `destruction_date` - Дата уничтожения
- `approved_at` / `approved_by` - Утверждение

### Автоматика:
- Триггер переводит draft → active при утверждении
- Расчет destruction_date из retention_period_years
- Автоархивирование при effective_until
- View для связи документов и мер

---

## 🚀 Запуск

```sql
psql your_db < scripts/610_add_document_lifecycle.sql
```

**Готово к запуску!** Миграция безопасная.

