/**
 * @intent: Type definitions for approval workflow system
 * @llm-note: Maps to approval_* tables in database (401 migration)
 * @architecture: Domain types for multi-level approval workflows
 */

export type ApprovalStageType = "sequential" | "parallel" | "any"
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled"
export type ApprovalAction = "approve" | "reject" | "delegate"

/**
 * Approval route definition
 * Maps to: approval_routes table
 */
export interface ApprovalRoute {
  id: string
  tenant_id: string
  entity_type: string // "compliance_record" | "evidence" | "requirement"
  name: string
  description: string | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Stage in an approval route
 * Maps to: approval_stages table (was approval_route_stages)
 */
export interface ApprovalStage {
  id: string
  route_id: string
  name: string
  description: string | null
  stage_order: number
  stage_type: ApprovalStageType
  required_approvals: number
  escalation_hours: number | null
  escalation_user_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Approver assigned to a stage
 * Maps to: approval_stage_approvers table (was approval_route_approvers)
 */
export interface ApprovalStageApprover {
  id: string
  stage_id: string
  user_id: string | null
  role: string | null
  is_required: boolean
  created_at: string
}

/**
 * Instance of an approval process
 * Maps to: approval_instances table
 */
export interface ApprovalInstance {
  id: string
  tenant_id: string
  route_id: string
  entity_type: string
  entity_id: string
  current_stage_id: string | null
  status: ApprovalStatus
  initiated_by: string
  initiated_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Action taken in approval process
 * Maps to: approval_actions table
 */
export interface ApprovalActionRecord {
  id: string
  instance_id: string
  stage_id: string
  user_id: string
  action: ApprovalAction
  comment: string | null
  delegated_to: string | null
  created_at: string
}

/**
 * Delegation of approval authority
 * Maps to: approval_delegations table
 */
export interface ApprovalDelegation {
  id: string
  tenant_id: string
  from_user_id: string
  to_user_id: string
  start_date: string
  end_date: string
  reason: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * DTOs for creating approval workflows
 */
export interface CreateApprovalRouteDTO {
  entity_type: string
  name: string
  description?: string
  stages: CreateApprovalStageDTO[]
}

export interface CreateApprovalStageDTO {
  name: string
  description?: string
  stage_order: number
  stage_type: ApprovalStageType
  required_approvals: number
  escalation_hours?: number
  escalation_user_id?: string
  approvers: CreateApprovalApproverDTO[]
}

export interface CreateApprovalApproverDTO {
  user_id?: string
  role?: string
  is_required: boolean
}

export interface InitiateApprovalDTO {
  route_id: string
  entity_type: string
  entity_id: string
}

export interface SubmitApprovalActionDTO {
  instance_id: string
  stage_id: string
  action: ApprovalAction
  comment?: string
  delegated_to?: string
}
