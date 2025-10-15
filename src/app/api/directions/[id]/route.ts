import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { DirectionService } from '@/services/direction-service';
import { z } from 'zod';

const updateDirectionSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  budget: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await createExecutionContext(request);
  
  try {
    const direction = await DirectionService.getDirectionById(context, params.id);

    if (!direction) {
      return NextResponse.json({ error: 'Direction not found' }, { status: 404 });
    }

    return NextResponse.json(direction);
  } catch (error) {
    context.logger.error('Failed to fetch direction', error);
    return NextResponse.json({ error: 'Failed to fetch direction' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await createExecutionContext(request);
  
  try {
    const body = await request.json();
    const validatedData = updateDirectionSchema.parse(body);

    const direction = await DirectionService.updateDirection(context, params.id, validatedData);

    return NextResponse.json(direction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    context.logger.error('Failed to update direction', error);
    return NextResponse.json({ error: 'Failed to update direction' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await createExecutionContext(request);
  
  try {
    await DirectionService.deleteDirection(context, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    context.logger.error('Failed to delete direction', error);
    return NextResponse.json({ error: 'Failed to delete direction' }, { status: 500 });
  }
}
