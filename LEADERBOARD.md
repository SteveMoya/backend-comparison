# Runtime Bench — Leaderboard

Generado automáticamente desde los resultados en `leaderboard/results/`. No editar a mano.

Generado: 2026-11-23T14:18:59.705Z

## Escenario: load

| # | Adaptador | Runtime | Framework | RPS | p50 (ms) | p90 (ms) | p99 (ms) | No-2xx | Errores | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Bun + Elysia | Bun 1.x | Elysia | 10,712 | 4 | 7 | 10 | 0 | 0 | `4714ab3` |
| 2 | Go + Gin | Go 1.21 | Gin | 9,037 | 5 | 10 | 20 | 0 | 0 | `4714ab3` |
| 3 | Astro + Bun | Bun 1.x | Astro | 3,450 | 17 | 21 | 26 | 0 | 0 | `4714ab3` |
| 4 | Node.js + NestJS | Node.js 20 | NestJS | 1,332 | 43 | 48 | 71 | 0 | 0 | `4714ab3` |
| 5 | Python + FastAPI | Python 3.11 | FastAPI | 843 | 62 | 97 | 148 | 0 | 0 | `4714ab3` |

Entorno del resultado más reciente: AMD EPYC 7763 64-Core Processor (4 núcleos), 16 GiB de RAM, Linux 7.0.0-1020-azure, Node v20.20.2.

## Cómo leer esto

- Un número solo es comparable contra otro obtenido en el mismo entorno y con el mismo escenario.
- La metodología y el contrato de adaptadores están en [docs/methodology.md](../docs/methodology.md) y [docs/adapter-contract.md](../docs/adapter-contract.md).
- Los resultados son por commit: no se mezclan corridas de commits distintos en la misma fila.
