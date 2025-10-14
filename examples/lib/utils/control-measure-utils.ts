/**
 * @intent: Утилиты для работы с мерами контроля
 * @llm-note: Форматирование дат, статусов и расчет сроков
 */

import { differenceInDays, format, isPast, isFuture } from "date-fns"
import { ru } from "date-fns/locale"

export interface MeasureDeadlineInfo {
  isOverdue: boolean
  isCritical: boolean // < 3 дней
  isWarning: boolean // < 14 дней
  daysUntilDue: number
  message: string
  color: "default" | "warning" | "critical" | "success"
}

/**
 * Рассчитать информацию о сроках меры
 */
export function calculateDeadlineInfo(
  targetDate: Date | string | null | undefined,
  status: string
): MeasureDeadlineInfo | null {
  if (!targetDate) return null

  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate
  const now = new Date()
  const daysUntilDue = differenceInDays(target, now)

  // Если мера уже внедрена или проверена - не считаем просрочкой
  const isCompleted = ["implemented", "verified"].includes(status)

  const isOverdue = !isCompleted && isPast(target)
  const isCritical = !isCompleted && daysUntilDue <= 3 && daysUntilDue >= 0
  const isWarning = !isCompleted && daysUntilDue <= 14 && daysUntilDue > 3

  let message = ""
  let color: "default" | "warning" | "critical" | "success" = "default"

  if (isOverdue) {
    message = `Просрочено на ${Math.abs(daysUntilDue)} дн.`
    color = "critical"
  } else if (isCritical) {
    message = `Критично! Осталось ${daysUntilDue} дн.`
    color = "critical"
  } else if (isWarning) {
    message = `До срока ${daysUntilDue} дн.`
    color = "warning"
  } else if (isCompleted) {
    message = "Выполнено"
    color = "success"
  } else {
    message = `До срока ${daysUntilDue} дн.`
    color = "default"
  }

  return {
    isOverdue,
    isCritical,
    isWarning,
    daysUntilDue,
    message,
    color,
  }
}

/**
 * Форматировать дату для отображения
 */
export function formatMeasureDate(date: Date | string | null | undefined): string {
  if (!date) return "—"

  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "dd.MM.yyyy", { locale: ru })
}

/**
 * Форматировать дату с днем недели
 */
export function formatMeasureDateWithDay(date: Date | string | null | undefined): string {
  if (!date) return "—"

  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "dd MMM yyyy (EEE)", { locale: ru })
}

/**
 * Получить статус цвет для меры
 */
export function getMeasureStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: "bg-gray-100 text-gray-800 border-gray-300",
    in_progress: "bg-blue-100 text-blue-800 border-blue-300",
    implemented: "bg-green-100 text-green-800 border-green-300",
    verified: "bg-emerald-100 text-emerald-800 border-emerald-300",
    failed: "bg-red-100 text-red-800 border-red-300",
    overdue: "bg-orange-100 text-orange-800 border-orange-300",
  }

  return colors[status] || colors.planned
}

/**
 * Получить текст статуса на русском
 */
export function getMeasureStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planned: "Запланирована",
    in_progress: "В работе",
    implemented: "Внедрена",
    verified: "Проверена",
    failed: "Не прошла проверку",
    overdue: "Просрочена",
  }

  return labels[status] || status
}

/**
 * Проверить, нужна ли проверка меры
 */
export function needsReview(
  nextReviewDate: Date | string | null | undefined,
  status: string
): boolean {
  if (!nextReviewDate) return false
  if (!["implemented", "verified"].includes(status)) return false

  const reviewDate = typeof nextReviewDate === "string" ? new Date(nextReviewDate) : nextReviewDate
  const now = new Date()

  // Нужна проверка если до неё осталось 14 дней или меньше
  return differenceInDays(reviewDate, now) <= 14
}

/**
 * Проверить, истекает ли срок действия меры
 */
export function isExpiring(
  validUntil: Date | string | null | undefined,
  status: string
): boolean {
  if (!validUntil) return false
  if (!["implemented", "verified"].includes(status)) return false

  const expiryDate = typeof validUntil === "string" ? new Date(validUntil) : validUntil
  const now = new Date()

  // Истекает если до истечения осталось 30 дней или меньше
  return differenceInDays(expiryDate, now) <= 30 && isFuture(expiryDate)
}

/**
 * Получить описание частоты проверки
 */
export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    continuous: "Постоянно",
    daily: "Ежедневно",
    weekly: "Еженедельно",
    monthly: "Ежемесячно",
    quarterly: "Ежеквартально",
    annually: "Ежегодно",
    on_demand: "По требованию",
  }

  return labels[frequency] || frequency
}

/**
 * Рассчитать процент выполнения в срок
 */
export function calculateOnTimePercentage(
  totalMeasures: number,
  onTimeMeasures: number
): number {
  if (totalMeasures === 0) return 0
  return Math.round((onTimeMeasures / totalMeasures) * 100)
}

/**
 * Получить иконку для типа меры
 */
export function getMeasureTypeIcon(measureType: string): string {
  const icons: Record<string, string> = {
    preventive: "🛡️",
    detective: "🔍",
    corrective: "🔧",
    compensating: "↔️",
  }

  return icons[measureType] || "📋"
}

/**
 * Получить label для типа меры
 */
export function getMeasureTypeLabel(measureType: string): string {
  const labels: Record<string, string> = {
    preventive: "Превентивная",
    detective: "Детективная",
    corrective: "Корректирующая",
    compensating: "Компенсирующая",
  }

  return labels[measureType] || measureType
}

