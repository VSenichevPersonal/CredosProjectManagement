import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { pool } from '@/lib/auth/lucia';
import type { Tag } from '@/types/domain';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const tagSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Некорректный hex-код цвета').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/tags
export async function GET(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:read');
    
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM tags WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
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

    const tags: Tag[] = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Count total
    const countResult = await pool.query('SELECT COUNT(*) FROM tags');
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({ data: tags, total });
  } catch (error: any) {
    ctx.logger.error('Failed to fetch tags', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tags
export async function POST(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:create');
    
    const body = await request.json();
    const data = tagSchema.parse(body);

    const result = await pool.query(
      `INSERT INTO tags (name, color, description, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        data.name,
        data.color || '#3B82F6',
        data.description || null,
        data.isActive !== undefined ? data.isActive : true,
      ]
    );

    const tag: Tag = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      color: result.rows[0].color,
      description: result.rows[0].description,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    ctx.logger.info('Tag created', { id: tag.id });
    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    ctx.logger.error('Failed to create tag', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

