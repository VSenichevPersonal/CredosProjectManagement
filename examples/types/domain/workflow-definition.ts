/**
 * @intent: Type definitions for unified workflow system
 * @llm-note: Maps to workflow_* tables in database (403 migration)
 * @architecture: Domain types for configurable workflow engine
 */

export type WorkflowType = "compliance" | "evidence" | "document" | "approval" | "custom"
export type WorkflowStatus = "draft" | "active" | "completed" | "cancelled" | "failed"
export type StateType = "initial" | "intermediate" | "final" | "error"

/**
 * Workflow definition
 * Maps to: workflow_definitions table
 */
export interface WorkflowDefinition {
  id: string
  tenant_id: string
  workflow_type: WorkflowType
  name: string
  description: string | null
  version: number
  is_active: boolean
  is_default: boolean
  config: Record<string, any> | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * State in a workflow
 * Maps to: workflow_states table
 */
export interface WorkflowState {
  id: string
  workflow_definition_id: string
  name: string
  description: string | null
  state_type: StateType
  color: string | null
  display_order: number
  on_enter_actions: Record<string, any> | null
  on_exit_actions: Record<string, any> | null
  created_at: string
  updated_at: string
}

/**
 * Transition between workflow states
 * Maps to: workflow_transitions table
 */
export interface WorkflowTransition {
  id: string
  workflow_definition_id: string
  from_state_id: string
  to_state_id: string
  name: string
  description: string | null
  conditions: Record<string, any> | null
  required_permissions: string[] | null
  requires_approval: boolean
  approval_count: number | null
  requires_evidence: boolean
  requires_comment: boolean
  actions: Record<string, any> | null
  created_at: string
  updated_at: string
}

/**
 * Instance of a workflow execution
 * Maps to: workflow_instances table
 */
export interface WorkflowInstance {
  id: string
  tenant_id: string
  workflow_definition_id: string
  entity_type: string
  entity_id: string
  current_state_id: string | null
  status: WorkflowStatus
  context: Record<string, any> | null
  started_by: string
  started_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * History of workflow transitions
 * Maps to: workflow_history table
 */
export interface WorkflowHistory {
  id: string
  workflow_instance_id: string
  transition_id: string
  from_state_id: string | null
  to_state_id: string
  performed_by: string
  performed_at: string
  comment: string | null
  metadata: Record<string, any> | null
}

/**
 * Pending approval in workflow
 * Maps to: workflow_pending_approvals table
 */
export interface WorkflowPendingApproval {
  id: string
  workflow_instance_id: string
  transition_id: string
  approver_id: string
  status: string
  requested_at: string
  responded_at: string | null
  comment: string | null
}

/**
 * Complete workflow definition with relations
 */
export interface WorkflowDefinitionWithRelations extends WorkflowDefinition {
  states: WorkflowState[]
  transitions: WorkflowTransition[]
}

/**
 * DTOs for workflow operations
 */
export interface CreateWorkflowDefinitionDTO {
  workflow_type: WorkflowType
  name: string
  description?: string
  is_default?: boolean
  config?: Record<string, any>
  states: CreateWorkflowStateDTO[]
  transitions: CreateWorkflowTransitionDTO[]
}

export interface CreateWorkflowStateDTO {
  name: string
  description?: string
  state_type: StateType
  color?: string
  display_order: number
  on_enter_actions?: Record<string, any>
  on_exit_actions?: Record<string, any>
}

export interface CreateWorkflowTransitionDTO {
  from_state_name: string
  to_state_name: string
  name: string
  description?: string
  conditions?: Record<string, any>
  required_permissions?: string[]
  requires_approval?: boolean
  approval_count?: number
  requires_evidence?: boolean
  requires_comment?: boolean
  actions?: Record<string, any>
}

export interface StartWorkflowDTO {
  workflow_definition_id: string
  entity_type: string
  entity_id: string
  context?: Record<string, any>
}

export interface ExecuteTransitionDTO {
  instance_id: string
  transition_id: string
  comment?: string
  metadata?: Record<string, any>
}
