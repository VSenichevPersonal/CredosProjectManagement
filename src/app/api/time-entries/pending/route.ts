import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const context = await createExecutionContext(request);
  
  try {
    context.logger.info('Fetching pending time entries for approval');

    // Get pending time entries using DatabaseProvider
    const pendingEntries = await context.db.timeEntries.getPendingApprovals(context);
    
    return NextResponse.json({ data: pendingEntries, total: pendingEntries.length });
  } catch (error) {
    context.logger.error('Failed to fetch pending time entries', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending time entries' },
      { status: 500 }
    );
  }
}

