FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o server .

FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/docs ./docs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3002/api/users || exit 1

CMD ["./server"]