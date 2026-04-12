import type { APIRoute } from 'astro';
import { queryOne, execute, type Order } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const orderId = parseInt(params.id || '0');
  if (!orderId || orderId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid order ID' }), { status: 400 });
  }
  
  const order = await queryOne<Order>(
    'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1',
    [orderId]
  );
  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }
  
  return new Response(JSON.stringify(order), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const orderId = parseInt(params.id || '0');
  if (!orderId || orderId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid order ID' }), { status: 400 });
  }
  
  const body = await request.json();
  const { product, amount, status } = body as { product?: string; amount?: number; status?: string };
  
  const existing = await queryOne<Order>('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }
  
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  
  if (product) {
    updates.push(`product = $${paramIndex++}`);
    values.push(product);
  }
  if (amount && amount > 0) {
    updates.push(`amount = $${paramIndex++}`);
    values.push(amount);
  }
  if (status) {
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  
  if (updates.length === 0) {
    return new Response(JSON.stringify(existing), { status: 200 });
  }
  
  values.push(orderId);
  const result = await queryOne<Order>(
    `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const orderId = parseInt(params.id || '0');
  if (!orderId || orderId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid order ID' }), { status: 400 });
  }
  
  const existing = await queryOne<Order>('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }
  
  await execute('DELETE FROM orders WHERE id = $1', [orderId]);
  
  return new Response(null, { status: 204 });
};