# Design Técnico: AstroJS Backend para Benchmarks

## 1. Arquitectura Técnica

### 1.1 Stack Tecnológico

El quinto backend usará la siguiente combinación de tecnologías:

| Componente | Tecnología | Versión | Propósito |
|------------|-------------|---------|-----------|
| Framework | AstroJS | 5.x | Servidor SSR con endpoints API |
| Runtime | Bun | 1.x | Ejecución de JavaScript/TypeScript |
| Database Client | Supabase JS | 2.x | Cliente PostgreSQL |
| Cache | ioredis | 5.x | Cliente Redis para caché |
| Lenguaje | TypeScript | 5.x | Tipado estático |

### 1.2 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE k6 (Benchmarks)                     │
│                        localhost:PORT (3004)                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTENEDOR: app-astrojs-bun                       │
│                         (Puerto 3004)                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                │
│  │   Routes    │   │   Lib       │   │   Types    │                │
│  │  /health    │   │ supabase.ts │   │  User.ts   │                │
│  │  /api/users │   │  redis.ts   │   │  Order.ts  │                │
│  │  /api/orders│   │             │   │            │                │
│  └─────────────┘   └─────────────┘   └─────────────┘                │
│         │                 │                                        │
└─────────┼─────────────────┼────────────────────────────────────────┘
          │                 │
    ┌─────┴─────┐     ┌─────┴─────┐
    ▼           ▼     ▼           ▼
┌─────────┐ ┌─────────┐
│PostgreSQL│ │  Redis  │
│  :5432  │ │  :6379  │
└─────────┘ └─────────┘
```

### 1.3 Decisiones de Arquitectura

**A. Modo SSR con AstroJS**

AstroJS por defecto genera sitios estáticos. Para un backend API necesitamos el modo SSR (Server-Side Rendering). Esto se configura mediante el adapter `@astrojs/node` configurado para el runtime Bun.

- **Justificación**: AstroJS SSR permite crear endpoints API REST usando la misma base de código que用于网页渲染，适合作为后端基准测试。
- **Trade-off**: Modo SSR tiene más overhead que frameworks backend nativos, pero es exactamente lo que queremos medir.

**B. Arquitectura de Capas**

```
routes/ → lib/ → tipos/
   │        │        │
   ▼        ▼        ▼
Endpoint Handler  DB/Redis  TypeScript Types
```

- **routes/**: Define los endpoints HTTP y maneja request/response
- **lib/**: Lógica de acceso a datos (supabase, redis)
- **types/**: Definiciones de tipos TypeScript

**C. Patrón de Caché con Redis**

Estrategia de caché: Write-through limitado, lectura optimizada.

- GET /api/users: Cachear respuesta completa con TTL 60s
- POST/PUT/DELETE: Invalidar caché relevante
- TTL reducido para mantener datos frescos

---

## 2. Estructura de Archivos

### 2.1 Directorio Raíz del Proyecto

```
src/astrojs-bun/
├── astro.config.mjs          # Configuración de Astro SSR
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración TypeScript
├── Dockerfile                 # Imagen Docker con Bun
├── .env.example               # Variables de entorno ejemplo
└── src/
    ├── entrypoint.ts          # Punto de entrada para Bun
    ├── index.ts              # App principal export
    ├── lib/
    │   ├── supabase.ts       # Cliente Supabase
    │   ├── redis.ts          # Cliente Redis
    │   └── cache.ts          # Utilidades de caché
    ├── routes/
    │   ├── index.ts          # GET /health
    │   ├── users.ts          # CRUD Users (list, create)
    │   ├── users/[id].ts     # GET/PUT/DELETE /users/:id
    │   ├── users/[id]/orders.ts  # GET /users/:id/orders
    │   ├── users/[id]/stats.ts   # GET /users/:id/stats
    │   ├── orders.ts         # CRUD Orders (list, create)
    │   ├── orders/[id].ts    # GET/PUT/DELETE /orders/:id
    │   └── orders/aggregation.ts # GET /orders/aggregation
    ├── types/
    │   └── index.ts          # Tipos User, Order, ApiResponse
    └── utils/
        ├── response.ts       # Helper responses JSON
        └── errors.ts         # Manejo de errores
```

### 2.2 Propósito de Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `astro.config.mjs` | Configura Astro en modo node con adapter para Bun |
| `Dockerfile` | Imagen base oven/bun:1-alpine, exponer puerto 3004 |
| `src/lib/supabase.ts` | Inicializa cliente Supabase con POSTGRES_URL |
| `src/lib/redis.ts` | Inicializa cliente Redis con REDIS_URL |
| `src/routes/index.ts` | Endpoint /health sin prefijo /api |
| `src/routes/users.ts` | POST /api/users, GET /api/users |

---

## 3. Decisiones Técnicas Clave

### 3.1 Por qué AstroJS en modo SSR (no static)

**Razón principal**: Medir el rendimiento de AstroJS como backend API.

Astro es principalmente un framework de frontend, pero su modo SSR permite crear API endpoints. Esto es exactamente lo que queremos comparar: ¿cómo se comporta un framework diseñado para rendering vs frameworks nativos como Gin o Elysia?

**Trade-offs**:
- ✅ Mayor overhead que frameworks nativos (esperado, es lo que medimos)
- ✅ Código consistente con la tendencia "full-stack" moderna
- ✅ Posibilidad de servir páginas + API desde el mismo proceso

### 3.2 Por qué Bun como runtime

**Razón principal**: Consistency con el benchmark de Bun existente.

El proyecto actual en `src/bun` usa Bun con Elysia. Agregar AstroJS con Bun permite:
- Aislar la variable "framework" (Elysia vs AstroJS)
- Mantener constante la variable "runtime" (Bun)

Esto sigue el principio de control de variables en experimentos científicos.

**Ventajas de Bun**:
- Runtime más rápido que Node.js para muchos workloads
- Compatible con TypeScript nativo
- Imagen Docker más pequeña (alpine)

### 3.3 Por qué Supabase (vs PostgreSQL directo)

**Razón principal**: Abstracción de más alto nivel para comparar con otros backends.

Supabase client ofrece:
- ORM-like con tipos TypeScript
- Queries tipadas automáticamente
- Manejo de conexiones pooling

**Trade-off vs pg (driver directo)**:
- Más overhead que queries directas
- Pero más parecido a lo que haría un desarrollador real
- Permite comparar "overhead de abstracción" entre tecnologías

**Decisión**: Usar Supabase client pero con queries planas (no usar features avanzada de Supabase como auth, realtime) para mantener comparabilidad.

### 3.4 Por qué Redis (caching strategy)

**Razón principal**: Medir impacto de caché en rendimiento.

Los otros backends no usan caché activamente. Sin embargo, incluir Redis permite:
- Medir overhead de conexión Redis
- Implementar estrategia de caché básica (60s TTL en GET /api/users)
- Comparar rendimiento con y sin caché

**Estrategia de implementación**:
- Solo cachear endpoints de lectura (GET)
- TTL de 60 segundos
- Invalidación en operaciones de escritura
- Graceful degradation si Redis no está disponible

---

## 4. Integración con Infraestructura Existente

### 4.1 Conexión a PostgreSQL Existente

**Puerto**: 5432 (servicio `benchmark-postgres` en Docker Compose)

**Connection String**:
```
POSTGRES_URL=postgres://postgres:postgres@benchmark-postgres:5432/postgres
```

**Configuración en código**:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://benchmark-postgres:5432'
const supabaseKey = process.env.SUPABASE_KEY || 'anonymous'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
})
```

**Schema esperado**: Tablas `users` y `orders` existentes en el proyecto.

### 4.2 Conexión a Redis Existente

**Puerto**: 6379 (servicio `benchmark-redis` en Docker Compose)

**Connection String**:
```
REDIS_URL=redis://benchmark-redis:6379
```

**Configuración en código**:
```typescript
// src/lib/redis.ts
import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || 'redis://benchmark-redis:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
})
```

### 4.3 Variables de Entorno Necesarias

| Variable | Valor por defecto | Requerido | Descripción |
|----------|-------------------|-----------|-------------|
| PORT | 3004 | Sí | Puerto del servidor |
| POSTGRES_URL | postgres://postgres:postgres@benchmark-postgres:5432/postgres | Sí | Connection string PostgreSQL |
| REDIS_URL | redis://benchmark-redis:6379 | No | Connection string Redis (graceful if missing) |
| NODE_ENV | production | No | Modo de ejecución |
| SUPABASE_URL | http://benchmark-postgres:5432 | No | URL para cliente Supabase |
| SUPABASE_KEY | (empty) | No | Key para cliente Supabase |

### 4.4 Actualización de docker-compose.yml

Agregar el servicio:

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
    - POSTGRES_URL=postgres://postgres:postgres@benchmark-postgres:5432/postgres
    - REDIS_URL=redis://benchmark-redis:6379
    - NODE_ENV=production
  depends_on:
    benchmark-postgres:
      condition: service_healthy
    benchmark-redis:
      condition: service_started
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost:3004/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 10s
```

---

## 5. API Design

### 5.1 Listado de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /health | Health check básico (sin prefijo /api) |
| POST | /api/users | Crear usuario |
| GET | /api/users | Listar usuarios (paginado, límite 20) |
| GET | /api/users/:id | Obtener usuario por ID |
| PUT | /api/users/:id | Actualizar usuario |
| DELETE | /api/users/:id | Eliminar usuario |
| GET | /api/users/:id/orders | JOIN query: pedidos del usuario |
| GET | /api/users/:id/stats | Agregación: estadísticas del usuario |
| POST | /api/orders | Crear pedido |
| GET | /api/orders | Listar pedidos (paginado) |
| GET | /api/orders/:id | Obtener pedido por ID |
| PUT | /api/orders/:id | Actualizar estado del pedido |
| DELETE | /api/orders/:id | Eliminar pedido |
| GET | /api/orders/aggregation | Agregaciones globales |

### 5.2 Request/Response Schemas

#### Health Check

```
GET /health

Response (200):
{ "status": "ok", "timestamp": "2026-04-12T..." }
```

#### Users - Create

```
POST /api/users
Content-Type: application/json

Request:
{ "email": "string", "name": "string" }

Response (201):
{ "id": number, "email": "string", "name": "string", "created_at": "string" }
```

#### Users - List

```
GET /api/users?page=1&limit=20

Response (200):
{
  "data": [
    { "id": number, "email": "string", "name": "string", "created_at": "string" }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

#### Users - Get by ID

```
GET /api/users/:id

Response (200):
{ "id": number, "email": "string", "name": "string", "created_at": "string" }

Response (404):
{ "error": "User not found" }
```

#### Users - Update

```
PUT /api/users/:id
Content-Type: application/json

Request:
{ "email": "string", "name": "string" }

Response (200):
{ "id": number, "email": "string", "name": "string", "created_at": "string" }
```

#### Users - Delete

```
DELETE /api/users/:id

Response (204): (empty)
```

#### Users - Orders

```
GET /api/users/:id/orders

Response (200):
{
  "user_id": number,
  "orders": [
    { "id": number, "user_id": number, "total": number, "status": "string", "created_at": "string" }
  ]
}
```

#### Users - Stats

```
GET /api/users/:id/stats

Response (200):
{
  "user_id": number,
  "total_orders": number,
  "total_spent": number,
  "avg_order_value": number
}
```

#### Orders - Create

```
POST /api/orders
Content-Type: application/json

Request:
{ "user_id": number, "total": number, "status": "pending" }

Response (201):
{ "id": number, "user_id": number, "total": number, "status": "string", "created_at": "string" }
```

#### Orders - Aggregation

```
GET /api/orders/aggregation

Response (200):
{
  "total_orders": number,
  "total_revenue": number,
  "avg_order_value": number
}
```

### 5.3 Estrategia de Manejo de Errores

**Códigos de estado HTTP**:

| Código | Uso |
|--------|-----|
| 200 | Success |
| 201 | Created |
| 204 | No Content (delete) |
| 400 | Bad Request (validación) |
| 404 | Not Found |
| 500 | Internal Server Error |

**Formato de errores**:
```json
{ "error": "mensaje descriptivo" }
```

**Middleware de errores**:
- Catch de excepciones no controladas
- Logging de errores a consola
- Response consistente con formato JSON

---

## 6. Benchmarks Integration

### 6.1 Scripts k6 Existentes

Los scripts actuales están en `benchmarks/k6/`:
- `smoke.js` - 10 VUs, 1 min
- `load_short.js` - 50 VUs, 1 min
- `load_100.js` - 100 VUs, 1 min
- `stress_1000.js` - 1000 VUs, 3 min

**Cambio necesario**: Agregar variable de entorno PORT para apuntar al backend correcto.

### 6.2 Ejecución contra Puerto 3004

```bash
# Smoke test
k6 run benchmarks/k6/smoke.js -e PORT=3004 -e BASE_URL=http://localhost:3004

# Load 50
k6 run benchmarks/k6/load_short.js -e PORT=3004 -e BASE_URL=http://localhost:3004

# Load 100
k6 run benchmarks/k6/load_100.js -e PORT=3004 -e BASE_URL=http://localhost:3004

# Stress
k6 run benchmarks/k6/stress_1000.js -e PORT=3004 -e BASE_URL=http://localhost:3004
```

### 6.3 Cambios en run-benchmarks.sh

El script actual tiene un switch con los backends:

```bash
# Agregar caso para astrojs-bun
"astrojs-bun" )
    PORT=3004
    CONTAINER="app-astrojs-bun"
    ;;
```

**Estructura actual (aproximada)**:
```bash
# Array de backends
BACKENDS=("nodejs-nestjs" "bun" "go-gin" "python-fastapi")

# Agregar "astrojs-bun" al array

# Loop ejecuta cada backend con su puerto
```

### 6.4 Métricas a Capturar

Igual que otros backends:

| Métrica | Herramienta |
|---------|-------------|
| RPS | k6 |
| p95 Latencia | k6 |
| p99 Latencia | k6 |
| Error Rate | k6 |
| CPU % | docker stats |
| Memoria | docker stats |

### 6.5 Outputs de Resultados

- JSON: `benchmarks/results/astrojs-smoke.json`
- JSON: `benchmarks/results/astrojs-load-50.json`
- JSON: `benchmarks/results/astrojs-load-100.json`
- JSON: `benchmarks/results/astrojs-stress.json`

---

## 7. Pasos de Implementación (Secuencial)

1. **Crear rama**: `git checkout -b feature/astrojs-bun`
2. **Scaffold proyecto**: Inicializar package.json con Astro + dependencias
3. **Configurar Astro SSR**: Crear astro.config.mjs con adapter node
4. **Crear cliente Supabase**: Configurar conexión a PostgreSQL
5. **Crear cliente Redis**: Configurar conexión a Redis
6. **Implementar endpoint /health**: Health check básico
7. **Implementar CRUD Users**: POST, GET /api/users, GET/PUT/DELETE /api/users/:id
8. **Implementar endpoints User relacionados**: /users/:id/orders, /users/:id/stats
9. **Implementar CRUD Orders**: POST, GET /api/orders, GET/PUT/DELETE /api/orders/:id
10. **Implementar /api/orders/aggregation**: Agregaciones
11. **Crear Dockerfile**: Imagen con oven/bun:1-alpine
12. **Actualizar docker-compose.yml**: Agregar servicio app-astrojs-bun
13. **Probar manualmente**: Verificar todos los endpoints
14. **Crear scripts k6 de benchmark**: Copies con puerto 3004
15. **Ejecutar smoke test**: Validar funcionamiento
16. **Ejecutar suite completa**: Comparar con otros backends

---

## 8. Riesgos y Mitigaciones

| Riesgo | Likelihood | Impacto | Mitigación |
|--------|------------|---------|------------|
| AstroJS no está diseñado como backend | Medium | Alto | Usar modo SSR con endpoints, no Pages |
| Supabase client overhead | Medium | Medio | Medir impacto, usar raw queries si es necesario |
| Caché Redis no usado efectivamente | Low | Bajo | Implementar cache básico, medir mejora |
| Incompatibilidad con benchmarks | Low | Alto | Seguir exactamente la misma estructura de endpoints |
| Dockerfile no funciona con Bun | Low | Alto | Testear build local antes de push |

---

## 9. Criterios de Éxito

- [ ] Servidor AstroJS corre en puerto 3004
- [ ] Endpoint /health responde correctamente
- [ ] Todos los 14 endpoints implementados y funcionales
- [ ] Smoke test pasa con >= 70% checks OK
- [ ] Métricas de benchmarks capturadas (RPS, latencia, memoria, CPU)
- [ ] Resultados comparables con los 4 backends existentes
- [ ] docker-compose.yml incluye el nuevo servicio
- [ ] run-benchmarks.sh actualizado para ejecutar contra puerto 3004

---

*Documento generado: 2026-04-12*
*Proyecto: backend-comparison*
*SDD Phase: Design*