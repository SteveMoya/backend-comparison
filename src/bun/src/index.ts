import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { usersRouter } from './users/users.routes';
import { ordersRouter } from './orders/orders.routes';

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Backend Comparison - Bun',
          version: '1.0.0',
          description: 'API for benchmark comparison - Bun runtime',
        },
      },
    }),
  )
  .get('/health', () => ({ status: 'ok', timestamp: Date.now() }))
  .use(usersRouter)
  .use(ordersRouter)
  .listen(3001);

console.log(`🚀 Bun server running on port ${app.server?.port}`);

export type App = typeof app;