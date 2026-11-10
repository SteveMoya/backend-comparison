# Contrato de adaptadores

Un **adaptador** es una implementación de la misma API con un runtime y un framework distintos. El objetivo no es que la API sea útil: es que la única diferencia entre dos adaptadores sea la tecnología que se está midiendo.

Si dos adaptadores no responden el mismo contrato, sus números no son comparables y el leaderboard miente.

## 1. Qué declara un adaptador

Cada adaptador vive en `adapters/<id>/adapter.json`:

```json
{
  "id": "go-gin",
  "name": "Go + Gin",
  "language": "Go",
  "runtime": "Go",
  "framework": "Gin",
  "runtimeVersion": "1.21",
  "source": "src/go-gin",
  "service": "app-go",
  "port": 3002,
  "healthPath": "/health",
  "apiBasePath": "/api"
}
```

Reglas:

- `id` en kebab-case y **debe coincidir con el nombre del directorio**.
- `port` es el puerto que el adaptador escucha dentro de la red de `docker-compose`.
- `service` es el nombre del servicio en `docker-compose.yml`.
- `runtimeVersion` es la versión que efectivamente se construye, no un rango.

Validación:

```bash
node scripts/bench.mjs validate
node scripts/bench.mjs list
```

## 2. Contrato HTTP

Base: `http://<host>:<port>` (`apiBasePath` por defecto `/api`).

| Método | Ruta | Estado esperado | Respuesta |
| --- | --- | --- | --- |
| GET | `/health` | 200 | Cualquier JSON. No debe tocar la base de datos. |
| GET | `/api/users?page=1&limit=10` | 200 | `{ "data": [...], "total": <number>, "page": <number>, "limit": <number> }` |
| GET | `/api/users/:id` | 200 o 404 | Usuario `{ "id", "name", "email", "created_at" }` |
| POST | `/api/users` | **201** | Usuario creado |
| PUT | `/api/users/:id` | 200 o 404 | Usuario actualizado |
| DELETE | `/api/users/:id` | 204 o 404 | Sin cuerpo |
| GET | `/api/users/:id/orders` | 200 o 404 | Usuario con `orders` |
| GET | `/api/users/:id/stats` | 200 o 404 | `{ "totalOrders", "totalAmount", "avgAmount" }` |
| POST | `/api/orders` | 201 | Orden creada |
| GET | `/api/orders` | 200 | Lista de órdenes |
| GET | `/api/orders/aggregation` | 200 | `{ "totalOrders", "totalAmount", "avgAmount" }` |
| GET | `/api/orders/:id` | 200 o 404 | Orden |
| PUT | `/api/orders/:id` | 200 o 404 | Orden actualizada |
| DELETE | `/api/orders/:id` | 204 o 404 | Sin cuerpo |

El escenario `smoke` y `load` de v0.1 solo ejercita las rutas de lectura. Las rutas de escritura ya forman parte del contrato y se medirán en v0.2; si tu adaptador no las implementa, igual podés correr los escenarios actuales, pero no va a poder sumarse al escenario de escritura.

**Diferencia conocida y corregida:** el adaptador `bun` devolvía 200 en `POST /api/users`. Se corrigió a 201 en v0.1 para que el contrato sea el mismo en todos.

## 3. Mismo esquema, mismos datos

- El esquema lo define `init-db.sql`. No lo cambies por adaptador.
- Todos los adaptadores apuntan a la misma PostgreSQL y al mismo Redis de `docker-compose.yml`.
- Nada de cachés en memoria que escondan la base de datos: si un adaptador cachea respuestas, el benchmark mide el caché, no el framework.
- El pool de conexiones y el ORM son elección tuya y deben quedar declarados en el PR. La comparación honesta es "configuración razonable por defecto", no "configuración tuneada para ganar".

## 4. Verificación

Con el adaptador corriendo:

```bash
node scripts/bench.mjs check --adapter <id> --base-url http://localhost:<puerto>
```

El comando recorre el contrato de lectura y devuelve `FAIL` con el estado recibido cuando algo no coincide. Un adaptador no se mergea si `check` falla.

## 5. Lo que un adaptador no puede hacer

- Cambiar el esquema o los datos de otro adaptador.
- Medir con TLS, compresión o HTTP/2 si los demás no lo hacen.
- Requerir hardware, puertos o variables de entorno que no estén documentados en el manifiesto y en `docker-compose.yml`.
- Depender de un servicio pago.
