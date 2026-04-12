import type { APIRoute } from 'astro';
import { query, queryOne, execute, type User, type Order } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const userId = parseInt(params.id || '0');
  if (!userId || userId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid user ID' }), { status: 400 });
  }
  
  const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  
  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const userId = parseInt(params.id || '0');
  if (!userId || userId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid user ID' }), { status: 400 });
  }
  
  const body = await request.json();
  const { name, email } = body as { name?: string; email?: string };
  
  const existing = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  
  if (email && email !== existing.email) {
    const emailExists = await queryOne<User>('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (emailExists) {
      return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 409 });
    }
  }
  
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  
  if (name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (email) {
    updates.push(`email = $${paramIndex++}`);
    values.push(email);
  }
  
  if (updates.length === 0) {
    return new Response(JSON.stringify(existing), { status: 200 });
  }
  
  values.push(userId);
  const result = await queryOne<User>(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const userId = parseInt(params.id || '0');
  if (!userId || userId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid user ID' }), { status: 400 });
  }
  
  const existing = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  
  await execute('DELETE FROM users WHERE id = $1', [userId]);
  
  return new Response(null, { status: 204 });
};