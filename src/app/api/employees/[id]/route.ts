import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { EmployeeService } from '@/services/employee-service';
import { z } from 'zod';

const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  position: z.string().min(1).optional(),
  directionId: z.string().uuid().optional(),
  defaultHourlyRate: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Отключаем статическую генерацию
export const dynamic = 'force-dynamic';

/**
 * GET /api/employees/[id]
 * Получить конкретного сотрудника
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    ctx.logger.info(`GET /api/employees/${params.id}`);
    
    const employee = await EmployeeService.getEmployeeById(ctx, params.id);
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(employee);
  } catch (error: any) {
    ctx.logger.error('Failed to fetch employee', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch employee', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/employees/[id]
 * Обновить сотрудника
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    const body = await request.json();
    ctx.logger.info(`PUT /api/employees/${params.id}`, body);
    
    const validatedData = updateEmployeeSchema.parse(body);
    
    const employee = await EmployeeService.updateEmployee(
      ctx,
      params.id,
      validatedData
    );
    
    ctx.logger.info('Employee updated', { id: employee.id });
    
    return NextResponse.json(employee);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      ctx.logger.warn('Validation error', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    ctx.logger.error('Failed to update employee', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to update employee', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employees/[id]
 * Удалить сотрудника (soft delete - устанавливает is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    ctx.logger.info(`DELETE /api/employees/${params.id}`);
    
    // Проверяем что не пытаются удалить себя
    if (ctx.employeeId === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }
    
    await EmployeeService.deleteEmployee(ctx, params.id);
    
    ctx.logger.info('Employee deleted', { id: params.id });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    ctx.logger.error('Failed to delete employee', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to delete employee', details: error.message },
      { status: 500 }
    );
  }
}
