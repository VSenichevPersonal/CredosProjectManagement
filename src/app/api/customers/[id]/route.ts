import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { pool } from '@/lib/auth/lucia';
import type { Customer, UpdateCustomerDTO } from '@/types/domain';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  legalName: z.string().optional(),
  inn: z.string().optional(),
  kpp: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/customers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:read');
    
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    const row = result.rows[0];
    const customer: Customer = {
      id: row.id,
      name: row.name,
      legalName: row.legal_name,
      inn: row.inn,
      kpp: row.kpp,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      address: row.address,
      website: row.website,
      notes: row.notes,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    return NextResponse.json(customer);
  } catch (error: any) {
    ctx.logger.error('Failed to fetch customer', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:update');
    
    const body = await request.json();
    const data = updateCustomerSchema.parse(body);
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.legalName !== undefined) {
      fields.push(`legal_name = $${paramCount++}`);
      values.push(data.legalName);
    }
    if (data.inn !== undefined) {
      fields.push(`inn = $${paramCount++}`);
      values.push(data.inn);
    }
    if (data.kpp !== undefined) {
      fields.push(`kpp = $${paramCount++}`);
      values.push(data.kpp);
    }
    if (data.contactPerson !== undefined) {
      fields.push(`contact_person = $${paramCount++}`);
      values.push(data.contactPerson);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(data.email || null);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }
    if (data.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(data.address);
    }
    if (data.website !== undefined) {
      fields.push(`website = $${paramCount++}`);
      values.push(data.website || null);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(data.notes);
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
      UPDATE customers
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    const row = result.rows[0];
    const customer: Customer = {
      id: row.id,
      name: row.name,
      legalName: row.legal_name,
      inn: row.inn,
      kpp: row.kpp,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      address: row.address,
      website: row.website,
      notes: row.notes,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    ctx.logger.info('Customer updated', { id: customer.id });
    return NextResponse.json(customer);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    ctx.logger.error('Failed to update customer', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:delete');
    
    // Soft delete - устанавливаем is_active = false
    const result = await pool.query(
      'UPDATE customers SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    ctx.logger.info('Customer deleted (soft)', { id: params.id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    ctx.logger.error('Failed to delete customer', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

