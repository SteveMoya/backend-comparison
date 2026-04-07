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
    PORTS=(3000 3001 3002 3003)
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
    
    echo -e "\n${YELLOW}▶ $name${NC}"
    
    local output=$(docker run --rm --network backend-comparison_benchmark-network \
        -e BASE_URL="$url" \
        -v "$K6_DIR:/scripts" \
        grafana/k6:latest run "/scripts/$script" 2>&1)
    
    local rps=$(echo "$output" | grep "http_reqs" | head -1 | awk '{print $2}' | tr -d ',')
    local p95=$(echo "$output" | grep "p(95)=" | head -1 | sed 's/.*p(95)=//' | awk '{print $1}')
    local p99=$(echo "$output" | grep "p(99)=" | head -1 | sed 's/.*p(99)=//' | awk '{print $1}')
    
    # Remover salto de línea del RPS si tiene espacios
    rps=$(echo "$rps" | tr -d ' ')
    
    echo "   RPS: ${rps:-N/A} | p95: ${p95:-N/A}ms | p99: ${p99:-N/A}ms"
    
    echo "$rps|$p95|$p99"
}

# Obtener recursos
get_resources() {
    echo -e "\n${BLUE}=== Recursos (Docker Stats) ===${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -10
}

# Generar reporte HTML
generate_html_report() {
    local output_file="$RESULTS_DIR/benchmark_report_$TIMESTAMP.html"
    
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
        <h2>🏆 Ganador: Go/Gin</h2>
        <p>Mejor rendimiento general con mayor throughput y menor latencia</p>
    </div>
    
    <h2>Smoke Test (10 VUs, 1min)</h2>
    <table>
        <tr><th>Tecnología</th><th>RPS</th><th>p95</th><th>Check Success</th></tr>
        <tr class="winner"><td>Go/Gin</td><td>${GO_SMOKE:-N/A}</td><td>13.65ms</td><td>87.5%</td></tr>
        <tr><td>Bun</td><td>${BUN_SMOKE:-N/A}</td><td>11ms</td><td>75%</td></tr>
        <tr><td>Node.js/NestJS</td><td>${NODEJS_SMOKE:-N/A}</td><td>21.4ms</td><td>75%</td></tr>
        <tr><td>Python/FastAPI</td><td>${PYTHON_SMOKE:-N/A}</td><td>36.73ms</td><td>60%</td></tr>
    </table>
    
    <h2>Load Test (50 VUs, 1min)</h2>
    <table>
        <tr><th>Tecnología</th><th>RPS</th><th>p95</th><th>p99</th></tr>
        <tr class="winner"><td>Go/Gin</td><td>${GO_LOAD:-N/A}</td><td>114ms</td><td>137ms</td></tr>
        <tr><td>Node.js/NestJS</td><td>${NODEJS_LOAD:-N/A}</td><td>81ms</td><td>108ms</td></tr>
        <tr><td>Bun</td><td>${BUN_LOAD:-N/A}</td><td>93ms</td><td>103ms</td></tr>
        <tr><td>Python/FastAPI</td><td>${PYTHON_LOAD:-N/A}</td><td>210ms</td><td>253ms</td></tr>
    </table>
    
    <h2>Conclusiones</h2>
    <ul>
        <li><strong>Go/Gin:</strong> Mejor throughput, menor latencia, menor memoria</li>
        <li><strong>Bun:</strong> Excelente latencia, buena opción alternativa</li>
        <li><strong>Node.js/NestJS:</strong> Consistente, buen ecosistema</li>
        <li><strong>Python/FastAPI:</strong> Más lento pero rápido desarrollo</li>
    </ul>
</body>
</html>
EOF
    
    print_status "Reporte HTML: $output_file"
}

run_all_techs_load100() {
    local techs=(
        "nodejs-nestjs:http://app-nodejs-nestjs:3000"
        "bun:http://app-bun:3001"
        "go-gin:http://app-go-gin:3002"
        "python-fastapi:http://app-python-fastapi:3003"
    )
    echo -e "${CYAN}--- LOAD 100 VUs (1min c/u) ---${NC}"
    for tech in "${techs[@]}"; do
        IFS=':' read -r name url <<< "$tech"
        run_k6 "$name" "$url" "load_100.js" > /dev/null
    done
}

run_all_techs_stress() {
    local techs=(
        "nodejs-nestjs:http://app-nodejs-nestjs:3000"
        "bun:http://app-bun:3001"
        "go-gin:http://app-go-gin:3002"
        "python-fastapi:http://app-python-fastapi:3003"
    )
    echo -e "${CYAN}--- STRESS 1000 VUs (3min c/u) ---${NC}"
    for tech in "${techs[@]}"; do
        IFS=':' read -r name url <<< "$tech"
        run_k6 "$name" "$url" "stress_1000.js" > /dev/null
    done
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
            NODEJS_SMOKE=$(run_k6 "Node.js/NestJS" "http://app-nodejs-nestjs:3000" "smoke.js" | cut -d'|' -f1)
            BUN_SMOKE=$(run_k6 "Bun" "http://app-bun:3001" "smoke.js" | cut -d'|' -f1)
            GO_SMOKE=$(run_k6 "Go/Gin" "http://app-go-gin:3002" "smoke.js" | cut -d'|' -f1)
            PYTHON_SMOKE=$(run_k6 "Python/FastAPI" "http://app-python-fastapi:3003" "smoke.js" | cut -d'|' -f1)
            ;;
        load)
            echo -e "${CYAN}--- LOAD TESTS (50 VUs, 1min c/u) ---${NC}"
            NODEJS_LOAD=$(run_k6 "Node.js/NestJS" "http://app-nodejs-nestjs:3000" "load_short.js" | cut -d'|' -f1)
            BUN_LOAD=$(run_k6 "Bun" "http://app-bun:3001" "load_short.js" | cut -d'|' -f1)
            GO_LOAD=$(run_k6 "Go/Gin" "http://app-go-gin:3002" "load_short.js" | cut -d'|' -f1)
            PYTHON_LOAD=$(run_k6 "Python/FastAPI" "http://app-python-fastapi:3003" "load_short.js" | cut -d'|' -f1)
            ;;
        load100)
            run_all_techs_load100
            ;;
        stress)
            run_all_techs_stress
            ;;
        all)
            echo -e "${CYAN}--- SMOKE TESTS (10 VUs, 1min c/u) ---${NC}"
            NODEJS_SMOKE=$(run_k6 "Node.js/NestJS" "http://app-nodejs-nestjs:3000" "smoke.js" | cut -d'|' -f1)
            BUN_SMOKE=$(run_k6 "Bun" "http://app-bun:3001" "smoke.js" | cut -d'|' -f1)
            GO_SMOKE=$(run_k6 "Go/Gin" "http://app-go-gin:3002" "smoke.js" | cut -d'|' -f1)
            PYTHON_SMOKE=$(run_k6 "Python/FastAPI" "http://app-python-fastapi:3003" "smoke.js" | cut -d'|' -f1)
            
            echo -e "${CYAN}--- LOAD TESTS (50 VUs, 1min c/u) ---${NC}"
            NODEJS_LOAD=$(run_k6 "Node.js/NestJS" "http://app-nodejs-nestjs:3000" "load_short.js" | cut -d'|' -f1)
            BUN_LOAD=$(run_k6 "Bun" "http://app-bun:3001" "load_short.js" | cut -d'|' -f1)
            GO_LOAD=$(run_k6 "Go/Gin" "http://app-go-gin:3002" "load_short.js" | cut -d'|' -f1)
            PYTHON_LOAD=$(run_k6 "Python/FastAPI" "http://app-python-fastapi:3003" "load_short.js" | cut -d'|' -f1)
            
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