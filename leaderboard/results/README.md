# Resultados publicados

Acá viven los resultados JSON que alimentan `LEADERBOARD.md`.

- Un archivo por corrida, generado por `node scripts/bench.mjs run`.
- Solo se publican corridas completas, con commit y entorno declarados.
- Los resultados locales (sin publicar) van a `results/`, que está en `.gitignore`.

Regenerar el leaderboard después de agregar un archivo:

```bash
node scripts/bench.mjs leaderboard
```
