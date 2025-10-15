import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { ReportService } from '@/services/report-service';

/**
 * GET /api/reports/utilization?startDate=2024-01-01&endDate=2024-01-07
 * Отчёт по загрузке сотрудников
 */
export async function GET(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const data = await ReportService.getEmployeeUtilization(ctx, startDate, endDate);

    return NextResponse.json(data);
  } catch (error) {
    ctx.logger.error('Failed to get employee utilization report', error);
    return NextResponse.json(
      { error: 'Failed to get report' },
      { status: 500 }
    );
  }
}

