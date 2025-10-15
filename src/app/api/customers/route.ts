import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { pool } from '@/lib/auth/lucia';
import type { Customer, CustomerFilters, CreateCustomerDTO } from '@/types/domain';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const customerSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  legalName: z.string().optional(),
  inn: z.string().optional(),
  kpp: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

// GET /api/customers
export async function GET(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:read'); // Любой сотрудник может читать клиентов
    
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR legal_name ILIKE $${paramIndex} OR inn ILIKE $${paramIndex})`;
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

    const customers: Customer[] = result.rows.map((row: any) => ({
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
    }));

    // Count total
    const countResult = await pool.query('SELECT COUNT(*) FROM customers');
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({ data: customers, total });
  } catch (error: any) {
    ctx.logger.error('Failed to fetch customers', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('employees:create'); // Только manager+ могут создавать
    
    const body = await request.json();
    const data = customerSchema.parse(body);

    const result = await pool.query(
      `INSERT INTO customers (name, legal_name, inn, kpp, contact_person, email, phone, address, website, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.name,
        data.legalName || null,
        data.inn || null,
        data.kpp || null,
        data.contactPerson || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.website || null,
        data.notes || null,
      ]
    );

    const customer: Customer = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      legalName: result.rows[0].legal_name,
      inn: result.rows[0].inn,
      kpp: result.rows[0].kpp,
      contactPerson: result.rows[0].contact_person,
      email: result.rows[0].email,
      phone: result.rows[0].phone,
      address: result.rows[0].address,
      website: result.rows[0].website,
      notes: result.rows[0].notes,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    ctx.logger.info('Customer created', { id: customer.id });
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    ctx.logger.error('Failed to create customer', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

