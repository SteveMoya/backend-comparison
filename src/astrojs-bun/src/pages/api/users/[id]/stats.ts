import type { APIRoute } from 'astro';
import { queryOne, type User } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const userId = parseInt(params.id || '0');
  if (!userId || userId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid user ID' }), { status: 400 });
  }
  
  const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  
  const result = await queryOne<{ total: string; total_amount: string; avg_amount: string }>(
    'SELECT COUNT(*) as total, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM orders WHERE user_id = $1',
    [userId]
  );
  
  return new Response(JSON.stringify({
    totalOrders: parseInt(result?.total || '0'),
    totalAmount: parseFloat(result?.total_amount || '0'),
    avgAmount: parseFloat(result?.avg_amount || '0'),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};