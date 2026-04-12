import type { APIRoute } from 'astro';
import { queryOne, query, type User, type Order } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const userId = parseInt(params.id || '0');
  if (!userId || userId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid user ID' }), { status: 400 });
  }
  
  const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  
  const orders = await query<Order>(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  return new Response(JSON.stringify({ ...user, orders }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};