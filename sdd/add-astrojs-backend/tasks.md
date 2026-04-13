# Tasks: Agregar AstroJS como 5to Backend a Benchmarks

## 1. Resumen de Tareas

| Métrica | Valor |
|--------|------|
| **Total de tareas** | 20 |
| **Fase 1: Infraestructura** | 4 tareas |
| **Fase 2: Implementación** | 10 tareas |
| **Fase 3: Testing** | 3 tareas |
| **Fase 4: Integración** | 3 tareas |

## 2. Liste de Tareas (ordered by dependency)

### Fase 1: Infraestructura

- [x] 1.1 Crear rama `feature/astrojs-bun` desde main
- [x] 1.2 Crear directorio `src/astrojs-bun/` con estructura base
- [x] 1.3 Crear `Dockerfile` con imagen `oven/bun:1-alpine` yExponer puerto 3004
- [x] 1.4 Agregar servicio `app-astrojs-bun` a `docker-compose.yml`

### Fase 2: Implementación

- [x] 2.1 Crear `package.json` con AstroJS, @astrojs/node, supabase-js, ioredis, typescript
- [x] 2.2 Crear `astro.config.mjs` con SSR adapter para Bun
- [x] 2.3 Crear cliente Supabase en `src/lib/supabase.ts` para conexión PostgreSQL
- [x] 2.4 Crear cliente Redis en `src/lib/redis.ts` para cache
- [x] 2.5 Crear tipos TypeScript en `src/types/index.ts` (User, Order, ApiResponse)
- [x] 2.6 Implementar endpoint `/health` en `src/routes/index.ts`
- [x] 2.7 Implementar CRUD Users: POST, GET `/api/users`, GET/PUT/DELETE `/api/users/:id`
- [x] 2.8 Implementar endpoints Users relacionados: `/api/users/:id/orders`, `/api/users/:id/stats`
- [x] 2.9 Implementar CRUD Orders: POST, GET `/api/orders`, GET/PUT/DELETE `/api/orders/:id`
- [x] 2.10 Implementar `/api/orders/aggregation` para agregaciones

### Fase 3: Testing

- [x] 3.1 Crear scripts k6 con puerto 3004 (smoke, load_short, load_100, stress_1000)
- [x] 3.2 Actualizar `run-benchmarks.sh` para incluir astrojs-bun en el loop
- [ ] 3.3 Probar manualmente todos los 14 endpoints con curl

### Fase 4: Integración

- [ ] 4.1 Ejecutar smoke test contra puerto 3004 y validar >= 70% checks OK
- [ ] 4.2 Ejecutar suite completa de benchmarks y capturar métricas
- [ ] 4.3 Actualizar README.md y report.md con resultados de AstroJS

## 3. Fase 1: Infraestructura

### 1.1 Crear Rama

```bash
git checkout -b feature/astrojs-bun
```

**Dependencias**: Ninguna (rama base desde main)

**Entregable**: Rama local `feature/astrojs-bun`

### 1.2 Estructura de Directorios

```
src/astrojs-bun/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
└── src/
    ├── entrypoint.ts
    ├── index.ts
    ├── lib/
    │   ├── supabase.ts
    │   ├── redis.ts
    │   └── cache.ts
    ├── routes/
    │   ├── index.ts
    │   ├── users.ts
    │   ├── users/[id].ts
    │   ├── users/[id]/orders.ts
    │   ├── users/[id]/stats.ts
    │   ├── orders.ts
    │   ├── orders/[id].ts
    │   └── orders/aggregation.ts
    ├── types/
    │   └── index.ts
    └── utils/
        ├── response.ts
        └── errors.ts
```

**Dependencias**: Ninguna

**Entregable**: Directorios y archivos configurados

### 1.3 Dockerfile

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3004
CMD ["bun", "src/index.ts"]
```

**Dependencias**: package.json

**Entregable**: Imagen Docker funcional

### 1.4 docker-compose.yml

Agregar servicio:

```yaml
app-astrojs-bun:
  build:
    context: ./src/astrojs-bun
    dockerfile: Dockerfile
  container_name: app-astrojs-bun
  ports:
    - "3004:3004"
  environment:
    - PORT=3004
    - POSTGRES_URL=postgres://benchmark:benchmark@postgres:5432/benchmark
    - REDIS_URL=redis://redis:6379
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost:3004/health"]
```

**Dependencias**: Dockerfile existente

**Entregable**: Servicio agregado a compose

## 4. Fase 2: Implementación

### 2.1 package.json

Dependencias principales:
- astro: ^5.0.0
- @astrojs/node: ^9.0.0
- @supabase/supabase-js: ^2.0.0
- ioredis: ^5.0.0
- typescript: ^5.0.0

**Dependencias**: Ninguna

**Entregable**: package.json con scripts (dev, build, start)

### 2.2 astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 3004 }
});
```

**Dependencias**: package.json

**Entregable**: Configuración SSR funcional

### 2.3 Cliente Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.POSTGRES_URL || 'postgres://benchmark:benchmark@postgres:5432/benchmark';
const key = process.env.SUPABASE_KEY || '';

export const supabase = createClient(url, key);
```

**Dependencias**: package.json, env vars

**Entregable**: Cliente con conexión a PostgreSQL

### 2.4 Cliente Redis

```typescript
// src/lib/redis.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true
});
```

**Dependencias**: package.json, env vars

**Entregable**: Cliente Redis con graceful degradation

### 2.5 Tipos TypeScript

```typescript
// src/types/index.ts
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  amount: number;
  status: string;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}
```

**Dependencias**: Ninguna

**Entregable**: Tipos reutilizables

### 2.6 Endpoint /health

```typescript
// src/routes/index.ts
export const GET = () => {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
};
```

**Dependencias**: astro.config.mjs, tipos

**Entregable**: Health check funcional

### 2.7 CRUD Users

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| /api/users | POST | Crear usuario |
| /api/users | GET | Listar (paginado, límite 20) |
| /api/users/:id | GET | Obtener por ID |
| /api/users/:id | PUT | Actualizar |
| /api/users/:id | DELETE | Eliminar |

**Dependencias**: cliente Supabase, tipos

**Entregable**: 5 endpoints funcionales

### 2.8 Users Relacionados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| /api/users/:id/orders | GET | JOIN query pedidos del usuario |
| /api/users/:id/stats | GET | Agregaciones: total_orders, total_spent, avg_order_value |

**Dependencias**: CRUD Users, tipos

**Entregable**: 2 endpoints funcionales

### 2.9 CRUD Orders

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| /api/orders | POST | Crear pedido |
| /api/orders | GET | Listar pedidos |
| /api/orders/:id | GET | Obtener por ID |
| /api/orders/:id | PUT | Actualizar estado |
| /api/orders/:id | DELETE | Eliminar |

**Dependencias**: cliente Supabase, tipos

**Entregable**: 5 endpoints funcionales

### 2.10 Orders Aggregation

```typescript
// src/routes/orders/aggregation.ts
export const GET = async () => {
  // SELECT COUNT(*), SUM(amount), AVG(amount) FROM orders
  const { data, error } = await supabase
    .from('orders')
    .select('id, amount');
  
  if (error) return Response.json({ error }, { status: 500 });
  
  const total = data.length;
  const revenue = data.reduce((sum, o) => sum + Number(o.amount), 0);
  
  return Response.json({
    total_orders: total,
    total_revenue: revenue,
    avg_order_value: total > 0 ? revenue / total : 0
  });
};
```

**Dependencias**: CRUD Orders

**Entregable**: Endpoint de agregaciones

## 5. Fase 3: Testing

### 3.1 Scripts k6

Copiar scripts existentes adaptando el puerto:

```bash
# smoke.js
k6 run smoke.js -e PORT=3004 -e BASE_URL=http://localhost:3004
```

Ubicación: `benchmarks/k6/astro-smoke.js`, `benchmarks/k6/astro-load.js`, etc.

**Dependencias**: Todos los endpoints implementados

**Entregable**: 4 scripts de benchmark

### 3.2 run-benchmarks.sh

Agregar astrojs-bun al array:

```bash
BACKENDS=("nodejs-nestjs" "bun" "go-gin" "python-fastapi" "astrojs-bun")
```

Y el caso:

```bash
"astrojs-bun" )
    PORT=3004
    CONTAINER="app-astrojs-bun"
    ;;
```

**Dependencias**: Scripts k6

**Entregable**: Script actualizado

### 3.3 Pruebas Manuales

```bash
# Health
curl http://localhost:3004/health

# Users
curl -X POST http://localhost:3004/api/users -H "Content-Type: application/json" -d '{"email":"test@test.com","name":"Test"}'
curl http://localhost:3004/api/users
curl http://localhost:3004/api/users/1
curl -X PUT http://localhost:3004/api/users/1 -H "Content-Type: application/json" -d '{"name":"Updated"}'
curl -X DELETE http://localhost:3004/api/users/1

# Orders
curl -X POST http://localhost:3004/api/orders -H "Content-Type: application/json" -d '{"user_id":1,"amount":100,"status":"pending"}'
curl http://localhost:3004/api/orders
curl http://localhost:3004/api/orders/1
curl http://localhost:3004/api/orders/aggregation

# Related
curl http://localhost:3004/api/users/1/orders
curl http://localhost:3004/api/users/1/stats
```

**Dependencias**: Todos los endpoints

**Entregable**: 14 respuestas exitosas (códigos 200/201/204)

## 6. Fase 4: Integración

### 4.1 Smoke Test

```bash
k6 run benchmarks/k6/astro-smoke.js
```

**Criterio de éxito**: >= 70% checks OK

**Dependencias**: Pruebas manuales pasando

**Entregable**: Resultados en JSON

### 4.2 Suite Completa

Ejecutar:
- smoke (10 VUs, 1min)
- load_short (50 VUs, 1min)
- load_100 (100 VUs, 1min)
- stress_1000 (1000 VUs, 3min)

Capturar métricas:
- RPS
- p95 Latencia
- p99 Latencia
- Error Rate
- CPU % (docker stats)
- Memoria (docker stats)

**Dependencias**: Smoke test pasando

**Entregable**: Comparativa completa

### 4.3 Documentación

Actualizar:
- README.md: Agregar AstroJS/Bun a tabla de tecnologías
- benchmarks/report.md: Agregar columna AstroJS a tablas de resultados
- PLAN.md: Actualizar estado

**Dependencias**: Suite completa ejecutada

**Entregable**: Documentación actualizada

## 7. Criterios de Éxito por Fase

| Fase | Criterio |
|------|----------|
| **Fase 1** | docker-compose up -d incluye app-astrojs-bun sin errores |
| **Fase 2** | Los 14 endpoints responden con códigos correctos |
| **Fase 3** | Scripts k6 ejecutan sin errores de sintaxis |
| **Fase 4** | smoke test >= 70% checks OK Y resultados comparables |

---

## Orden de Implementación Recomendado

1. Infra → Implementación → Testing → Integración (secuencial)
2. Las tareas dentro de cada fase son paralelizables para developers múltiples
3. Testing manual (3.3) es gate antes de ejecutar benchmarks reales
4. Documentación al final para reflejar resultados reales

## Información Crítica del Proyecto

| Aspecto | Detalle |
|--------|---------|
| Puerto nuevo | 3004 |
| Contenedor | app-astrojs-bun |
| Runtime | Bun (no Node.js) |
| Postgres | postgres://benchmark:benchmark@postgres:5432/benchmark |
| Redis | redis://redis:6379 |
| Schema | users (id, name, email, created_at), orders (id, user_id, amount, status, created_at) |
| Prefijo API | /api (excepto /health) |
| Formato errores | { "error": "mensaje" } |