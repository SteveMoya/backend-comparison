.PHONY: help install build up down test clean lint typecheck

help:
	@echo "Backend Comparison - Available Commands"
	@echo ""
	@echo "  make install    - Install dependencies for all technologies"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make test      - Run tests for all technologies"
	@echo "  make lint      - Run linters"
	@echo "  make typecheck - Run type checkers"
	@echo "  make clean     - Clean up containers and volumes"
	@echo ""

install:
	cd src/nodejs-nestjs && npm ci
	cd src/bun && bun install --frozen-lockfile
	cd src/go-gin && go mod download
	cd src/python-fastapi && pip install -r requirements.txt

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

test:
	cd src/nodejs-nestjs && npm test
	cd src/bun && bun test
	cd src/go-gin && go test ./...
	cd src/python-fastapi && pytest

lint:
	cd src/nodejs-nestjs && npm run lint || true
	cd src/bun && bun run lint || true
	cd src/go-gin && golangci-lint run ./... || true
	cd src/python-fastapi && ruff check . || true

typecheck:
	cd src/nodejs-nestjs && npm run typecheck || true
	cd src/bun && bun run typecheck || true
	cd src/go-gin && go vet ./... || true
	cd src/python-fastapi && mypy . || true

clean:
	docker compose down -v
	rm -rf src/nodejs-nestjs/dist
	rm -rf src/bun/node_modules
	rm -rf src/go-gin/coverage
	rm -rf src/python-fastapi/.coverage

benchmark:
	./benchmarks/run-benchmarks.sh all

benchmark-smoke:
	./benchmarks/run-benchmarks.sh smoke

benchmark-load:
	./benchmarks/run-benchmarks.sh load

benchmark-stress:
	./benchmarks/run-benchmarks.sh stress