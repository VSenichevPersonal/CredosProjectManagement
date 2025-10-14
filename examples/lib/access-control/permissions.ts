/**
 * @intent: Define all system permissions
 * @llm-note: Permissions are granular actions on resources
 * @architecture: RBAC (Role-Based Access Control) foundation
 */

export enum Permission {
  // Requirement permissions
  REQUIREMENT_READ = "requirement:read",
  REQUIREMENT_CREATE = "requirement:create",
  REQUIREMENT_UPDATE = "requirement:update",
  REQUIREMENT_DELETE = "requirement:delete",
  REQUIREMENT_ASSIGN = "requirement:assign",

  // Organization permissions
  ORGANIZATION_READ = "organization:read",
  ORGANIZATION_CREATE = "organization:create",
  ORGANIZATION_UPDATE = "organization:update",
  ORGANIZATION_DELETE = "organization:delete",

  // Compliance permissions
  COMPLIANCE_READ = "compliance:read",
  COMPLIANCE_UPDATE = "compliance:update",
  COMPLIANCE_APPROVE = "compliance:approve",
  COMPLIANCE_REJECT = "compliance:reject",

  // Control template permissions
  CONTROL_TEMPLATE_READ = "control_template:read",
  CONTROL_TEMPLATE_CREATE = "control_template:create",
  CONTROL_TEMPLATE_UPDATE = "control_template:update",
  CONTROL_TEMPLATE_DELETE = "control_template:delete",
  CONTROL_TEMPLATE_APPLY = "control_template:apply",

  // Control permissions
  CONTROL_READ = "control:read",
  CONTROL_CREATE = "control:create",
  CONTROL_UPDATE = "control:update",
  CONTROL_DELETE = "control:delete",

  // Document permissions
  DOCUMENT_READ = "document:read",
  DOCUMENT_CREATE = "document:create",
  DOCUMENT_UPDATE = "document:update",
  DOCUMENT_DELETE = "document:delete",

  // Evidence permissions
  EVIDENCE_READ = "evidence:read",
  EVIDENCE_CREATE = "evidence:create",
  EVIDENCE_UPDATE = "evidence:update",
  EVIDENCE_DELETE = "evidence:delete",
  EVIDENCE_APPROVE = "evidence:approve",

  // Dictionary permissions
  DICTIONARY_MANAGE = "dictionary:manage",

  // Report permissions
  REPORT_VIEW = "report:view",
  REPORT_EXPORT = "report:export",

  // User permissions
  USER_READ = "user:read",
  USER_CREATE = "user:create",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",

  // Audit permissions
  AUDIT_READ = "audit:read",
}

/**
 * @intent: Define system roles
 * @llm-note: Roles are hierarchical - higher roles inherit lower permissions
 */
export enum Role {
  SUPER_ADMIN = "super_admin",
  REGULATOR_ADMIN = "regulator_admin",
  MINISTRY_USER = "ministry_user",
  INSTITUTION_USER = "institution_user",
  CISO = "ciso",
  AUDITOR = "auditor",
}

/**
 * @intent: Map roles to permissions
 * @llm-note: This is the source of truth for authorization
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [Role.REGULATOR_ADMIN]: [
    Permission.REQUIREMENT_READ,
    Permission.REQUIREMENT_CREATE,
    Permission.REQUIREMENT_UPDATE,
    Permission.REQUIREMENT_ASSIGN,
    Permission.ORGANIZATION_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_APPROVE,
    Permission.COMPLIANCE_REJECT,
    Permission.CONTROL_TEMPLATE_READ,
    Permission.CONTROL_TEMPLATE_CREATE,
    Permission.CONTROL_TEMPLATE_UPDATE,
    Permission.CONTROL_TEMPLATE_DELETE,
    Permission.CONTROL_TEMPLATE_APPLY,
    Permission.CONTROL_READ,
    Permission.CONTROL_CREATE,
    Permission.CONTROL_UPDATE,
    Permission.CONTROL_DELETE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_CREATE,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DELETE,
    Permission.EVIDENCE_READ,
    Permission.EVIDENCE_CREATE,
    Permission.EVIDENCE_UPDATE,
    Permission.EVIDENCE_DELETE,
    Permission.EVIDENCE_APPROVE,
    Permission.DICTIONARY_MANAGE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.AUDIT_READ,
  ],

  [Role.MINISTRY_USER]: [
    Permission.REQUIREMENT_READ,
    Permission.ORGANIZATION_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_APPROVE,
    Permission.COMPLIANCE_REJECT,
    Permission.CONTROL_TEMPLATE_READ,
    Permission.CONTROL_READ,
    Permission.DOCUMENT_READ,
    Permission.EVIDENCE_READ,
    Permission.REPORT_VIEW,
  ],

  [Role.INSTITUTION_USER]: [
    Permission.REQUIREMENT_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_UPDATE,
    Permission.CONTROL_TEMPLATE_READ,
    Permission.CONTROL_TEMPLATE_APPLY,
    Permission.CONTROL_READ,
    Permission.CONTROL_CREATE,
    Permission.CONTROL_UPDATE,
    Permission.DOCUMENT_READ,
    Permission.EVIDENCE_READ,
  ],

  [Role.CISO]: [
    Permission.REQUIREMENT_READ,
    Permission.ORGANIZATION_READ,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_UPDATE,
    Permission.CONTROL_TEMPLATE_READ,
    Permission.CONTROL_TEMPLATE_APPLY,
    Permission.CONTROL_READ,
    Permission.CONTROL_CREATE,
    Permission.CONTROL_UPDATE,
    Permission.CONTROL_DELETE,
    Permission.DOCUMENT_READ,
    Permission.EVIDENCE_READ,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.DICTIONARY_MANAGE,
  ],

  [Role.AUDITOR]: [
    Permission.REQUIREMENT_READ,
    Permission.ORGANIZATION_READ,
    Permission.COMPLIANCE_READ,
    Permission.CONTROL_TEMPLATE_READ,
    Permission.CONTROL_READ,
    Permission.DOCUMENT_READ,
    Permission.EVIDENCE_READ,
    Permission.REPORT_VIEW,
    Permission.AUDIT_READ,
  ],
}
