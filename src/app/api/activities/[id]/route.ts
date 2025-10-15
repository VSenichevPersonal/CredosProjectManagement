import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { pool } from '@/lib/auth/lucia';
import type { Activity, UpdateActivityDTO } from '@/types/domain';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateActivitySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  defaultHourlyRate: z.number().min(0).optional(),
  isBillable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/activities/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:read');
    
    const result = await pool.query(
      'SELECT * FROM activities WHERE id = $1',
      [params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    
    const row = result.rows[0];
    const activity: Activity = {
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      defaultHourlyRate: parseFloat(row.default_hourly_rate),
      isBillable: row.is_billable,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    return NextResponse.json(activity);
  } catch (error: any) {
    ctx.logger.error('Failed to fetch activity', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/activities/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:update');
    
    const body = await request.json();
    const data = updateActivitySchema.parse(body);
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      values.push(data.color);
    }
    if (data.defaultHourlyRate !== undefined) {
      fields.push(`default_hourly_rate = $${paramCount++}`);
      values.push(data.defaultHourlyRate);
    }
    if (data.isBillable !== undefined) {
      fields.push(`is_billable = $${paramCount++}`);
      values.push(data.isBillable);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }
    
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(params.id);
    
    const query = `
      UPDATE activities
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    
    const row = result.rows[0];
    const activity: Activity = {
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      defaultHourlyRate: parseFloat(row.default_hourly_rate),
      isBillable: row.is_billable,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    ctx.logger.info('Activity updated', { id: activity.id });
    return NextResponse.json(activity);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    ctx.logger.error('Failed to update activity', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/activities/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:delete');
    
    // Soft delete - устанавливаем is_active = false
    const result = await pool.query(
      'UPDATE activities SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    
    ctx.logger.info('Activity deleted (soft)', { id: params.id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    ctx.logger.error('Failed to delete activity', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

