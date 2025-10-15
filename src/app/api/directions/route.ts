import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { DirectionService } from '@/services/direction-service';
import { z } from 'zod';

const createDirectionSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  code: z.string().optional(),
  description: z.string().optional(),
  budget: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const context = createExecutionContext(request);
  
  try {
    context.logger.info('Fetching directions with filters');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const filters = {
      search: searchParams.get('search') || undefined,
      limit,
      offset,
    };

    const result = await DirectionService.getAllDirections(context, filters);

    context.logger.info('Directions fetched', { 
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
    context.logger.error('Failed to fetch directions', error);
    return NextResponse.json(
      { error: 'Failed to fetch directions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const context = createExecutionContext(request);
  
  try {
    const body = await request.json();
    context.logger.info('Creating direction', body);

    const validatedData = createDirectionSchema.parse(body);

    const direction = await DirectionService.createDirection(context, validatedData);

    context.logger.info('Direction created', { id: direction.id });

    return NextResponse.json(direction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      context.logger.warn('Validation error', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    context.logger.error('Failed to create direction', error);
    return NextResponse.json(
      { error: 'Failed to create direction' },
      { status: 500 }
    );
  }
}
