import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'benchmark',
  password: process.env.POSTGRES_PASSWORD || 'benchmark',
  database: process.env.POSTGRES_DB || 'benchmark',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface Order {
  id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: Date;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
  const result = await pool.query(text, params);
  return result.rowCount || 0;
}