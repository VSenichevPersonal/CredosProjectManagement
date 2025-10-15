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
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await createExecutionContext(request);
  
  try {
    const employee = await EmployeeService.getEmployeeById(context, params.id);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    context.logger.error('Failed to fetch employee', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await createExecutionContext(request);
  
  try {
    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);

    const employee = await EmployeeService.updateEmployee(context, params.id, validatedData);

    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    context.logger.error('Failed to update employee', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await createExecutionContext(request);
  
  try {
    await EmployeeService.deleteEmployee(context, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    context.logger.error('Failed to delete employee', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
