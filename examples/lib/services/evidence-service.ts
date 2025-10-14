/**
 * EvidenceService
 *
 * Manages evidence lifecycle and freshness tracking.
 * Part of EvidenceContext.
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import { calculateEvidenceFreshness } from "@/lib/utils/evidence-freshness"

export class EvidenceService {
  /**
   * Get stale evidence that needs updating
   */
  async getStaleEvidence(ctx: ExecutionContext, maxScore = 40): Promise<any[]> {
    const allEvidence = await ctx.db.evidence.findMany({})

    return allEvidence.filter((evidence) => {
      const freshness = calculateEvidenceFreshness(evidence.updatedAt, evidence.expiresAt)
      return freshness.score < maxScore
    })
  }

  /**
   * Get evidence expiring soon
   */
  async getExpiringEvidence(ctx: ExecutionContext, withinDays = 30): Promise<any[]> {
    const allEvidence = await ctx.db.evidence.findMany({})
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + withinDays)

    return allEvidence.filter((evidence) => {
      if (!evidence.expiresAt) return false
      const expiresAt = new Date(evidence.expiresAt)
      return expiresAt > now && expiresAt <= futureDate
    })
  }
}
