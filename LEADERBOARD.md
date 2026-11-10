# Runtime Bench — Leaderboard

Generado automáticamente desde los resultados en `leaderboard/results/`. No editar a mano.

Generado: 2026-11-10T03:40:59.855Z

Todavía no hay resultados publicados.

Corré un benchmark y agregá el JSON generado a `leaderboard/results/`:

```bash
node scripts/bench.mjs run --adapter bun --base-url http://localhost:3001 --scenario smoke
cp results/*.json leaderboard/results/
node scripts/bench.mjs leaderboard
```

Ver [docs/methodology.md](../docs/methodology.md) para el procedimiento completo.
