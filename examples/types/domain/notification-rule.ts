/**
 * @intent: Type definitions for notification rules system
 * @llm-note: Maps to notification_rule_* tables in database (402 migration)
 * @architecture: Domain types for configurable notification management
 */

export type NotificationChannel = "email" | "in_app" | "push"
export type NotificationEventType =
  | "compliance_status_changed"
  | "evidence_uploaded"
  | "evidence_approved"
  | "evidence_rejected"
  | "requirement_deadline_approaching"
  | "requirement_overdue"
  | "approval_requested"
  | "approval_completed"
  | "document_version_added"
  | "document_analysis_completed"

/**
 * Notification rule definition
 * Maps to: notification_rules table
 */
export interface NotificationRule {
  id: string
  tenant_id: string
  name: string
  description: string | null
  event_type: NotificationEventType
  is_active: boolean
  priority: number
  conditions: Record<string, any> | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Role-based recipients for notification rule
 * Maps to: notification_rule_roles table
 */
export interface NotificationRuleRole {
  id: string
  rule_id: string
  role_name: string
  organization_id: string | null
  created_at: string
}

/**
 * Individual user recipients for notification rule
 * Maps to: notification_rule_users table
 */
export interface NotificationRuleUser {
  id: string
  rule_id: string
  user_id: string
  created_at: string
}

/**
 * Delivery channels for notification rule
 * Maps to: notification_rule_channels table
 */
export interface NotificationRuleChannel {
  id: string
  rule_id: string
  channel_type: NotificationChannel
  channel_config: Record<string, any> | null
  created_at: string
}

/**
 * Complete notification rule with relations
 */
export interface NotificationRuleWithRelations extends NotificationRule {
  roles: NotificationRuleRole[]
  users: NotificationRuleUser[]
  channels: NotificationRuleChannel[]
}

/**
 * DTOs for creating notification rules
 */
export interface CreateNotificationRuleDTO {
  name: string
  description?: string
  event_type: NotificationEventType
  is_active?: boolean
  priority?: number
  conditions?: Record<string, any>
  roles?: CreateNotificationRuleRoleDTO[]
  users?: string[] // user_ids
  channels: CreateNotificationRuleChannelDTO[]
}

export interface CreateNotificationRuleRoleDTO {
  role_name: string
  organization_id?: string
}

export interface CreateNotificationRuleChannelDTO {
  channel_type: NotificationChannel
  channel_config?: Record<string, any>
}

export interface UpdateNotificationRuleDTO extends Partial<CreateNotificationRuleDTO> {
  id: string
}
