import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
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
  const context = await createExecutionContext(request);
  
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

    // Use static methods with filters
    const result = await TimeEntryService.getAllTimeEntries(context, {
      employeeId: employeeId || undefined,
      dateFrom: startDate || undefined,
      dateTo: endDate || undefined
    });
    
    return NextResponse.json(result);
  } catch (error) {
    context.logger.error('Failed to fetch time entries', error);
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const context = await createExecutionContext(request);
  
  try {
    const body = await request.json();
    context.logger.info('Creating time entry', body);

    const validatedData = createTimeEntrySchema.parse(body);
    
    // TODO: Add duplicate check when repository is fully implemented
    
    // Create new time entry
    const result = await TimeEntryService.createTimeEntry(context, validatedData);
    context.logger.info('Created new time entry', { id: result.id });

    return NextResponse.json(result, { status: 201 });
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
