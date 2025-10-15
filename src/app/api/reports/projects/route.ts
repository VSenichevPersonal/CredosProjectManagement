import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { ReportService } from '@/services/report-service';

// Отключаем статическую генерацию - эндпоинт требует runtime данные
export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/projects
 * Отчёт по бюджетам проектов
 */
export async function GET(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    const data = await ReportService.getProjectBudgetReport(ctx);

    return NextResponse.json(data);
  } catch (error) {
    ctx.logger.error('Failed to get project budget report', error);
    return NextResponse.json(
      { error: 'Failed to get report' },
      { status: 500 }
    );
  }
}

