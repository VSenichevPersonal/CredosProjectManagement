export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return "только что"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин. назад`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч. назад`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} дн. назад`

  return formatDate(d)
}
