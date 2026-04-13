# Skill Registry

**Project**: backend-comparison
**Generated**: 2026-04-11
**Mode**: sdd-init

## Project Skills

SDD Phase Skills (from ~/.config/opencode/skills/):

| Skill | Trigger | Purpose |
|-------|---------|---------|
| sdd-explore | Explore and investigate ideas | Investigate AstroJS for backend comparison |
| sdd-propose | Create change proposal | Create proposal for AstroJS addition |
| sdd-spec | Write specifications | Write specs for AstroJS backend |
| sdd-design | Technical design | Create architecture for new backend |
| sdd-tasks | Task breakdown | Break down implementation |
| sdd-apply | Implement tasks | Write code for AstroJS backend |
| sdd-verify | Validate implementation | Verify against specs |
| sdd-archive | Archive change | Complete the change |
| go-testing | Go testing | Testing patterns for Bun/Elysia |
| branch-pr | PR workflow | Create PR for the change |
| issue-creation | Issue creation | Track work items |

## Project Conventions

### Stack Patterns

Multi-backend project with:
- 4 existing backends: nodejs-nestjs, bun, go-gin, python-fastapi
- Docker Compose orchestration
- GitHub Actions CI with matrix strategy

### Commands (Makefile)

```bash
make install    # Install dependencies
make build     # Build Docker images
make up       # Start services
make down     # Stop services
make test     # Run tests
make lint     # Run linters
make typecheck # Run type checkers
```

### Code Quality

| Backend | Linter | Type Checker |
|--------|--------|-------------|
| nodejs-nestjs | ESLint | tsc |
| bun | ESLint | bun tsc |
| go-gin | golangci-lint | go vet |
| python-fastapi | ruff | mypy |

## Active Context

User wants to add **AstroJS as 5th backend** for comparison.

## Related Observations

- `sdd-init/backend-comparison` - Project context
- `sdd/backend-comparison/testing-capabilities` - Testing config