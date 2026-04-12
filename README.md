# Backend Comparison

## Objetivo

Comparar tecnologías backend mediante benchmarks de rendimiento, consumo de recursos, documentación, desarrollo y despliegue.

## Stack Tecnológico

### Tecnologías Comparadas

| Tecnología | Puerto | Estado |
|------------|--------|--------|
| Node.js + NestJS | 3000 | ✅ Completado |
| Bun | 3001 | ✅ Completado |
| Go + Gin | 3002 | ✅ Completado |
| Python + FastAPI | 3003 | ✅ Completado |
| AstroJS + Bun | 3004 | ✅ Completado |

### Infraestructura

- **PostgreSQL** (puerto 5432) - Base de datos
- **Redis** (puerto 6379) - Cache/Mensajería

## Resultados de Benchmarks

### 🏆 Ganador: Go/Gin

| Escenario | Go/Gin | Bun | Node.js/NestJS | Python/FastAPI | AstroJS/Bun |
|-----------|--------|-----|----------------|----------------|-------------|
| **Smoke (10 VUs)** | 2,012 RPS | 1,946 RPS | 1,056 RPS | 495 RPS | TBD |
| **Load 50** | 588 RPS | 549 RPS | 565 RPS | 300 RPS | TBD |
| **Load 100** | 457 RPS | 413 RPS | 328 RPS | 4 RPS* | TBD |
| **Stress 1000** | 425 RPS | 418 RPS | 324 RPS | 31 RPS* | TBD |

*Python falló bajo carga alta

### Memoria

| Tecnología | Consumo |
|------------|---------|
| Go/Gin | 36 MB |
| Node.js/NestJS | 43 MB |
| Bun | 61 MB |
| Python/FastAPI | 76 MB |
| AstroJS/Bun | TBD |

## Estructura del Proyecto

```
backend-comparison/
├── docker-compose.yml              # Orquestador
├── .github/workflows/               # CI/CD
├── benchmarks/
│   ├── k6/                        # Scripts de carga
│   │   ├── smoke.js              # 10 VUs, 1min
│   │   ├── load_short.js         # 50 VUs, 1min
│   │   ├── load_100.js           # 100 VUs, 1min
│   │   └── stress_1000.js        # 1000 VUs, 3min
│   ├── results/                   # Resultados HTML
│   ├── report.md                 # Informe completo
│   └── run-benchmarks.sh          # Script automatizado
├── src/
│   ├── nodejs-nestjs/             # NestJS + TypeORM
│   ├── bun/                       # Elysia + PostgreSQL
│   ├── go-gin/                    # Gin + sqlx
│   └── python-fastapi/            # FastAPI + SQLAlchemy
├── PLAN.md                        # Plan del proyecto
└── README.md                      # Este archivo
```

## Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose
- sudo para ejecutar docker

### 1. Levantar servicios

```bash
docker compose up -d
```

### 2. Verificar servicios

```bash
docker compose ps
```

Deberían ver 6 contenedores corriendo:
- app-nodejs-nestjs (3000)
- app-bun (3001)
- app-go-gin (3002)
- app-python-fastapi (3003)
- benchmark-postgres (5432)
- benchmark-redis (6379)

### 3. Probar endpoints

```bash
# Node.js
curl http://localhost:3000/api/users

# Bun
curl http://localhost:3001/api/users

# Go
curl http://localhost:3002/api/users

# Python
curl http://localhost:3003/api/users
```

## Benchmarks

### Ejecutar benchmarks automatizados

```bash
# Todos los tests
sudo ./benchmarks/run-benchmarks.sh all

# Solo smoke test
sudo ./benchmarks/run-benchmarks.sh smoke

# Solo load test 50 VUs
sudo ./benchmarks/run-benchmarks.sh load

# Solo load test 100 VUs
sudo ./benchmarks/run-benchmarks.sh load100

# Solo stress test
sudo ./benchmarks/run-benchmarks.sh stress
```

### Scripts k6 disponibles

| Script | Descripción | VUs | Duración |
|--------|-------------|-----|----------|
| `smoke.js` | Validación básica | 10 | 1 min |
| `load_short.js` | Carga normal | 50 | 1 min |
| `load_100.js` | Carga alta | 100 | 1 min |
| `stress_1000.js` | Estrés máximo | 1000 | 3 min |

### Detener servicios

```bash
docker compose down
```

## Endpoints API

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/users | Crear usuario |
| GET | /api/users | Listar (paginado) |
| GET | /api/users/:id | Obtener por ID |
| PUT | /api/users/:id | Actualizar usuario |
| DELETE | /api/users/:id | Eliminar usuario |
| GET | /api/users/:id/orders | Ver pedidos |
| GET | /api/users/:id/stats | Estadísticas |

### Pedidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/orders | Crear pedido |
| GET | /api/orders | Listar pedidos |
| GET | /api/orders/:id | Obtener por ID |
| PUT | /api/orders/:id | Actualizar estado |
| DELETE | /api/orders/:id | Eliminar pedido |
| GET | /api/orders/aggregation | Agregaciones |

## Recomendaciones

| Caso de Uso | Tecnología |
|-------------|------------|
| APIs de alto rendimiento | Go/Gin |
| Microservicios rápidos | Bun |
| Equipos JavaScript | Node.js/NestJS |
| Prototyping/ML services | Python/FastAPI |
| Fullstack + SSR | AstroJS/Bun |

## Documentación Adicional

- [PLAN.md](./PLAN.md) - Plan completo del proyecto
- [benchmarks/report.md](./benchmarks/report.md) - Informe detallado de benchmarks

## License

MIT