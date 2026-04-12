import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: Date.now(),
    service: 'astrojs-bun'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};