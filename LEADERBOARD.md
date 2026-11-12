# Runtime Bench — Leaderboard

Generado automáticamente desde los resultados en `leaderboard/results/`. No editar a mano.

Generado: 2026-11-12T03:51:21.211Z

## Escenario: load

| # | Adaptador | Runtime | Framework | RPS | p50 (ms) | p90 (ms) | p99 (ms) | No-2xx | Errores | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Bun + Elysia | Bun 1.x | Elysia | 9,311 | 5 | 8 | 11 | 0 | 0 | `50d94cb` |
| 2 | Go + Gin | Go 1.21 | Gin | 6,473 | 7 | 14 | 27 | 0 | 0 | `50d94cb` |
| 3 | Astro + Bun | Bun 1.x | Astro | 3,987 | 14 | 18 | 21 | 0 | 0 | `50d94cb` |
| 4 | Node.js + NestJS | Node.js 20 | NestJS | 1,463 | 38 | 44 | 63 | 0 | 0 | `50d94cb` |
| 5 | Python + FastAPI | Python 3.11 | FastAPI | 673 | 79 | 118 | 162 | 0 | 0 | `50d94cb` |

Entorno del resultado más reciente: AMD EPYC 7763 64-Core Processor (4 núcleos), 16 GiB de RAM, Linux 7.0.0-1019-azure, Node v20.20.2.

## Cómo leer esto

- Un número solo es comparable contra otro obtenido en el mismo entorno y con el mismo escenario.
- La metodología y el contrato de adaptadores están en [docs/methodology.md](../docs/methodology.md) y [docs/adapter-contract.md](../docs/adapter-contract.md).
- Los resultados son por commit: no se mezclan corridas de commits distintos en la misma fila.
