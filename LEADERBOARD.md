# Runtime Bench — Leaderboard

Generado automáticamente desde los resultados en `leaderboard/results/`. No editar a mano.

Generado: 2026-11-12T15:06:41.862Z

## Escenario: load

| # | Adaptador | Runtime | Framework | RPS | p50 (ms) | p90 (ms) | p99 (ms) | No-2xx | Errores | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Bun + Elysia | Bun 1.x | Elysia | 7,710 | 6 | 9 | 12 | 0 | 0 | `f587ea4` |
| 2 | Go + Gin | Go 1.21 | Gin | 5,924 | 7 | 15 | 30 | 0 | 0 | `f587ea4` |
| 3 | Astro + Bun | Bun 1.x | Astro | 2,721 | 21 | 27 | 32 | 0 | 0 | `f587ea4` |
| 4 | Node.js + NestJS | Node.js 20 | NestJS | 1,389 | 41 | 46 | 69 | 0 | 0 | `f587ea4` |
| 5 | Python + FastAPI | Python 3.11 | FastAPI | 630 | 84 | 128 | 180 | 0 | 0 | `f587ea4` |

Entorno del resultado más reciente: AMD EPYC 7763 64-Core Processor (4 núcleos), 16 GiB de RAM, Linux 7.0.0-1019-azure, Node v20.20.2.

## Cómo leer esto

- Un número solo es comparable contra otro obtenido en el mismo entorno y con el mismo escenario.
- La metodología y el contrato de adaptadores están en [docs/methodology.md](../docs/methodology.md) y [docs/adapter-contract.md](../docs/adapter-contract.md).
- Los resultados son por commit: no se mezclan corridas de commits distintos en la misma fila.
