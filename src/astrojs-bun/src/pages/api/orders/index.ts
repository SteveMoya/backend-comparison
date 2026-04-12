import type { APIRoute } from 'astro';
import { query, queryOne, execute, type Order, type User } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  
  const data = await query<Order>(
    'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  const totalResult = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM orders');
  const total = parseInt(totalResult?.count || '0');
  
  return new Response(JSON.stringify({ data, total, page, limit }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { user_id, product, amount, status } = body as { user_id: number; product: string; amount: number; status?: string };
  
  if (!user_id || user_id <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid user_id' }), { status: 400 });
  }
  if (!product || product.length > 255) {
    return new Response(JSON.stringify({ error: 'Invalid product' }), { status: 400 });
  }
  if (!amount || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
  }
  
  const user = await queryOne<User>('SELECT id FROM users WHERE id = $1', [user_id]);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  
  const result = await queryOne<Order>(
    'INSERT INTO orders (user_id, product, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [user_id, product, amount, status || 'pending']
  );
  
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};