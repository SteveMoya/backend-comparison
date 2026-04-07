import { Elysia } from 'elysia';
import { query, queryOne, execute, type Order } from '../database/db';

export const ordersRouter = new Elysia({ prefix: '/api/orders' })
  .post('/', async ({ body }) => {
    const { userId, amount, status = 'pending' } = body as {
      userId: number;
      amount: number;
      status?: string;
    };
    
    const user = await queryOne<{ id: number }>('SELECT id FROM users WHERE id = $1', [userId]);
    if (!user) {
      throw new Error('User not found');
    }
    
    const result = await queryOne<Order>(
      'INSERT INTO orders (user_id, amount, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, amount, status]
    );
    return result;
  })
  .get('/', async () => {
    const orders = await query<Order>(
      'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
    );
    return orders;
  })
  .get('/aggregation', async () => {
    const result = await queryOne<{ total: string; total_amount: string; avg_amount: string }>(
      'SELECT COUNT(*) as total, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM orders'
    );
    
    return {
      totalOrders: parseInt(result?.total || '0'),
      totalAmount: parseFloat(result?.total_amount || '0'),
      avgAmount: parseFloat(result?.avg_amount || '0'),
    };
  })
  .get('/:id', async ({ params: { id }, set }) => {
    const order = await queryOne<Order>(
      'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1',
      [parseInt(id)]
    );
    if (!order) {
      set.status = 404;
      throw new Error('Order not found');
    }
    return order;
  })
  .put('/:id', async ({ params: { id }, body }) => {
    const { status } = body as { status: string };
    const orderId = parseInt(id);
    
    const existing = await queryOne<Order>('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!existing) {
      throw new Error('Order not found');
    }
    
    const result = await queryOne<Order>(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, orderId]
    );
    return result;
  })
  .delete('/:id', async ({ params: { id }, set }) => {
    const orderId = parseInt(id);
    const existing = await queryOne<Order>('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!existing) {
      set.status = 404;
      throw new Error('Order not found');
    }
    
    await execute('DELETE FROM orders WHERE id = $1', [orderId]);
    set.status = 204;
  });