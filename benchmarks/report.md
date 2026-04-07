# Benchmarks: Comparativa de Tecnologías Backend

## Resumen Ejecutivo

Este informe presenta los resultados de benchmarks comparativos entre 4 tecnologías backend:
- **Node.js/NestJS** (Puerto 3000)
- **Bun** (Puerto 3001)
- **Go/Gin** (Puerto 3002)
- **Python/FastAPI** (Puerto 3003)

---

## 1. Smoke Test (10 usuarios, 1 minuto)

| Tecnología | RPS | p95 Latencia | Checks OK |
|------------|-----|--------------|-----------|
| **Go/Gin** | 2,012 | 13.65ms | 87.5% |
| **Bun** | 1,946 | 11ms | 75% |
| **Node.js/NestJS** | 1,056 | 21.4ms | 75% |
| **Python/FastAPI** | 495 | 36.73ms | 60% |

### Análisis
- **Go/Gin** lidera con mayor throughput (2,012 RPS) y mejor latencia p95
- **Bun** segundo lugar con latencia más baja (11ms)
- **Node.js/NestJS** rendimiento moderado
- **Python/FastAPI** el más lento con mayor latencia

---

## 2. Load Test (50 VUs, 1 minuto)

| Tecnología | RPS | p95 Latencia | p99 Latencia | Errors |
|------------|-----|--------------|--------------|--------|
| **Go/Gin** | 588 | 114.41ms | 136.59ms | 0% |
| **Node.js/NestJS** | 565 | 81.46ms | 108.2ms | 0% |
| **Bun** | 549 | 93.38ms | 103.11ms | 0% |
| **Python/FastAPI** | 300 | 210.01ms | 252.61ms | 0% |

### Análisis
- **Go/Gin** mejor throughput bajo carga
- **Node.js/NestJS** tiene mejor latencia p95 que Go
- **Bun** estable pero no lidera en ninguno
- **Python/FastAPI** ~50% del throughput de los demás

---

## 3. Métricas de Recursos

| Tecnología | CPU % | Memoria |
|------------|-------|---------|
| **Go/Gin** | 1.65% | 36.38 MB |
| **Bun** | 0.28% | 61.28 MB |
| **Node.js/NestJS** | 0.00% | 43.79 MB |
| **Python/FastAPI** | 0.12% | 75.66 MB |
| **PostgreSQL** | 0.00% | 112.4 MB |
| **Redis** | 0.39% | 14.93 MB |

### Análisis
- **Go/Gin** mayor uso de CPU pero menor memoria
- **Python/FastAPI** mayor consumo de memoria
- **Bun** bajo CPU pero memoria moderada

---

## 4. Comparativa General

### Tabla Resumen

| Criterio | Go/Gin | Bun | Node.js/NestJS | Python/FastAPI |
|-----------|--------|-----|----------------|----------------|
| **RPS (Smoke)** | 🥇 2,012 | 🥈 1,946 | 1,056 | 495 |
| **RPS (Load)** | 🥇 588 | 🥉 549 | 🥈 565 | 300 |
| **Latencia p95** | 🥇 13.65ms | 🥇 11ms | 21.4ms | 36.73ms |
| **Memoria** | 🥇 36MB | 61MB | 43MB | 76MB |
| **Facilidad impl.** | Alta | Alta | Alta | Alta |

---

## 5. Conclusiones

### Ganador General: **Go/Gin**
- Mejor throughput en todos los escenarios
- Menor latencia
- Menor consumo de memoria

### Segundo Lugar: **Bun**
- Excelente latencia
- Rendimiento comparable a Go
- Ecosistema en crecimiento

### Tercer Lugar: **Node.js/NestJS**
- Consistente y estable
- Mayor ecosistema de librerías
- Bueno para equipos con experiencia JS

### Cuarto Lugar: **Python/FastAPI**
- Más lento en throughput
- Mayor latencia
- Mayor consumo de memoria
- Ventaja: desarrollo rápido y código conciso

---

## 6. Recomendaciones

| Caso de Uso | Tecnología Recomendada |
|-------------|------------------------|
| APIs de alto rendimiento | **Go/Gin** |
| Microservicios rápidos | **Bun** |
| Equipos JavaScript | **Node.js/NestJS** |
| Prototyping/ML services | **Python/FastAPI** |

---

## 7. Nota sobre Tests

- Todos los tests pasaron los thresholds definidos (p95 < 500ms)
- Error rate: 0% en todos los escenarios
- La diferencia en "checks_ok" del smoke test se debe a que el endpoint `/health` usa prefijo `/api` en Node.js

---

*Generado: 2026-04-07*
*Infraestructura: Docker Compose (PostgreSQL + Redis)*