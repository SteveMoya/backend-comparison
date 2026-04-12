import type { APIRoute } from 'astro';
import { query, queryOne, execute, type User, type Order } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  
  const data = await query<User>(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  const totalResult = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users');
  const total = parseInt(totalResult?.count || '0');
  
  return new Response(JSON.stringify({ data, total, page, limit }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, email } = body as { name: string; email: string };
  
  if (!name || name.length > 100) {
    return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400 });
  }
  if (!email || email.length > 255) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
  }
  
  const existing = await queryOne<User>('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 409 });
  }
  
  const result = await queryOne<User>(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};