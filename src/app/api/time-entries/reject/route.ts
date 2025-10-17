import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const rejectSchema = z.object({
  timeEntryIds: z.array(z.string().uuid()),
  rejectedBy: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required'),
});

export async function POST(request: NextRequest) {
  const context = await createExecutionContext(request);
  
  try {
    const body = await request.json();
    context.logger.info('Rejecting time entries', { count: body.timeEntryIds?.length });

    const validatedData = rejectSchema.parse(body);

    // Reject time entries
    await context.db.timeEntries.reject(
      context, 
      validatedData.timeEntryIds,
      validatedData.rejectedBy,
      validatedData.reason
    );

    return NextResponse.json({ 
      success: true, 
      message: `${validatedData.timeEntryIds.length} time entries rejected successfully` 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      context.logger.warn('Validation error', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    context.logger.error('Failed to reject time entries', error);
    return NextResponse.json(
      { error: 'Failed to reject time entries' },
      { status: 500 }
    );
  }
}

