import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/execution-context';
import { TimeEntryService } from '@/services/time-entry-service';
import { z } from 'zod';

const createTimeEntrySchema = z.object({
  employeeId: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().min(0).max(24),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const context = createExecutionContext('time-entries-api');
  
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    context.logger.info('Fetching time entries', { 
      employeeId, 
      startDate, 
      endDate 
    });

    const service = new TimeEntryService(context);
    
    if (employeeId && startDate && endDate) {
      const entries = await service.getEntriesByEmployeeAndDateRange(
        employeeId, 
        startDate, 
        endDate
      );
      return NextResponse.json(entries);
    } else if (employeeId) {
      const entries = await service.getEntriesByEmployee(employeeId);
      return NextResponse.json(entries);
    } else {
      const entries = await service.getAllEntries();
      return NextResponse.json(entries);
    }
  } catch (error) {
    context.logger.error('Failed to fetch time entries', error);
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const context = createExecutionContext('time-entries-api');
  
  try {
    const body = await request.json();
    context.logger.info('Creating time entry', body);

    const validatedData = createTimeEntrySchema.parse(body);
    const service = new TimeEntryService(context);
    
    // Проверяем, существует ли запись за этот день для этого проекта/задачи
    const existing = await service.getEntryByDateAndTask(
      validatedData.employeeId,
      validatedData.date,
      validatedData.taskId
    );

    let result;
    if (existing) {
      // Обновляем существующую запись
      result = await service.updateEntry(existing.id, {
        hours: validatedData.hours,
        description: validatedData.description || existing.description,
      });
      context.logger.info('Updated existing time entry', { id: existing.id });
    } else {
      // Создаем новую запись
      result = await service.createEntry(validatedData);
      context.logger.info('Created new time entry', { id: result.id });
    }

    return NextResponse.json(result, { status: existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      context.logger.warn('Validation error', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    context.logger.error('Failed to create time entry', error);
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    );
  }
}
