import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { EmployeeService } from '@/services/employee-service';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  fullName: z.string().min(1, "ФИО обязательно"),
  email: z.string().email("Неверный email"),
  phone: z.string().optional(),
  position: z.string().min(1, "Должность обязательна"),
  directionId: z.string().uuid("Неверный ID направления"),
  defaultHourlyRate: z.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const context = createExecutionContext(request);
  
  try {
    context.logger.info('Fetching employees with filters');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const filters = {
      search: searchParams.get('search') || undefined,
      directionId: searchParams.get('directionId') || undefined,
      limit,
      offset,
    };

    const result = await EmployeeService.getAllEmployees(context, filters);

    context.logger.info('Employees fetched', { 
      count: result.data.length, 
      total: result.total 
    });

    return NextResponse.json({
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    context.logger.error('Failed to fetch employees', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const context = createExecutionContext(request);
  
  try {
    const body = await request.json();
    context.logger.info('Creating employee', body);

    const validatedData = createEmployeeSchema.parse(body);

    const employee = await EmployeeService.createEmployee(context, validatedData);

    context.logger.info('Employee created', { id: employee.id });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      context.logger.warn('Validation error', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    context.logger.error('Failed to create employee', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
