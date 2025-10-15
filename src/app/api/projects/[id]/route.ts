import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { ProjectService } from '@/services/project-service';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  directionId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = createExecutionContext(request);
  
  try {
    context.logger.info('Fetching project', { id: params.id });

    const project = await ProjectService.getProjectById(context, params.id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    context.logger.error('Failed to fetch project', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = createExecutionContext(request);
  
  try {
    const body = await request.json();
    context.logger.info('Updating project', { id: params.id, ...body });

    const validatedData = updateProjectSchema.parse(body);

    const project = await ProjectService.updateProject(context, params.id, validatedData);

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      context.logger.warn('Validation error', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    context.logger.error('Failed to update project', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = createExecutionContext(request);
  
  try {
    context.logger.info('Deleting project', { id: params.id });

    await ProjectService.deleteProject(context, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    context.logger.error('Failed to delete project', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
