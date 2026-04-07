#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
K6_SCRIPTS_DIR="${SCRIPT_DIR}/k6"

mkdir -p "${RESULTS_DIR}"

run_benchmark() {
  local test_type=$1
  local target_url=$2
  local tech_name=$3

  echo "Running ${test_type} benchmark for ${tech_name}..."
  echo "Target URL: ${target_url}"

  local output_file="${RESULTS_DIR}/${test_type}_${tech_name}_$(date +%Y%m%d_%H%M%S).json"

  k6 run \
    --out json="${output_file}" \
    --env BASE_URL="${target_url}" \
    "${K6_SCRIPTS_DIR}/${test_type}.js"

  echo "Results saved to: ${output_file}"
}

run_all_techs() {
  local test_type=$1
  local techs=(
    "nodejs-nestjs:http://localhost:3000"
    "bun:http://localhost:3001"
    "go-gin:http://localhost:3002"
    "python-fastapi:http://localhost:3003"
  )

  for tech in "${techs[@]}"; do
    IFS=':' read -r name url <<< "$tech"
    run_benchmark "$test_type" "$url" "$name"
  done
}

case "${1}" in
  smoke)
    test_type="${2:-smoke}"
    tech="${3:-}"
    if [ -n "$tech" ]; then
      run_benchmark "$test_type" "http://localhost:3000" "$tech"
    else
      run_all_techs "$test_type"
    fi
    ;;
  load)
    run_all_techs "load"
    ;;
  stress)
    run_all_techs "stress"
    ;;
  spike)
    run_all_techs "spike"
    ;;
  soak)
    run_all_techs "soak"
    ;;
  all)
    run_all_techs "smoke"
    run_all_techs "load"
    run_all_techs "stress"
    ;;
  *)
    echo "Usage: $0 {smoke|load|stress|spike|soak|all} [test_type] [tech_name]"
    echo ""
    echo "Examples:"
    echo "  $0 smoke                    # Run smoke test on all technologies"
    echo "  $0 smoke load nodejs-nestjs # Run load test only for Node.js"
    echo "  $0 all                      # Run all tests on all technologies"
    exit 1
    ;;
esac

echo ""
echo "=== Benchmark Summary ==="
echo "Results directory: ${RESULTS_DIR}"
ls -lh "${RESULTS_DIR}"