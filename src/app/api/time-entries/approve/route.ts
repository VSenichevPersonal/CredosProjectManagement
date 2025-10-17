import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const approveSchema = z.object({
  timeEntryIds: z.array(z.string().uuid()),
  approved: z.boolean(),
  approvedBy: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const context = await createExecutionContext(request);
  
  try {
    const body = await request.json();
    context.logger.info('Approving time entries', { count: body.timeEntryIds?.length });

    const validatedData = approveSchema.parse(body);

    // Approve each time entry
    for (const timeEntryId of validatedData.timeEntryIds) {
      await context.db.timeEntries.approve(context, {
        timeEntryId,
        approved: validatedData.approved,
        approvedBy: validatedData.approvedBy,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${validatedData.timeEntryIds.length} time entries approved successfully` 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      context.logger.warn('Validation error', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    context.logger.error('Failed to approve time entries', error);
    return NextResponse.json(
      { error: 'Failed to approve time entries' },
      { status: 500 }
    );
  }
}

