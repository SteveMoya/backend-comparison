import { describe, expect, it } from 'bun:test';
import { app } from './app';

describe('health endpoint', () => {
  it('reports ok without touching the database', async () => {
    const response = await app.handle(new Request('http://localhost/health'));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; timestamp: number };
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('number');
  });
});
