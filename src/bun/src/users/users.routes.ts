import { Elysia, t } from 'elysia';
import { query, queryOne, execute, type User, type Order } from '../database/db';

const createUserSchema = t.Object({
  name: t.string({ minLength: 1, maxLength: 100 }),
  email: t.string({ format: 'email', maxLength: 255 }),
});

const updateUserSchema = t.Object({
  name: t.optional(t.string({ minLength: 1, maxLength: 100 })),
  email: t.optional(t.string({ format: 'email', maxLength: 255 })),
});

export const usersRouter = new Elysia({ prefix: '/api/users' })
  .post('/', async ({ body }) => {
    const { name, email } = body as { name: string; email: string };
    
    const existing = await queryOne<User>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      throw new Error('Email already exists');
    }
    
    const result = await queryOne<User>(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    return result;
  }, {
    body: createUserSchema,
  })
  .get('/', async ({ query: { page = '1', limit = '10' } }) => {
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    const data = await query<User>(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limitNum, offset]
    );
    const totalResult = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users');
    const total = parseInt(totalResult?.count || '0');
    
    return { data, total, page: pageNum, limit: limitNum };
  })
  .get('/:id', async ({ params: { id }, set }) => {
    const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
    if (!user) {
      set.status = 404;
      throw new Error('User not found');
    }
    return user;
  }, {
    params: t.Object({ id: t.String() }),
  })
  .put('/:id', async ({ params: { id }, body }) => {
    const { name, email } = body as { name?: string; email?: string };
    const userId = parseInt(id);
    
    const existing = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
    if (!existing) {
      throw new Error('User not found');
    }
    
    if (email && email !== existing.email) {
      const emailExists = await queryOne<User>('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (emailExists) {
        throw new Error('Email already exists');
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
    
    if (updates.length === 0) return existing;
    
    values.push(userId);
    const result = await queryOne<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result;
  }, {
    params: t.Object({ id: t.String() }),
    body: updateUserSchema,
  })
  .delete('/:id', async ({ params: { id }, set }) => {
    const userId = parseInt(id);
    const existing = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
    if (!existing) {
      set.status = 404;
      throw new Error('User not found');
    }
    
    await execute('DELETE FROM users WHERE id = $1', [userId]);
    set.status = 204;
  }, {
    params: t.Object({ id: t.String() }),
  })
  .get('/:id/orders', async ({ params: { id } }) => {
    const userId = parseInt(id);
    const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user) {
      throw new Error('User not found');
    }
    
    const orders = await query<Order>(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return { ...user, orders };
  }, {
    params: t.Object({ id: t.String() }),
  })
  .get('/:id/stats', async ({ params: { id } }) => {
    const userId = parseInt(id);
    const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user) {
      throw new Error('User not found');
    }
    
    const result = await queryOne<{ total: string; total_amount: string; avg_amount: string }>(
      'SELECT COUNT(*) as total, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM orders WHERE user_id = $1',
      [userId]
    );
    
    return {
      totalOrders: parseInt(result?.total || '0'),
      totalAmount: parseFloat(result?.total_amount || '0'),
      avgAmount: parseFloat(result?.avg_amount || '0'),
    };
  }, {
    params: t.Object({ id: t.String() }),
  });