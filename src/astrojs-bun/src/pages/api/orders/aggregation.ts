import type { APIRoute } from 'astro';
import { queryOne } from '../../../lib/supabase';

export const GET: APIRoute = async () => {
  const result = await queryOne<{
    total_orders: string;
    total_amount: string;
    avg_amount: string;
    min_amount: string;
    max_amount: string;
  }>(
    `SELECT 
      COUNT(*) as total_orders,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount,
      MIN(amount) as min_amount,
      MAX(amount) as max_amount
    FROM orders`
  );
  
  return new Response(JSON.stringify({
    totalOrders: parseInt(result?.total_orders || '0'),
    totalAmount: parseFloat(result?.total_amount || '0'),
    avgAmount: parseFloat(result?.avg_amount || '0'),
    minAmount: parseFloat(result?.min_amount || '0'),
    maxAmount: parseFloat(result?.max_amount || '0'),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};