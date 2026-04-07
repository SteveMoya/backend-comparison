FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build || true

FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package*.json ./

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/users || exit 1

CMD ["bun", "run", "src/index.ts"]