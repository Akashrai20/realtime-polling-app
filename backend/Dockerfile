# Stage 1: Build binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy source files
COPY . .

# Tidy module dependencies & generate go.sum
RUN go mod tidy

# Build lightweight CGO-disabled binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main .

# Stage 2: Production alpine image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
