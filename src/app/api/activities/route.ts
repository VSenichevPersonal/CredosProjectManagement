import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { pool } from '@/lib/auth/lucia';
import type { Activity, ActivityFilters, CreateActivityDTO } from '@/types/domain';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const activitySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  color: z.string().optional(),
  defaultHourlyRate: z.number().min(0).optional(),
  isBillable: z.boolean().optional(),
});

// GET /api/activities
export async function GET(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:read'); // Любой сотрудник может читать виды деятельности
    
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const isBillable = searchParams.get('isBillable');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM activities WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isBillable !== null && isBillable !== undefined) {
      query += ` AND is_billable = $${paramIndex}`;
      params.push(isBillable === 'true');
      paramIndex++;
    }

    if (isActive !== null && isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }

    query += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const activities: Activity[] = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      defaultHourlyRate: parseFloat(row.default_hourly_rate),
      isBillable: row.is_billable,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Count total
    const countResult = await pool.query('SELECT COUNT(*) FROM activities');
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({ data: activities, total });
  } catch (error: any) {
    ctx.logger.error('Failed to fetch activities', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/activities
export async function POST(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:create'); // Только manager+ могут создавать
    
    const body = await request.json();
    const data = activitySchema.parse(body);

    const result = await pool.query(
      `INSERT INTO activities (name, description, color, default_hourly_rate, is_billable)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.description || null,
        data.color || '#3B82F6',
        data.defaultHourlyRate || 0,
        data.isBillable !== undefined ? data.isBillable : true,
      ]
    );

    const activity: Activity = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      color: result.rows[0].color,
      defaultHourlyRate: parseFloat(result.rows[0].default_hourly_rate),
      isBillable: result.rows[0].is_billable,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    ctx.logger.info('Activity created', { id: activity.id });
    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    ctx.logger.error('Failed to create activity', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

