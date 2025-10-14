// Translation utilities for requirement categories and criticality levels

export const CRITICALITY_LABELS: Record<string, string> = {
  critical: "Критический",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
}

export const CATEGORY_LABELS: Record<string, string> = {
  technical: "Технические",
  organizational: "Организационные",
  procedural: "Процедурные",
  physical: "Физические",
  legal: "Правовые",
  null: "Без категории",
}

export function translateCriticality(criticality: string | null | undefined): string {
  if (!criticality) return "Не указана"
  return CRITICALITY_LABELS[criticality] || criticality
}

export function translateCategory(category: string | null | undefined): string {
  if (!category) return "Без категории"
  return CATEGORY_LABELS[category] || category
}
