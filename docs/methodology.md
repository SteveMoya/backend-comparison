# Metodología

**Versión:** `v0.1` (se publica en cada resultado como `methodologyVersion`).

Un número sin metodología no es un benchmark, es una anécdota. Esta página existe para que cualquiera pueda repetir la medición y discutirla con datos.

## 1. Qué se mide

v0.1 mide **tráfico de lectura** con [`autocannon`](https://github.com/mcollina/autocannon) sobre HTTP/1.1, en loopback, contra un adaptador que corre en el mismo equipo.

Secuencia de requests por conexión:

1. `GET /health`
2. `GET /api/users?page=1&limit=10`
3. `GET /api/users/1`
4. `GET /api/users/1/orders`
5. `GET /api/users/1/stats`

Secuencias fijas, no aleatorias: dos corridas del mismo commit deben producir el mismo trabajo.

## 2. Escenarios

| Escenario | Duración | Conexiones | Uso |
| --- | --- | --- | --- |
| `smoke` | 10 s | 10 | Verificar que el adaptador responde y producir un número rápido. |
| `load` | 60 s | 50 | Número de referencia para el leaderboard. |

`--duration` y `--connections` permiten otras combinaciones, pero **no son comparables** con el leaderboard: quedan registradas en el resultado para que se vea la diferencia.

## 3. Qué se publica

Cada resultado es un JSON `runtime-bench.result.v1` con:

- `adapter`, `runtime`, `framework`, `runtimeVersion`
- `scenario`, `commit`, `startedAt`, `durationSeconds`
- `environment`: SO, arquitectura, modelo y núcleos de CPU, memoria total, versión de Node
- `workload`: duración, conexiones y la secuencia exacta de requests
- `metrics`: RPS, latencia promedio/p50/p90/p99/máx, throughput, `non2xx`, errores y timeouts

`autocannon` no publica p95 nativo; por eso se reportan p50, p90 y p99. Inventar un p95 interpolado sería peor que declarar el que existe.

## 4. Reglas de comparación

1. **Mismo entorno o no se compara.** Un RPS medido en un portátil no se compara con uno medido en un runner de GitHub.
2. **Mismo commit.** Los resultados se agrupan por commit. El leaderboard usa el más reciente por adaptador y escenario.
3. **Mismo escenario.** `smoke` y `load` no se mezclan.
4. **Nada de `|| true`.** Si una corrida falla, el resultado no se publica. Un adaptador roto no entra al leaderboard.
5. **Los números viejos se archivan, no se corrigen.** Si cambia la metodología, sube `methodologyVersion` y se vuelve a medir todo.

## 5. Cómo publicar un resultado

```bash
# 1. Levantar el adaptador (o todo el stack)
docker compose up -d --build

# 2. Verificar el contrato
node scripts/bench.mjs check --adapter go-gin --base-url http://localhost:3002

# 3. Medir
node scripts/bench.mjs run --adapter go-gin --base-url http://localhost:3002 --scenario load

# 4. Publicar el JSON y regenerar el leaderboard
cp results/*.json leaderboard/results/
node scripts/bench.mjs leaderboard
```

## 6. Límites conocidos de v0.1

- **Solo lectura.** Las escrituras llegan en v0.2; hoy no hay número de `POST` ni de `DELETE`.
- **Una sola máquina.** No hay comparación cruzada entre hardware.
- **Loopback.** No se mide la red real, que en producción suele ser el cuello de botella.
- **Contenedores.** El overhead de Docker afecta a todos los adaptadores, pero no es cero.
- **`autocannon` como generador de carga.** Es el mismo generador para todos, así que la comparación relativa se sostiene; el techo absoluto es del generador, no del framework.
- **Datos sin sembrar.** `GET /api/users/1` puede devolver 404 y el contrato lo acepta. El escenario no mide joins reales con volumen.

Cada uno de esos límites es candidato a `good first issue`.
