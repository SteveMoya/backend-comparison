# Runtime Bench — Leaderboard

Generado automáticamente desde los resultados en `leaderboard/results/`. No editar a mano.

Generado: 2026-11-12T03:25:00.257Z

## Escenario: load

| # | Adaptador | Runtime | Framework | RPS | p50 (ms) | p90 (ms) | p99 (ms) | No-2xx | Errores | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Bun + Elysia | Bun 1.x | Elysia | 5,717 | 9 | 12 | 17 | 0 | 0 | `6d71416` |
| 2 | Go + Gin | Go 1.21 | Gin | 4,370 | 10 | 21 | 40 | 0 | 0 | `6d71416` |
| 3 | Astro + Bun | Bun 5.x | Astro | 2,797 | 21 | 26 | 31 | 0 | 0 | `6d71416` |
| 4 | Node.js + NestJS | Node.js 20 | NestJS | 1,919 | 30 | 33 | 49 | 0 | 0 | `6d71416` |
| 5 | Python + FastAPI | Python 3.11 | FastAPI | 631 | 84 | 127 | 180 | 0 | 0 | `6d71416` |

Entorno del resultado más reciente: AMD EPYC 9V74 80-Core Processor (4 núcleos), 16 GiB de RAM, Linux 7.0.0-1019-azure, Node v20.20.2.

## Cómo leer esto

- Un número solo es comparable contra otro obtenido en el mismo entorno y con el mismo escenario.
- La metodología y el contrato de adaptadores están en [docs/methodology.md](../docs/methodology.md) y [docs/adapter-contract.md](../docs/adapter-contract.md).
- Los resultados son por commit: no se mezclan corridas de commits distintos en la misma fila.
