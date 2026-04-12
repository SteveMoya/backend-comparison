FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
RUN bun install --frozen-lockfile
ENV HOST=0.0.0.0
ENV PORT=3004
EXPOSE 3004
CMD ["bun", "./dist/server/entry.mjs"]