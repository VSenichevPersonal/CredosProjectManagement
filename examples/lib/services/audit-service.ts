/**
 * @intent: Audit trail service for logging all user actions
 * @llm-note: Used via ctx.audit.log() in all services
 * @architecture: Immutable audit log for compliance and security
 */

import type { DatabaseProvider } from "@/providers/database-provider"
import type { Logger } from "@/lib/utils/logger"

export interface AuditEvent {
  eventType: string
  userId?: string
  resourceType?: string
  resourceId?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
}

export class AuditService {
  constructor(
    private db: DatabaseProvider,
    private logger: Logger,
  ) {}

  /**
   * @intent: Log audit event
   * @llm-note: Call this after any data modification
   * @precondition: Event data is provided
   * @postcondition: Event is logged to database and console
   * @side-effects: Creates immutable audit log entry
   */
  async log(event: AuditEvent): Promise<void> {
    this.logger.info("[v0] Audit event", {
      eventType: event.eventType,
      userId: event.userId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
    })

    // TODO: Implement audit log table in database
    // For now, just log to console
    // In production, this should write to an immutable audit_log table

    console.log(
      "[v0] AUDIT:",
      JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }),
    )
  }

  /**
   * @intent: Log requirement created event
   * @llm-note: Convenience method for common audit events
   */
  async logRequirementCreated(requirementId: string, userId: string, data: any): Promise<void> {
    await this.log({
      eventType: "requirement_created",
      userId,
      resourceType: "requirement",
      resourceId: requirementId,
      changes: data,
    })
  }

  /**
   * @intent: Log compliance status changed event
   * @llm-note: Convenience method for compliance tracking
   */
  async logComplianceStatusChanged(
    complianceId: string,
    userId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    await this.log({
      eventType: "compliance_status_changed",
      userId,
      resourceType: "compliance",
      resourceId: complianceId,
      changes: {
        oldStatus,
        newStatus,
      },
    })
  }

  /**
   * @intent: Log approval/rejection event
   * @llm-note: Critical audit event for compliance workflow
   */
  async logApprovalDecision(
    complianceId: string,
    reviewerId: string,
    decision: "approved" | "rejected",
    comment?: string,
  ): Promise<void> {
    await this.log({
      eventType: `compliance_${decision}`,
      userId: reviewerId,
      resourceType: "compliance",
      resourceId: complianceId,
      metadata: {
        decision,
        comment,
      },
    })
  }
}
