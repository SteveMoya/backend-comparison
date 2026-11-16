# Runtime Bench — Leaderboard

Generado automáticamente desde los resultados en `leaderboard/results/`. No editar a mano.

Generado: 2026-11-16T12:36:37.017Z

## Escenario: load

| # | Adaptador | Runtime | Framework | RPS | p50 (ms) | p90 (ms) | p99 (ms) | No-2xx | Errores | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Go + Gin | Go 1.21 | Gin | 9,097 | 4 | 10 | 20 | 0 | 0 | `cab18da` |
| 2 | Bun + Elysia | Bun 1.x | Elysia | 7,322 | 7 | 10 | 13 | 0 | 0 | `cab18da` |
| 3 | Astro + Bun | Bun 1.x | Astro | 2,732 | 21 | 27 | 32 | 0 | 0 | `cab18da` |
| 4 | Node.js + NestJS | Node.js 20 | NestJS | 1,915 | 29 | 33 | 50 | 0 | 0 | `cab18da` |
| 5 | Python + FastAPI | Python 3.11 | FastAPI | 643 | 83 | 124 | 175 | 0 | 0 | `cab18da` |

Entorno del resultado más reciente: Intel(R) Xeon(R) 6973P-C (4 núcleos), 16 GiB de RAM, Linux 7.0.0-1019-azure, Node v20.20.2.

## Cómo leer esto

- Un número solo es comparable contra otro obtenido en el mismo entorno y con el mismo escenario.
- La metodología y el contrato de adaptadores están en [docs/methodology.md](../docs/methodology.md) y [docs/adapter-contract.md](../docs/adapter-contract.md).
- Los resultados son por commit: no se mezclan corridas de commits distintos en la misma fila.
