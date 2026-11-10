# Cómo contribuir

Runtime Bench compara runtimes y frameworks backend con la misma API, el mismo esquema y el mismo generador de carga. Contribuir no pide permiso ni experiencia previa en el proyecto: pide un adaptador que cumpla el contrato.

## Preparar el entorno

Requisitos: Node.js 20 o superior, Docker y Docker Compose.

```bash
npm install
npm test                 # 19 pruebas, sin Docker
node scripts/bench.mjs validate
node scripts/bench.mjs list
```

## Agregar un adaptador en menos de una hora

El trabajo es siempre el mismo. Si ya hay una implementación equivalente en otro lenguaje, el adaptador nuevo es una traducción con el mismo contrato.

### 1. Copiá la estructura

Elegí un `id` en kebab-case. El directorio debe llamarse igual que el `id`.

```bash
mkdir -p adapters/deno-oak
```

### 2. Escribí el manifiesto

`adapters/deno-oak/adapter.json`:

```json
{
  "id": "deno-oak",
  "name": "Deno + Oak",
  "language": "TypeScript",
  "runtime": "Deno",
  "framework": "Oak",
  "runtimeVersion": "2.x",
  "source": "src/deno-oak",
  "service": "app-deno-oak",
  "port": 3005,
  "healthPath": "/health",
  "apiBasePath": "/api"
}
```

### 3. Implementá el contrato HTTP

El detalle está en [docs/adapter-contract.md](docs/adapter-contract.md). El resumen:

- `GET /health` → 200
- `GET /api/users?page=1&limit=10` → 200 con `{data,total,page,limit}`
- `GET /api/users/:id` → 200 o 404
- `GET /api/users/:id/orders` → 200 o 404
- `GET /api/users/:id/stats` → 200 o 404
- `POST /api/users` → **201**

Las rutas de escritura (`POST/PUT/DELETE`) ya están definidas y se medirán en v0.2. Si tu adaptador las implementa, mejor: entra directo al escenario de escritura cuando exista.

### 4. Enganchalo en Docker Compose

Agregá un servicio en `docker-compose.yml` que use el `service` del manifiesto, espere a `postgres` y `redis` sanos y exponga el `port` declarado. No modifiques los demás servicios.

### 5. Verificá

```bash
docker compose up -d --build
node scripts/bench.mjs validate
node scripts/bench.mjs check --adapter deno-oak --base-url http://localhost:3005
node scripts/bench.mjs run --adapter deno-oak --base-url http://localhost:3005 --scenario smoke
```

Las tres cosas tienen que pasar. Si `check` falla, el adaptador todavía no está.

### 6. Abrí el PR

Un PR, un adaptador. Incluí en la descripción:

- Qué runtime y framework, y en qué versión.
- Qué ORM y qué pool de conexiones usaste.
- La salida de `check` y del `run` de smoke.
- Cualquier diferencia de comportamiento que hayas encontrado contra el contrato.

No toques otros adaptadores ni el esquema de `init-db.sql` en el mismo PR.

## Reglas de revisión

- **Un adaptador por PR.** Cambios de infraestructura van aparte.
- **Sin trampas de medición.** Nada de caché de respuestas, compresión selectiva, HTTP/2 o TLS si el resto no lo usa.
- **Sin dependencias pagas.** El proyecto corre con free tiers y open source.
- **El commit importa.** Un resultado vale para el commit que lo produjo; no se reescriben resultados viejos.

## Buenos primeros issues

Estos son aportes acotados y verificables:

- Adaptadores faltantes: `deno-oak`, `node-express`, `node-fastify`, `node-hono`, `bun-hono`.
- Escenario de escritura (`write`) con cuerpo único por request.
- Siembra de datos (`seed`) para que `GET /api/users/:id` mida joins reales.
- Página estática del leaderboard publicada en GitHub Pages.
- Comentario automático del resultado de smoke en cada PR.

Si tomás uno, decilo en el issue para no duplicar trabajo.

## Código de conducta

Discutí números, no personas. Un benchmark se refuta con una medición reproducible, no con una opinión. Los ataques a un lenguaje o a quien lo mantiene se cierran sin discusión.
