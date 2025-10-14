/**
 * @intent: Транслитерация кириллицы в латиницу
 * @llm-note: Для безопасных имен файлов в Supabase Storage
 */

const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
  'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
  'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
}

/**
 * Транслитерация русского текста в латиницу
 */
export function transliterate(text: string): string {
  return text
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
}

/**
 * Безопасное имя файла для Supabase Storage
 */
export function sanitizeFileName(fileName: string): string {
  // 1. Транслитерация кириллицы
  let sanitized = transliterate(fileName)
  
  // 2. Пробелы → подчеркивание
  sanitized = sanitized.replace(/\s+/g, '_')
  
  // 3. Убираем опасные символы (оставляем только безопасные)
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '')
  
  // 4. Ограничение длины
  sanitized = sanitized.substring(0, 200)
  
  // 5. Fallback если пусто
  return sanitized || 'file'
}

/**
 * Примеры:
 * "Документ 1.docx"      → "Dokument_1.docx"
 * "Политика ИБ.pdf"      → "Politika_IB.pdf"
 * "Приказ №15-ИБ.pdf"    → "Prikaz_15-IB.pdf"
 * "Модель угроз.xlsx"    → "Model_ugroz.xlsx"
 */

