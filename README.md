# HCL Real-Time Live Polling Engine

A high-performance, real-time live polling application engineered with **Go (Gin framework)**, **Redis (Atomic Counters & Pub/Sub)**, **MongoDB**, and **React (Vite + Tailwind CSS)**.

---

## 🏗️ System Architecture & Data Flow

```text
                               ┌─────────────────────────┐
                               │ React Frontend (Vite)   │
                               │  - Live Recharts        │
                               │  - FingerprintJS Lock   │
                               │  - QR Code Share        │
                               └────────────┬────────────┘
                                            │
                             ┌──────────────┴──────────────┐
                             │ WebSocket & HTTP REST API   │
                             └──────────────┬──────────────┘
                                            │
                                  ┌─────────▼─────────┐
                                  │   Go (Gin) Server │
                                  └────┬───────────┬──┘
                                       │           │
                 ┌─────────────────────▼──┐     ┌──▼────────────────────┐
                 │ Redis (Memory Engine)  │     │ MongoDB (Persistence) │
                 │  - HINCRBY (Atomic)    │     │  - Users Collection   │
                 │  - SADD (Duplicate IP) │     │  - Polls Metadata     │
                 │  - Pub/Sub Channel     │     │  - Vote Audit Logs    │
                 └────────────────────────┘     └───────────────────────┘
```

### Component Breakdown
1. **Frontend (React + Vite + Tailwind CSS)**:
   - Dynamic user authentication (`/login`) with JWT stored in `localStorage`.
   - Poll creation wizard (`/create`) with dynamic choice inputs, duration picker, and instant QR Code SVG generation (`qrcode.react`).
   - Audience vote visualizer (`/poll/:id`) establishing a native WebSocket connection (`ws://.../api/polls/:id/ws`) to receive instant live result broadcasts without page refreshes.
   - Client-side fraud restriction enforcing device fingerprint locks via `@fingerprintjs/fingerprintjs`.

2. **Backend Engine (Go + Gin Framework)**:
   - High-concurrency REST endpoints (`/api/auth/*`, `/api/polls/*`) protected by JWT Middleware.
   - Gorilla WebSocket Upgrader & Client Connection Hub (`websocket/hub.go`) managing thread-safe client pools with `sync.RWMutex`.

3. **In-Memory Speed Layer (Redis 7)**:
   - **Atomic Vote Counters**: `HINCRBY poll:<id>:votes <option_id> 1` guarantees thread-safe vote counting without race conditions.
   - **Duplicate Restrictions**: `SADD poll:<id>:voters <fingerprint_or_ip>` blocks duplicate votes in memory at $O(1)$ speed.
   - **Pub/Sub Channel**: `PUBLISH poll:<id> <json_payload>` broadcasts updates instantly to all Gin WebSocket hubs across server clusters.

4. **Persistence Layer (MongoDB 7)**:
   - Stores durable user documents, poll metadata, and detailed `vote_records` audit trails asynchronously via background goroutines (`syncVoteToMongoDB`).

---

## 🚀 Quick Setup & Run Instructions

### Option A: Docker Compose (Recommended)

Run the entire stack (Go Backend, React Frontend, MongoDB, Redis) with a single command:

```bash
# Clone the repository and navigate to project root
cd HCL_LIVE_POLLING

# Build and launch containers
docker-compose up --build
```

Access the services:
- **React Frontend**: [http://localhost:5173](http://localhost:5173)
- **Go Gin Backend**: [http://localhost:8080/api/health](http://localhost:8080/api/health)
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`

---

### Option B: Local Manual Setup

#### 1. Start MongoDB & Redis
Ensure MongoDB (`localhost:27017`) and Redis (`localhost:6379`) are running on your system.

#### 2. Start Go Backend
```bash
cd backend

# Download dependencies
go mod download

# Run server
go run main.go
```
*Backend will start listening on port `8080`.*

#### 3. Start React Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend will launch on `http://localhost:5173`.*

---

## 🌐 Live Cloud Deployment Guide

### Deploy Backend (Go + Redis + MongoDB) on Render / Railway
1. **Render (Go Web Service)**:
   - Create a new **Web Service** on Render and connect your GitHub repository.
   - Root Directory: `backend`
   - Build Command: `go build -o main .`
   - Start Command: `./main`
   - Environment Variables:
     - `PORT`: `8080`
     - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/live_polling`
     - `REDIS_ADDR`: `<redis-host>.upstash.io:6379` or Railway Redis URL
     - `JWT_SECRET`: `<your-production-jwt-secret>`

2. **Redis Cloud / Upstash**:
   - Provision a free Redis instance on [Upstash Redis](https://upstash.com/) or Railway Add-ons and set `REDIS_ADDR` and `REDIS_PASSWORD` in your Go service environment.

### Deploy Frontend (React) on Vercel / Netlify
1. Connect your repository to **Vercel**.
2. Root Directory: `frontend`
3. Framework Preset: **Vite**
4. Environment Variables:
   - `VITE_API_URL`: `https://your-go-backend.onrender.com/api`
5. Deploy! Vercel automatically builds and hosts the static SPA with global CDN caching.

---

## 📹 Evaluation Video Q&A Summary

### 1. Key Technical Challenge Solved
> **Challenge**: *Maintaining sub-millisecond vote latency while synchronizing live WebSocket state across concurrent server instances without memory leaks or race conditions.*
>
> **Solution**: We combined Redis atomic operations with a Pub/Sub message broker pattern. Incoming votes execute `HINCRBY` in Redis ($O(1)$ sub-millisecond speed) and check voter sets with `SADD`. Instead of holding lock state in application memory, the backend publishes a `VOTE_UPDATE` message to the Redis channel `poll:<id>`. All subscribed Go WebSocket hubs receive the event concurrently and push the payload to active client browsers. Persistent MongoDB updates are dispatched asynchronously via non-blocking goroutines, ensuring zero latency impact for the voting audience.

### 2. AI Tools Usage Summary
> **AI Collaboration**: Built in pair-programming collaboration with **Antigravity AI Assistant**.
> - **Architecture & Data Design**: Designed the Redis `INCR` + Pub/Sub + MongoDB hybrid storage architecture.
> - **High-Concurrency Go Code**: Generated clean, thread-safe Go code with `sync.RWMutex`, JWT authentication, and gorilla WebSocket upgraders.
> - **Rich Aesthetic Frontend**: Built modern glassmorphism React views using Vite, Tailwind CSS v4, Lucide React, and Recharts.
> - **Production Deployment**: Created multi-stage `Dockerfile`s and `docker-compose.yml` configurations optimized for minimal container image sizes.
