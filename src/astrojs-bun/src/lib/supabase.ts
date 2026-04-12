import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'anonymous';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database client using postgres library for direct connections
import postgres from 'postgres';

const {
  POSTGRES_HOST = 'localhost',
  POSTGRES_PORT = '5432',
  POSTGRES_USER = 'benchmark',
  POSTGRES_PASSWORD = 'benchmark',
  POSTGRES_DB = 'benchmark',
} = process.env;

const connectionString = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

export const sql = postgres(connectionString);

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface Order {
  id: number;
  user_id: number;
  product: string;
  amount: number;
  status: string;
  created_at: Date;
}

export async function query<T>(queryString: string, params: unknown[] = []): Promise<T[]> {
  const result = await sql.unsafe(queryString, params);
  return result as T[];
}

export async function queryOne<T>(queryString: string, params: unknown[] = []): Promise<T | null> {
  const result = await sql.unsafe(queryString, params);
  return (result as T[])[0] ?? null;
}

export async function execute(queryString: string, params: unknown[] = []): Promise<void> {
  await sql.unsafe(queryString, params);
}