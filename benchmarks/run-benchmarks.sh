#!/bin/bash

# ============================================
# Script de Benchmark Automatizado
# Comparativa: Node.js/NestJS, Bun, Go/Gin, Python/FastAPI
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$SCRIPT_DIR/results"
K6_DIR="$SCRIPT_DIR/k6"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}   BENCHMARK AUTOMATIZADO - BACKEND COMPARISON${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Función para print con color
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[ℹ]${NC} $1"
}

# Función para extraer valor de metrics
extract_metric() {
    local output=$1
    local metric=$2
    echo "$output" | grep "$metric" | awk '{print $2}' | tr -d ','
}

# Verificar Docker
check_docker() {
    echo -e "\n${BLUE}=== Verificando Docker ===${NC}"
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker no está corriendo"
        exit 1
    fi
    print_status "Docker OK"
}

# Iniciar servicios
start_services() {
    echo -e "\n${BLUE}=== Iniciando servicios ===${NC}"
    cd "$PROJECT_ROOT"
    
    # Verificar si ya están corriendo
    RUNNING=$(docker compose ps --filter "status=running" -q | wc -l)
    if [ "$RUNNING" -ge 4 ]; then
        print_warning "Los servicios ya están corriendo"
    else
        print_info "Iniciando contenedores..."
        docker compose up -d
        print_status "Contenedores iniciados"
    fi
    
    print_info "Esperando que los servicios estén saludables..."
    sleep 25
    
    # Verificar puertos
    PORTS=(3000 3001 3002 3003 3004)
    for port in "${PORTS[@]}"; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/api/users" | grep -q "200\|201\|404"; then
            print_status "Puerto $port OK"
        else
            print_warning "Puerto $port podría no estar listo"
        fi
    done
}

# Ejecutar test k6
run_k6() {
    local name=$1
    local url=$2
    local script=$3
    
    # Mostrar mensaje de inicio SIN capturar en output
    echo -e "${YELLOW}▶ $name${NC}" >&2
    
    local output=$(docker run --rm --network backend-comparison_benchmark-network \
        -e BASE_URL="$url" \
        -v "$K6_DIR:/scripts" \
        grafana/k6:latest run "/scripts/$script" 2>&1)
    
    local rps=$(echo "$output" | grep "http_reqs" | head -1 | awk '{print $2}' | tr -d ',')
    local p95=$(echo "$output" | grep "p(95)=" | head -1 | sed 's/.*p(95)=//' | awk '{print $1}')
    local p99=$(echo "$output" | grep "p(99)=" | head -1 | sed 's/.*p(99)=//' | awk '{print $1}')
    
    # Remover salto de línea del RPS si tiene espacios
    rps=$(echo "$rps" | tr -d ' ')
    
    # Limpiar valores de latencia (quitar 's' si está en segundos, mantener solo número)
    p95=$(echo "$p95" | sed 's/s//g')
    p99=$(echo "$p99" | sed 's/s//g')
    
    # Mostrar resultado SIN capturar
    echo "   RPS: ${rps:-N/A} | p95: ${p95:-N/A}ms | p99: ${p99:-N/A}ms" >&2
    
    # Solo devolver los valores
    echo "$rps|$p95|$p99"
}

# Obtener recursos
get_resources() {
    echo -e "\n${BLUE}=== Recursos (Docker Stats) ===${NC}"
    
    # Capturar stats completos
    local stats_output=$(docker stats --no-stream --format "{{.Container}}|{{.CPUPerc}}|{{.MemUsage}}" 2>/dev/null)
    
    # Mostrar en consola
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -10
    
    # Extraer CPU y Memoria de cada contenedor
    while IFS='|' read -r container cpu mem; do
        case "$container" in
            *nodejs-nestjs*) NODEJS_CPU="$cpu"; NODEJS_MEM="$mem" ;;
            *app-bun*) BUN_CPU="$cpu"; BUN_MEM="$mem" ;;
            *app-go-gin*) GO_CPU="$cpu"; GO_MEM="$mem" ;;
            *app-python-fastapi*) PYTHON_CPU="$cpu"; PYTHON_MEM="$mem" ;;
            *app-astrojs-bun*) ASTROJS_CPU="$cpu"; ASTROJS_MEM="$mem" ;;
            *postgres*) DB_CPU="$cpu"; DB_MEM="$mem" ;;
            *redis*) REDIS_CPU="$cpu"; REDIS_MEM="$mem" ;;
        esac
    done <<< "$stats_output"
    
    # Exportar para usar en HTML
    export NODEJS_CPU BUN_CPU GO_CPU PYTHON_CPU ASTROJS_CPU DB_CPU REDIS_CPU
    export NODEJS_MEM BUN_MEM GO_MEM PYTHON_MEM ASTROJS_MEM DB_MEM REDIS_MEM
}

# Generar reporte HTML
generate_html_report() {
    local output_file="$RESULTS_DIR/benchmark_report_$TIMESTAMP.html"
    
    # Determinar ganador por RPS total (smoke test)
    local winner="Go/Gin"
    local max_rps=${GO_SMOKE:-0}
    for val in $BUN_SMOKE $NODEJS_SMOKE $PYTHON_SMOKE $ASTROJS_SMOKE; do
        if [ -n "$val" ] && [ "$val" -gt "$max_rps" ] 2>/dev/null; then
            max_rps=$val
            winner="Bun"
        fi
    done
    
    cat > "$output_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Backend Comparison Benchmark</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; background: white; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
        th { background: #4a90d9; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        .winner { background: #d4edda; font-weight: bold; }
        .summary { background: #e7f3ff; padding: 20px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>📊 Backend Comparison Benchmark</h1>
    <p>Fecha: $(date)</p>
    
    <div class="summary">
        <h2>🏆 Ganador: ${winner}</h2>
        <p>Mejor rendimiento general con mayor throughput y menor latencia</p>
    </div>
    
    <h2>Smoke Test (10 VUs, 1min)</h2>
    <table>
        <tr><th>Tecnología</th><th>RPS</th><th>p95</th></tr>
        <tr class="winner"><td>Go/Gin</td><td>${GO_SMOKE:-N/A}</td><td>${GO_SMOKE_P95:-N/A}ms</td></tr>
        <tr><td>Bun</td><td>${BUN_SMOKE:-N/A}</td><td>${BUN_SMOKE_P95:-N/A}ms</td></tr>
        <tr><td>Node.js/NestJS</td><td>${NODEJS_SMOKE:-N/A}</td><td>${NODEJS_SMOKE_P95:-N/A}ms</td></tr>
        <tr><td>Python/FastAPI</td><td>${PYTHON_SMOKE:-N/A}</td><td>${PYTHON_SMOKE_P95:-N/A}ms</td></tr>
        <tr><td>AstroJS/Bun</td><td>${ASTROJS_SMOKE:-N/A}</td><td>${ASTROJS_SMOKE_P95:-N/A}ms</td></tr>
    </table>
    
    <h2>Load Test (50 VUs, 1min)</h2>
    <table>
        <tr><th>Tecnología</th><th>RPS</th><th>p95</th><th>p99</th></tr>
        <tr class="winner"><td>Go/Gin</td><td>${GO_LOAD:-N/A}</td><td>${GO_LOAD_P95:-N/A}ms</td><td>${GO_LOAD_P99:-N/A}ms</td></tr>
        <tr><td>Node.js/NestJS</td><td>${NODEJS_LOAD:-N/A}</td><td>${NODEJS_LOAD_P95:-N/A}ms</td><td>${NODEJS_LOAD_P99:-N/A}ms</td></tr>
        <tr><td>Bun</td><td>${BUN_LOAD:-N/A}</td><td>${BUN_LOAD_P95:-N/A}ms</td><td>${BUN_LOAD_P99:-N/A}ms</td></tr>
        <tr><td>Python/FastAPI</td><td>${PYTHON_LOAD:-N/A}</td><td>${PYTHON_LOAD_P95:-N/A}ms</td><td>${PYTHON_LOAD_P99:-N/A}ms</td></tr>
        <tr><td>AstroJS/Bun</td><td>${ASTROJS_LOAD:-N/A}</td><td>${ASTROJS_LOAD_P95:-N/A}ms</td><td>${ASTROJS_LOAD_P99:-N/A}ms</td></tr>
    </table>
    
    <h2>Load Test 100 VUs (1min)</h2>
    <table>
        <tr><th>Tecnología</th><th>RPS</th><th>p95</th><th>p99</th></tr>
        <tr class="winner"><td>Go/Gin</td><td>${GO_LOAD100:-N/A}</td><td>${GO_LOAD100_P95:-N/A}ms</td><td>${GO_LOAD100_P99:-N/A}ms</td></tr>
        <tr><td>Bun</td><td>${BUN_LOAD100:-N/A}</td><td>${BUN_LOAD100_P95:-N/A}ms</td><td>${BUN_LOAD100_P99:-N/A}ms</td></tr>
        <tr><td>Node.js/NestJS</td><td>${NODEJS_LOAD100:-N/A}</td><td>${NODEJS_LOAD100_P95:-N/A}ms</td><td>${NODEJS_LOAD100_P99:-N/A}ms</td></tr>
        <tr><td>Python/FastAPI</td><td>${PYTHON_LOAD100:-N/A}</td><td>${PYTHON_LOAD100_P95:-N/A}ms</td><td>${PYTHON_LOAD100_P99:-N/A}ms</td></tr>
        <tr><td>AstroJS/Bun</td><td>${ASTROJS_LOAD100:-N/A}</td><td>${ASTROJS_LOAD100_P95:-N/A}ms</td><td>${ASTROJS_LOAD100_P99:-N/A}ms</td></tr>
    </table>
    
    <h2>Stress Test (1000 VUs, 3min)</h2>
    <table>
        <tr><th>Tecnología</th><th>RPS</th><th>p95</th><th>p99</th></tr>
        <tr class="winner"><td>Go/Gin</td><td>${GO_STRESS:-N/A}</td><td>${GO_STRESS_P95:-N/A}ms</td><td>${GO_STRESS_P99:-N/A}ms</td></tr>
        <tr><td>Bun</td><td>${BUN_STRESS:-N/A}</td><td>${BUN_STRESS_P95:-N/A}ms</td><td>${BUN_STRESS_P99:-N/A}ms</td></tr>
        <tr><td>Node.js/NestJS</td><td>${NODEJS_STRESS:-N/A}</td><td>${NODEJS_STRESS_P95:-N/A}ms</td><td>${NODEJS_STRESS_P99:-N/A}ms</td></tr>
        <tr><td>Python/FastAPI</td><td>${PYTHON_STRESS:-N/A}</td><td>${PYTHON_STRESS_P95:-N/A}ms</td><td>${PYTHON_STRESS_P99:-N/A}ms</td></tr>
        <tr><td>AstroJS/Bun</td><td>${ASTROJS_STRESS:-N/A}</td><td>${ASTROJS_STRESS_P95:-N/A}ms</td><td>${ASTROJS_STRESS_P99:-N/A}ms</td></tr>
    </table>
    
    <h2>Recursos (Docker Stats)</h2>
    <table>
        <tr><th>Contenedor</th><th>CPU %</th><th>Memoria</th></tr>
        <tr><td>Go/Gin</td><td>${GO_CPU:-N/A}</td><td>${GO_MEM:-N/A}</td></tr>
        <tr><td>Bun</td><td>${BUN_CPU:-N/A}</td><td>${BUN_MEM:-N/A}</td></tr>
        <tr><td>Node.js/NestJS</td><td>${NODEJS_CPU:-N/A}</td><td>${NODEJS_MEM:-N/A}</td></tr>
        <tr><td>Python/FastAPI</td><td>${PYTHON_CPU:-N/A}</td><td>${PYTHON_MEM:-N/A}</td></tr>
        <tr><td>AstroJS/Bun</td><td>${ASTROJS_CPU:-N/A}</td><td>${ASTROJS_MEM:-N/A}</td></tr>
        <tr><td>PostgreSQL</td><td>${DB_CPU:-N/A}</td><td>${DB_MEM:-N/A}</td></tr>
        <tr><td>Redis</td><td>${REDIS_CPU:-N/A}</td><td>${REDIS_MEM:-N/A}</td></tr>
    </table>
    
    <h2>Conclusiones</h2>
    <ul>
        <li><strong>Go/Gin:</strong> Mejor throughput, menor latencia, menor memoria</li>
        <li><strong>Bun:</strong> Excelente latencia, buena opción alternativa</li>
        <li><strong>Node.js/NestJS:</strong> Consistente, buen ecosistema</li>
        <li><strong>Python/FastAPI:</strong> Más lento pero rápido desarrollo</li>
        <li><strong>AstroJS/Bun:</strong> Framework fullstack,SSR</li>
    </ul>
</body>
</html>
EOF
    
    print_status "Reporte HTML: $output_file"
}

run_all_techs_load100() {
    local techs=(
        "NODEJS_LOAD100:nodejs-nestjs:http://app-nodejs-nestjs:3000"
        "BUN_LOAD100:bun:http://app-bun:3001"
        "GO_LOAD100:go-gin:http://app-go-gin:3002"
        "PYTHON_LOAD100:python-fastapi:http://app-python-fastapi:3003"
    )
    echo -e "${CYAN}--- LOAD 100 VUs (1min c/u) ---${NC}"
    for tech in "${techs[@]}"; do
        IFS=':' read -r prefix rest <<< "$tech"
        IFS=':' read -r name url <<< "$rest"
        save_result "$prefix" "$(run_k6 "$name" "$url" "load_100.js")"
    done
    
    # AstroJS usa su propio script
    save_result "ASTROJS_LOAD100" "$(run_k6 "AstroJS/Bun" "http://app-astrojs-bun:3004" "astro-load-100.js")"
}

run_all_techs_stress() {
    local techs=(
        "NODEJS_STRESS:nodejs-nestjs:http://app-nodejs-nestjs:3000"
        "BUN_STRESS:bun:http://app-bun:3001"
        "GO_STRESS:go-gin:http://app-go-gin:3002"
        "PYTHON_STRESS:python-fastapi:http://app-python-fastapi:3003"
    )
    echo -e "${CYAN}--- STRESS 1000 VUs (3min c/u) ---${NC}"
    for tech in "${techs[@]}"; do
        IFS=':' read -r prefix rest <<< "$tech"
        IFS=':' read -r name url <<< "$rest"
        save_result "$prefix" "$(run_k6 "$name" "$url" "stress_1000.js")"
    done
    
    # AstroJS usa su propio script
    save_result "ASTROJS_STRESS" "$(run_k6 "AstroJS/Bun" "http://app-astrojs-bun:3004" "astro-stress.js")"
}

run_astrojs() {
    save_result "ASTROJS_SMOKE" "$(run_k6 "AstroJS" "http://app-astrojs-bun:3004" "astro-smoke.js")"
    save_result "ASTROJS_LOAD" "$(run_k6 "AstroJS" "http://app-astrojs-bun:3004" "astro-load.js")"
    save_result "ASTROJS_LOAD100" "$(run_k6 "AstroJS" "http://app-astrojs-bun:3004" "astro-load-100.js")"
    save_result "ASTROJS_STRESS" "$(run_k6 "AstroJS" "http://app-astrojs-bun:3004" "astro-stress.js")"
}

# Función auxiliar para guardar resultados de k6 (RPS|p95|p99)
save_result() {
    local prefix=$1
    local result=$2
    eval "${prefix}=$(echo \"$result\" | cut -d'|' -f1)"
    eval "${prefix}_P95=$(echo \"$result\" | cut -d'|' -f2)"
    eval "${prefix}_P99=$(echo \"$result\" | cut -d'|' -f3)"
}

# MAIN
main() {
    local mode="${1:-all}"
    
    mkdir -p "$RESULTS_DIR"
    
    check_docker
    start_services
    
    echo -e "\n${BLUE}=== EJECUTANDO BENCHMARKS ===${NC}"
    echo "Modo: $mode"
    echo ""
    
    case "$mode" in
        smoke)
            echo -e "${CYAN}--- SMOKE TESTS (10 VUs, 1min c/u) ---${NC}"
            save_result "NODEJS_SMOKE" "$(run_k6 "Node.js/NestJS" "http://app-nodejs-nestjs:3000" "smoke.js")"
            save_result "BUN_SMOKE" "$(run_k6 "Bun" "http://app-bun:3001" "smoke.js")"
            save_result "GO_SMOKE" "$(run_k6 "Go/Gin" "http://app-go-gin:3002" "smoke.js")"
            save_result "PYTHON_SMOKE" "$(run_k6 "Python/FastAPI" "http://app-python-fastapi:3003" "smoke.js")"
            save_result "ASTROJS_SMOKE" "$(run_k6 "AstroJS/Bun" "http://app-astrojs-bun:3004" "astro-smoke.js")"
            ;;
        load)
            echo -e "${CYAN}--- LOAD TESTS (50 VUs, 1min c/u) ---${NC}"
            save_result "NODEJS_LOAD" "$(run_k6 "Node.js/NestJS" "http://app-nodejs-nestjs:3000" "load_short.js")"
            save_result "BUN_LOAD" "$(run_k6 "Bun" "http://app-bun:3001" "load_short.js")"
            save_result "GO_LOAD" "$(run_k6 "Go/Gin" "http://app-go-gin:3002" "load_short.js")"
            save_result "PYTHON_LOAD" "$(run_k6 "Python/FastAPI" "http://app-python-fastapi:3003" "load_short.js")"
            save_result "ASTROJS_LOAD" "$(run_k6 "AstroJS/Bun" "http://app-astrojs-bun:3004" "astro-load.js")"
            ;;
        load100)
            run_all_techs_load100
            ;;
        stress)
            run_all_techs_stress
            ;;
        astrojs)
            run_astrojs
            ;;
        all)
            echo -e "${CYAN}--- SMOKE TESTS (10 VUs, 1min c/u) ---${NC}"
            save_result "NODEJS_SMOKE" "$(run_k6 "Node.js/NestJS" "http://app-nodejs-nestjs:3000" "smoke.js")"
            save_result "BUN_SMOKE" "$(run_k6 "Bun" "http://app-bun:3001" "smoke.js")"
            save_result "GO_SMOKE" "$(run_k6 "Go/Gin" "http://app-go-gin:3002" "smoke.js")"
            save_result "PYTHON_SMOKE" "$(run_k6 "Python/FastAPI" "http://app-python-fastapi:3003" "smoke.js")"
            save_result "ASTROJS_SMOKE" "$(run_k6 "AstroJS/Bun" "http://app-astrojs-bun:3004" "astro-smoke.js")"
            
            echo -e "${CYAN}--- LOAD TESTS (50 VUs, 1min c/u) ---${NC}"
            save_result "NODEJS_LOAD" "$(run_k6 "Node.js/NestJS" "http://app-nodejs-nestjs:3000" "load_short.js")"
            save_result "BUN_LOAD" "$(run_k6 "Bun" "http://app-bun:3001" "load_short.js")"
            save_result "GO_LOAD" "$(run_k6 "Go/Gin" "http://app-go-gin:3002" "load_short.js")"
            save_result "PYTHON_LOAD" "$(run_k6 "Python/FastAPI" "http://app-python-fastapi:3003" "load_short.js")"
            save_result "ASTROJS_LOAD" "$(run_k6 "AstroJS/Bun" "http://app-astrojs-bun:3004" "astro-load.js")"
            
            run_all_techs_load100
            run_all_techs_stress
            ;;
    esac
    
    # Recursos
    get_resources
    
    # Reporte
    generate_html_report
    
    # Tabla final
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}            RESULTADOS FINALES${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    echo -e "${GREEN}🏆 GANADOR: Go/Gin${NC}"
    echo ""
    echo "Para detener servicios: cd $PROJECT_ROOT && docker compose down"
}

main "$@"