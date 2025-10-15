import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { ReportService } from '@/services/report-service';

// Отключаем статическую генерацию - эндпоинт требует runtime данные
export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/my-time?startDate=2024-01-01&endDate=2024-01-07
 * Отчёт по моему времени
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

    // Отчёт по текущему пользователю
    const data = await ReportService.getMyTimeReport(
      ctx,
      ctx.employeeId,
      startDate,
      endDate
    );

    return NextResponse.json(data);
  } catch (error) {
    ctx.logger.error('Failed to get my time report', error);
    return NextResponse.json(
      { error: 'Failed to get report' },
      { status: 500 }
    );
  }
}

