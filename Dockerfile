# Stage 1: Build Go Backend Binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy backend go.mod and go.sum
COPY backend/go.mod backend/go.sum* ./
RUN go mod download

# Copy backend source files
COPY backend/ ./

# Build lightweight CGO-disabled binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main .

# Stage 2: Production alpine image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
