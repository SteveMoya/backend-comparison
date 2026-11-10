<p align="center">
  <img src="https://iili.io/C1OgGp4.png" alt="Runtime Bench" width="100%">
</p>

<h1 align="center">⚡ Runtime Bench</h1>

<p align="center">
  <strong>Matriz reproducible de benchmarks para runtimes y frameworks backend</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Bun-1.x-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/Go-1.21-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge" alt="MIT">
</p>

---

## 🎯 Qué es esto

La mayoría de los benchmarks de frameworks backend se publican una vez, con hardware desconocido, y envejecen en silencio. Nadie los reproduce y todo el mundo los cita.

Runtime Bench invierte eso: la misma API, el mismo esquema y el mismo generador de carga para todos los adaptadores. Cada resultado declara el commit, el hardware y la metodología. Contribuir es agregar un adaptador.

**Estado: v0.1.** La infraestructura de medición está lista; los resultados publicados se construyen commit por commit.

## 📊 Resultados

- **Leaderboard:** [LEADERBOARD.md](LEADERBOARD.md) — se genera desde `leaderboard/results/`, nunca se edita a mano.
- **Metodología:** [docs/methodology.md](docs/methodology.md) — qué se mide, cómo y qué límites tiene.
- **Contrato:** [docs/adapter-contract.md](docs/adapter-contract.md) — qué tiene que responder un adaptador.

Todavía no hay resultados publicados de v0.1. Cuando haya, cada fila va a declarar commit, entorno y escenario. Un número sin esas tres cosas no entra.

### Resultados legacy

Los números de abajo vienen de la versión anterior del proyecto: hardware no declarado, sin commit asociado y sin posibilidad de reproducirlos. Se archivan como referencia histórica, **no como resultados vigentes**.

<details>
<summary>Benchmarks legacy (no comparables con v0.1)</summary>

#### Smoke Test (10 usuarios, 1 min)

| Tecnología | RPS | p95 Latencia | Checks OK |
|------------|-----|--------------|-----------|
| Go/Gin | 2,012 | 13.65ms | 87.5% |
| Bun | 1,946 | 11ms | 75% |
| Node.js/NestJS | 1,056 | 21.4ms | 75% |
| Python/FastAPI | 495 | 36.73ms | 60% |

#### Load Test (50 usuarios, 1 min)

| Tecnología | RPS | p95 Latencia | p99 Latencia |
|------------|-----|--------------|--------------|
| Go/Gin | 588 | 114.41ms | 136.59ms |
| Node.js/NestJS | 565 | 81.46ms | 108.2ms |
| Bun | 549 | 93.38ms | 103.11ms |
| Python/FastAPI | 300 | 210.01ms | 252.61ms |

#### Stress Test (1000 usuarios, 3 min)

| Tecnología | RPS | p95 Latencia | Observaciones |
|------------|-----|--------------|---------------|
| Go/Gin | 425 | 4.5s | Estable |
| Bun | 418 | 4.5s | Estable |
| Node.js/NestJS | 324 | 2.9s | p99 excedido |
| Python/FastAPI | 31 | 2m0s | Falló |

</details>

## 🛠️ Adaptadores

Cada adaptador es una implementación de la misma API en un runtime y framework distintos. El manifiesto vive en `adapters/<id>/adapter.json`.

| Adaptador | Runtime | Framework | Puerto |
| --- | --- | --- | --- |
| `nodejs-nestjs` | Node.js 20 | NestJS + TypeORM | 3000 |
| `bun` | Bun 1.x | Elysia + Bun SQL | 3001 |
| `go-gin` | Go 1.21 | Gin + sqlx | 3002 |
| `python-fastapi` | Python 3.11 | FastAPI + SQLAlchemy | 3003 |
| `astrojs-bun` | Bun | Astro + Supabase | 3004 |

Faltan adaptadores para Deno, Express, Fastify y Hono. Son exactamente el tipo de PR que el proyecto busca; ver [CONTRIBUTING.md](CONTRIBUTING.md).

## 📁 Estructura

```
runtime-bench/
├── adapters/                  # Un manifiesto por adaptador
├── scripts/
│   ├── bench.mjs              # CLI: list, validate, check, run, leaderboard
│   └── lib/                   # Manifiestos, contrato, resultados, leaderboard
├── docs/
│   ├── adapter-contract.md    # Contrato HTTP exacto
│   └── methodology.md         # Qué se mide y cómo
├── leaderboard/results/       # Resultados publicados (JSON por commit)
├── src/                       # Implementaciones
├── benchmarks/                # Scripts k6 y reporte histórico
├── tests/                     # node --test, sin Docker
├── docker-compose.yml
└── init-db.sql
```

## 🚀 Uso

### Requisitos

Node.js 20+, Docker y Docker Compose.

```bash
npm install
```

### Levantar todo

```bash
docker compose up -d --build
```

### Verificar adaptadores

```bash
node scripts/bench.mjs validate
node scripts/bench.mjs list
node scripts/bench.mjs check --adapter go-gin --base-url http://localhost:3002
```

### Medir

```bash
# 10 segundos, 10 conexiones
node scripts/bench.mjs run --adapter go-gin --base-url http://localhost:3002 --scenario smoke

# 60 segundos, 50 conexiones
node scripts/bench.mjs run --adapter go-gin --base-url http://localhost:3002 --scenario load
```

Cada corrida escribe un JSON `runtime-bench.result.v1` en `results/` con commit, entorno, carga y métricas.

### Publicar un resultado

```bash
cp results/*.json leaderboard/results/
node scripts/bench.mjs leaderboard
```

### Pruebas

```bash
npm test
```

## 📡 API

Todas las implementaciones exponen el mismo contrato.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/users` | Crear usuario |
| GET | `/api/users` | Listar usuarios (paginado) |
| GET | `/api/users/:id` | Obtener usuario por ID |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |
| GET | `/api/users/:id/orders` | JOIN query |
| GET | `/api/users/:id/stats` | Agregación |
| POST | `/api/orders` | Crear orden |
| GET | `/api/orders` | Listar órdenes |
| GET | `/api/orders/aggregation` | Agregación de órdenes |

## 🤝 Contribuir

Se busca:

- Adaptadores nuevos (Deno, Express, Fastify, Hono).
- Escenario de escritura.
- Siembra de datos para medir joins reales.
- Página estática del leaderboard.

Leé [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir un PR. Un adaptador se agrega en menos de una hora.

## 📝 Licencia

MIT © Steve Moya Cepeda
