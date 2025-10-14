import type { Control } from "@/types/domain/control"

export class ControlMapper {
  static fromDb(row: any): Control {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      category: row.category,
      controlType: row.control_type,
      frequency: row.frequency,
      isAutomated: row.is_automated,
      owner: row.owner,
      ownerId: row.owner_id,
      status: row.status,
      implementationGuide: row.implementation_guide,
      testingProcedure: row.testing_procedure,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      tenantId: row.tenant_id,
    }
  }

  static toDb(control: Partial<Control>): any {
    return {
      code: control.code,
      title: control.title,
      description: control.description,
      category: control.category,
      control_type: control.controlType,
      frequency: control.frequency,
      is_automated: control.isAutomated,
      owner: control.owner,
      owner_id: control.ownerId,
      status: control.status,
      implementation_guide: control.implementationGuide,
      testing_procedure: control.testingProcedure,
      created_by: control.createdBy,
      tenant_id: control.tenantId,
    }
  }
}
