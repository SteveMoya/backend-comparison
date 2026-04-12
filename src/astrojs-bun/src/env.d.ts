/// <reference types="astro/client" />

interface Env {
  readonly POSTGRES_HOST: string;
  readonly POSTGRES_PORT: string;
  readonly POSTGRES_USER: string;
  readonly POSTGRES_PASSWORD: string;
  readonly POSTGRES_DB: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly REDIS_URL: string;
  readonly PORT: string;
}

declare namespace App {
  interface Locals extends Env {}
}