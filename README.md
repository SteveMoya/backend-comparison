<p align="center">
  <img src="https://iili.io/C1OgGp4.png" alt="Backend Comparison" width="100%">
</p>

<h1 align="center">⚡ Backend Performance Comparison</h1>

<p align="center">
  <strong>Benchmark comparativo de frameworks backend: Go/Gin, Bun, Node.js/NestJS y Python/FastAPI</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.21-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Bun-1.x-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

---

## 🎯 Objetivo

Comparar tecnologías backend modernas mediante **benchmarks de rendimiento reales**, evaluando:
- 📊 Throughput (requests/second)
- ⚡ Latencia (p95, p99)
- 💾 Consumo de recursos (CPU, memoria)
- 🏗️ Arquitectura y mantenibilidad
- 🚀 Facilidad de despliegue

---

## 📊 Resultados de Benchmarks

### Smoke Test (10 usuarios, 1 min)

| Tecnología | RPS | p95 Latencia | Checks OK |
|------------|-----|--------------|-----------|
| **Go/Gin** | 2,012 | 13.65ms | 87.5% |
| **Bun** | 1,946 | 11ms | 75% |
| **Node.js/NestJS** | 1,056 | 21.4ms | 75% |
| **Python/FastAPI** | 495 | 36.73ms | 60% |

### Load Test (50 usuarios, 1 min)

| Tecnología | RPS | p95 Latencia | p99 Latencia |
|------------|-----|--------------|--------------|
| **Go/Gin** | 588 | 114.41ms | 136.59ms |
| **Node.js/NestJS** | 565 | 81.46ms | 108.2ms |
| **Bun** | 549 | 93.38ms | 103.11ms |
| **Python/FastAPI** | 300 | 210.01ms | 252.61ms |

### Stress Test (1000 usuarios, 3 min)

| Tecnología | RPS | p95 Latencia | Observaciones |
|------------|-----|--------------|---------------|
| **Go/Gin** | 425 | 4.5s | ✅ Estable |
| **Bun** | 418 | 4.5s | ✅ Estable |
| **Node.js/NestJS** | 324 | 2.9s | ⚠️ p99 excedido |
| **Python/FastAPI** | 31 | 2m0s | ❌ Falló/crash |

### Consumo de Recursos

| Tecnología | CPU % | Memoria |
|------------|-------|---------|
| **Go/Gin** | 1.65% | 36.38 MB |
| **Bun** | 0.28% | 61.28 MB |
| **Node.js/NestJS** | 0.00% | 43.79 MB |
| **Python/FastAPI** | 0.12% | 75.66 MB |

---

## 🏆 Ranking General

| Posición | Tecnología | Puntaje | Ventajas Clave |
|----------|------------|---------|----------------|
| 🥇 1 | **Go/Gin** | 95/100 | Mejor throughput, menor latencia, menor memoria |
| 🥈 2 | **Bun** | 88/100 | Excelente latencia, buen rendimiento, runtime moderno |
| 🥉 3 | **Node.js/NestJS** | 82/100 | Consistente, gran ecosistema, TypeScript nativo |
| 4 | **Python/FastAPI** | 65/100 | Desarrollo rápido, pero no escala bien |

---

## 🛠️ Stack Tecnológico

### Aplicaciones
| Tecnología | Framework | ORM | Puerto |
|------------|-----------|-----|--------|
| Go | Gin | sqlx + pq | 3002 |
| TypeScript | NestJS | TypeORM | 3000 |
| TypeScript | Elysia (Bun) | Bun SQL | 3001 |
| Python | FastAPI | SQLAlchemy | 3003 |

### Infraestructura
- **Base de datos:** PostgreSQL 15
- **Cache:** Redis 7
- **Orquestación:** Docker Compose
- **Load Testing:** k6

---

## 📁 Estructura del Proyecto

```
backend-comparison/
├── src/
│   ├── nodejs-nestjs/     # NestJS con TypeORM
│   ├── bun/              # Elysia + PostgreSQL
│   ├── go-gin/           # Gin + sqlx
│   └── python-fastapi/   # FastAPI + SQLAlchemy
├── benchmarks/
│   ├── run-benchmarks.sh # Script automatizado
│   ├── k6/               # Scripts de carga k6
│   └── report.md         # Informe completo
├── docker-compose.yml     # Orquestación de servicios
├── Makefile              # Comandos útiles
└── PLAN.md               # Plan completo del proyecto
```

---

## 🚀 Instalación y Uso

### 1. Clonar el repositorio
```bash
git clone https://github.com/SteveMoya/backend-comparison.git
cd backend-comparison
```

### 2. Levantar todos los servicios
```bash
docker-compose up -d
```

### 3. Ejecutar benchmarks
```bash
cd benchmarks
./run-benchmarks.sh
```

### 4. Acceder a las APIs
- Node.js: http://localhost:3000/api/users
- Bun: http://localhost:3001/api/users
- Go: http://localhost:3002/api/users
- Python: http://localhost:3003/api/users

---

## 📡 API Endpoints

Todas las aplicaciones implementan el mismo CRUD para comparación justa:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/users` | Crear usuario |
| GET | `/api/users` | Listar usuarios (paginado) |
| GET | `/api/users/:id` | Obtener usuario por ID |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |
| GET | `/api/users/:id/orders` | JOIN query (performance test) |
| GET | `/api/users/:id/stats` | Agregación (performance test) |

---

## 💡 Recomendaciones por Caso de Uso

| Caso de Uso | Tecnología Recomendada | Razón |
|-------------|------------------------|-------|
| **APIs de alto rendimiento** | Go/Gin | Mayor throughput, menor latencia |
| **Microservicios rápidos** | Bun/Elysia | Runtime moderno, excelente DX |
| **Equipos JavaScript** | Node.js/NestJS | Ecosistema maduro, TypeScript |
| **Prototyping/ML services** | Python/FastAPI | Desarrollo rápido, integración ML |
| **Alta concurrencia** | Go/Gin | Goroutines, eficiente en memoria |

---

## 📚 Metodología

### Escenarios de Prueba
- **Smoke Test:** Validación básica (10 VUs, 1 min)
- **Load Test:** Carga normal y alta (50-100 VUs, 1 min)
- **Stress Test:** Límite de ruptura (1000 VUs, 3 min)
- **Spike Test:** Picos repentinos (10 → 500 VUs, 2 min)
- **Soak Test:** Carga prolongada (100 VUs, 30 min)

### Métricas Evaluadas
- Requests per second (RPS)
- Latencia percentil 95 y 99
- Tasa de éxito de requests
- Consumo de CPU y memoria
- Estabilidad bajo carga extrema

---

## 📖 Documentación Completa

Para más detalles técnicos, consulta:
- **[PLAN.md](PLAN.md)** - Plan completo del proyecto
- **[benchmarks/report.md](benchmarks/report.md)** - Informe detallado de benchmarks
- **[sdd/](sdd/)** - Software Design Document

---

## 🔧 Tecnologías de Testing

| Herramienta | Propósito |
|-------------|-----------|
| **k6** | Load testing y benchmarking |
| **Docker** | Containerización de servicios |
| **PostgreSQL** | Base de datos relacional |
| **Redis** | Cache y sesiones |

---

## 📝 Licencia

MIT © Steve Moya Cepeda

---

<p align="center">
  <strong>¿Te gustaría ver más benchmarks o comparar otras tecnologías?</strong><br>
  ¡Abre un issue o contribuye con tus propios tests!
</p>
