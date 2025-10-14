import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { FinanceService } from "@/services/finance.service"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const search = request.nextUrl.searchParams
    const filters = {
      projectId: search.get('projectId') || undefined,
      orderId: search.get('orderId') || undefined,
      dateFrom: search.get('dateFrom') || undefined,
      dateTo: search.get('dateTo') || undefined
    }
    const items = await FinanceService.getRevenues(ctx, filters)
    return Response.json(items)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const body = await request.json()
    const created = await FinanceService.createRevenue(ctx, body)
    return Response.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
