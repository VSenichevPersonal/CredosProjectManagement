import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { pool } from '@/lib/auth/lucia';
import type { Tag } from '@/types/domain';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Некорректный hex-код цвета').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/tags/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:read');
    
    const result = await pool.query(
      'SELECT * FROM tags WHERE id = $1',
      [params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    const row = result.rows[0];
    const tag: Tag = {
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    return NextResponse.json(tag);
  } catch (error: any) {
    ctx.logger.error('Failed to fetch tag', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/tags/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:update');
    
    const body = await request.json();
    const data = updateTagSchema.parse(body);
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      values.push(data.color);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
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
      UPDATE tags
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    const row = result.rows[0];
    const tag: Tag = {
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    ctx.logger.info('Tag updated', { id: tag.id });
    return NextResponse.json(tag);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    ctx.logger.error('Failed to update tag', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tags/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:delete');
    
    // Soft delete - устанавливаем is_active = false
    const result = await pool.query(
      'UPDATE tags SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    ctx.logger.info('Tag deleted (soft)', { id: params.id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    ctx.logger.error('Failed to delete tag', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

