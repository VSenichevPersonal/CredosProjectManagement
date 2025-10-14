/**
 * Evidence Freshness Calculator
 *
 * Calculates actuality score for evidence based on:
 * - Days since last update (40% weight)
 * - Days since regulatory change (40% weight)
 * - Expiration date proximity (20% weight)
 */

export interface FreshnessScore {
  score: number // 0-100
  status: "fresh" | "aging" | "stale" | "expired"
  daysOld: number
  message: string
}

const MAX_FRESH_DAYS = 90 // Evidence is fresh for 90 days
const MAX_AGING_DAYS = 180 // Evidence is aging after 90 days
const MAX_STALE_DAYS = 365 // Evidence is stale after 180 days

/**
 * Calculate evidence freshness score
 */
export function calculateEvidenceFreshness(
  updatedAt: Date,
  expiresAt?: Date,
  regulatoryChangeDate?: Date,
): FreshnessScore {
  const now = new Date()
  const daysOld = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))

  let baseScore = 100
  if (daysOld > MAX_FRESH_DAYS) {
    const ageRatio = (daysOld - MAX_FRESH_DAYS) / (MAX_STALE_DAYS - MAX_FRESH_DAYS)
    baseScore = Math.max(0, 100 - ageRatio * 100)
  }
  const ageScore = baseScore * 0.4

  let regulatoryScore = 40
  if (regulatoryChangeDate) {
    const daysSinceChange = Math.floor((now.getTime() - regulatoryChangeDate.getTime()) / (1000 * 60 * 60 * 24))
    if (updatedAt < regulatoryChangeDate) {
      // Evidence is older than regulatory change - needs update
      regulatoryScore = Math.max(0, 40 - daysSinceChange / 10)
    }
  }

  let expirationScore = 20
  if (expiresAt) {
    const daysUntilExpiration = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiration < 0) {
      expirationScore = 0 // Expired
    } else if (daysUntilExpiration < 30) {
      expirationScore = (daysUntilExpiration / 30) * 20
    }
  }

  const totalScore = Math.round(ageScore + regulatoryScore + expirationScore)

  let status: FreshnessScore["status"]
  let message: string

  if (expiresAt && expiresAt < now) {
    status = "expired"
    message = "Доказательство истекло"
  } else if (totalScore >= 70) {
    status = "fresh"
    message = "Актуальное доказательство"
  } else if (totalScore >= 40) {
    status = "aging"
    message = "Доказательство устаревает"
  } else {
    status = "stale"
    message = "Доказательство устарело"
  }

  return {
    score: totalScore,
    status,
    daysOld,
    message,
  }
}

/**
 * Get color class for freshness status
 */
export function getFreshnessColor(status: FreshnessScore["status"]): string {
  switch (status) {
    case "fresh":
      return "text-green-600"
    case "aging":
      return "text-yellow-600"
    case "stale":
      return "text-orange-600"
    case "expired":
      return "text-red-600"
  }
}

/**
 * Get badge variant for freshness status
 */
export function getFreshnessBadgeVariant(
  status: FreshnessScore["status"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "fresh":
      return "default"
    case "aging":
      return "secondary"
    case "stale":
      return "outline"
    case "expired":
      return "destructive"
  }
}
