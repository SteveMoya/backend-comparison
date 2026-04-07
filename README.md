# Backend Comparison

## Objetivo

Comparar tecnologías backend mediante benchmarks de rendimiento, consumo de recursos, documentación, desarrollo y despliegue.

## Stack Tecnológico

### Tecnologías a Comparar

| Tecnología | Rama | Puerto |
|------------|------|--------|
| Node.js + NestJS | `feature/nodejs-nestjs` | 3000 |
| Bun | `feature/bun` | 3001 |
| Go + Gin | `feature/go-gin` | 3002 |
| Python + FastAPI | `feature/python-fastapi` | 3003 |

### Infraestructura

- **PostgreSQL** (puerto 5432)
- **Redis** (puerto 6379)

## Estructura del Proyecto

```
backend-comparison/
├── docker-compose.yml          # Orquestador centralizado
├── .github/workflows/           # CI/CD pipelines
├── benchmarks/
│   ├── k6/                     # Scripts de carga
│   │   ├── smoke.js
│   │   ├── load.js
│   │   ├── stress.js
│   │   ├── spike.js
│   │   └── soak.js
│   ├── results/                # Resultados JSON
│   └── run-benchmarks.sh       # Script de ejecución
├── src/
│   ├── nodejs-nestjs/
│   ├── bun/
│   ├── go-gin/
│   └── python-fastapi/
└── PLAN.md
```

## Inicio Rápido

### 1. Levantar servicios

```bash
docker compose up -d
```

### 2. Verificar servicios

```bash
docker compose ps
```

### 3. Ejecutar benchmarks

```bash
# Todos los tests en todas las tecnologías
./benchmarks/run-benchmarks.sh all

# Solo smoke test
./benchmarks/run-benchmarks.sh smoke
```

## Benchmarking

### Escenarios de Prueba

| Escenario | Descripción | Concurrencia | Duración |
|-----------|-------------|--------------|----------|
| **Smoke** | Validación básica | 10 usuarios | 1 min |
| **Load** | Carga sostenida | 50-100 usuarios | 5 min |
| **Stress** | Carga máxima | 500-1000 usuarios | 3 min |
| **Spike** | Pico repentino | 10 → 500 usuarios | 2 min |
| **Soak** | Prueba prolongada | 100 usuarios | 30 min |

### Métricas

- **RPS** (Requests Per Second)
- **Latencia**: p50, p95, p99
- **CPU%**, **RAM MB**
- **Tasa de errores**

## Git Branches

| Rama | Propósito |
|------|-----------|
| `main` | Docker Compose + resultados benchmarks |
| `feature/nodejs-nestjs` | Implementación NestJS |
| `feature/bun` | Implementación Bun |
| `feature/go-gin` | Implementación Go + Gin |
| `feature/python-fastapi` | Implementación FastAPI |

## Contribuir

1. Crear branch desde `main`
2. Implementar cambios
3. Ejecutar tests localmente
4. Crear PR a `main`

## Roadmap

- [x] Fase 1: Estructura Base
- [ ] Fase 2: Implementación CRUD
- [ ] Fase 3: Benchmarking
- [ ] Fase 4: Documentación