import type { ExecutionContext } from "@/lib/execution-context"

/**
 * Service for calculating and managing compliance statuses
 * Provides methods to calculate completion and trigger status updates
 */
export class ComplianceStatusCalculator {
  /**
   * Calculate completion percentage for a control measure
   * @param ctx Execution context
   * @param measureId Control measure ID
   * @returns Completion data with required/provided counts and percentage
   */
  static async calculateMeasureCompletion(
    ctx: ExecutionContext,
    measureId: string,
  ): Promise<{
    requiredCount: number
    providedCount: number
    completionPercentage: number
  }> {
    const { data, error } = await ctx.db.supabase.rpc("calculate_measure_completion", { p_measure_id: measureId })

    if (error) {
      console.error("[v0] Error calculating measure completion:", error)
      throw new Error(`Failed to calculate measure completion: ${error.message}`)
    }

    return {
      requiredCount: data.required_count,
      providedCount: data.provided_count,
      completionPercentage: data.completion_percentage,
    }
  }

  /**
   * Update status of a control measure based on evidence completion
   * @param ctx Execution context
   * @param measureId Control measure ID
   * @returns New status
   */
  static async updateMeasureStatus(ctx: ExecutionContext, measureId: string): Promise<string> {
    const { data, error } = await ctx.db.supabase.rpc("update_measure_status", {
      p_measure_id: measureId,
    })

    if (error) {
      console.error("[v0] Error updating measure status:", error)
      throw new Error(`Failed to update measure status: ${error.message}`)
    }

    console.log(`[v0] Updated measure ${measureId} status to: ${data}`)
    return data
  }

  /**
   * Update status of a compliance record by aggregating measure statuses
   * @param ctx Execution context
   * @param complianceRecordId Compliance record ID
   * @returns New status
   */
  static async updateComplianceRecordStatus(ctx: ExecutionContext, complianceRecordId: string): Promise<string> {
    const { data, error } = await ctx.db.supabase.rpc("update_compliance_record_status", {
      p_compliance_record_id: complianceRecordId,
    })

    if (error) {
      console.error("[v0] Error updating compliance record status:", error)
      throw new Error(`Failed to update compliance record status: ${error.message}`)
    }

    console.log(`[v0] Updated compliance record ${complianceRecordId} status to: ${data}`)
    return data
  }

  /**
   * Recalculate all statuses in the system (use for migration/maintenance)
   * @param ctx Execution context
   * @returns Counts of updated records
   */
  static async recalculateAllStatuses(
    ctx: ExecutionContext,
  ): Promise<{ measuresUpdated: number; complianceRecordsUpdated: number }> {
    const { data, error } = await ctx.db.supabase.rpc("recalculate_all_statuses")

    if (error) {
      console.error("[v0] Error recalculating all statuses:", error)
      throw new Error(`Failed to recalculate all statuses: ${error.message}`)
    }

    console.log("[v0] Recalculated all statuses:", data)
    return {
      measuresUpdated: data[0].measures_updated,
      complianceRecordsUpdated: data[0].compliance_records_updated,
    }
  }

  /**
   * Get detailed completion status for a compliance record
   * @param ctx Execution context
   * @param complianceRecordId Compliance record ID
   * @returns Detailed status breakdown
   */
  static async getComplianceRecordDetails(
    ctx: ExecutionContext,
    complianceRecordId: string,
  ): Promise<{
    totalMeasures: number
    implementedMeasures: number
    inProgressMeasures: number
    plannedMeasures: number
    overallCompletion: number
  }> {
    const { data: measures, error } = await ctx.db.supabase
      .from("control_measures")
      .select("id, status")
      .eq("compliance_record_id", complianceRecordId)
      .is("deleted_at", null)

    if (error) {
      console.error("[v0] Error fetching compliance record details:", error)
      throw new Error(`Failed to fetch compliance record details: ${error.message}`)
    }

    const totalMeasures = measures.length
    const implementedMeasures = measures.filter((m) => m.status === "implemented").length
    const inProgressMeasures = measures.filter((m) => m.status === "in_progress").length
    const plannedMeasures = measures.filter((m) => m.status === "planned").length

    const overallCompletion = totalMeasures > 0 ? Math.round((implementedMeasures / totalMeasures) * 100) : 0

    return {
      totalMeasures,
      implementedMeasures,
      inProgressMeasures,
      plannedMeasures,
      overallCompletion,
    }
  }
}
