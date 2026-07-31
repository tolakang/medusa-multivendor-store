# Medusa 2.0 Multi-Vendor E-Commerce Store

> **Medusa v2** multi-vendor e-commerce platform deployed on **Dokploy** (self-hosted PaaS on Ubuntu/Oracle Cloud).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dokploy (Ubuntu/Oracle Cloud)              │
│                                                              │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐           │
│  │   postgres   │ │  redis   │ │  meilisearch │           │
│  │   :5432      │ │  :6379   │ │   :7700      │           │
│  └──────┬───────┘ └────┬─────┘ └──────┬───────┘           │
│         └───────────────┼──────────────┘                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────┐           │
│  │              server (:9000)                   │           │
│  │  API + Admin Dashboard + Webhooks            │           │
│  └──────────────────────┬───────────────────────┘           │
│                         │                                    │
│  ┌──────────────────────┴───────────────────────┐           │
│  │              worker (no port)                  │           │
│  │  Background jobs, order processing            │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │         storefront (:3000)                   │             │
│  │  Next.js 14 + TailwindCSS                   │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| PostgreSQL | `postgres:16-alpine` | 5432 | Database |
| Redis | `redis:7-alpine` | 6379 | Cache + Sessions |
| Meilisearch | `getmeili/meilisearch:v1.12` | 7700 | Product Search |
| Medusa Server | Custom build | 9000 | API + Admin UI |
| Medusa Worker | Custom build | — | Background Jobs |
| Storefront | Custom build | 3000 | Next.js Storefront |

## Quick Start (5 Steps)

> **Prerequisites**: Dokploy installed on Ubuntu, domain pointed to your server, Git access to this repo.

### Step 1 — Deploy Infrastructure

1. In Dokploy → **Docker Compose** → **Create Service**
2. Name: `medusa-infra`
3. Upload: `docker-compose.infra.yml`
4. Set env vars:
   ```
   POSTGRES_USER=medusa
   POSTGRES_PASSWORD=YourStrongPassword123!
   POSTGRES_DB=medusa_store
   MEILISEARCH_ADMIN_KEY=YourMeilisearchMasterKey123!
   ```
5. Click **Deploy** → Wait 1-2 min for healthy logs
6. Find hostnames: SSH into server → `docker ps | grep -E "postgres|redis|meilisearch"`

### Step 2 — Deploy Server

1. Docker Compose → **Create Service** → Name: `medusa-server`
2. Upload: `docker-compose.server.yml`
3. Set env vars (use hostnames from Step 1):
   ```
   DATABASE_URL=postgresql://medusa:YourStrongPassword123!@medusa-infra-postgres:5432/medusa_store
   REDIS_URL=redis://medusa-infra-redis:6379
   MEILISEARCH_HOST=http://medusa-infra-meilisearch:7700
   MEILISEARCH_ADMIN_KEY=YourMeilisearchMasterKey123!
   JWT_SECRET=<generate-random-32-chars>
   COOKIE_SECRET=<generate-random-32-chars>
   MEDUSA_WORKER_MODE=server
   MEDUSA_DISABLE_ADMIN=false
   BACKEND_URL=https://api.yourdomain.com
   STORE_CORS=https://yourdomain.com
   ADMIN_CORS=https://admin.yourdomain.com
   AUTH_CORS=https://yourdomain.com,https://admin.yourdomain.com
   NODE_ENV=production
   ```
4. Click **Deploy** → Wait 10-15 min for first build
5. Add domain: `api.yourdomain.com` → Port 9000 → Enable HTTPS

### Step 3 — Deploy Worker

1. Docker Compose → **Create Service** → Name: `medusa-worker`
2. Upload: `docker-compose.worker.yml`
3. Set env vars (SAME secrets as server):
   ```
   DATABASE_URL=postgresql://medusa:YourStrongPassword123!@medusa-infra-postgres:5432/medusa_store
   REDIS_URL=redis://medusa-infra-redis:6379
   MEILISEARCH_HOST=http://medusa-infra-meilisearch:7700
   MEILISEARCH_ADMIN_KEY=YourMeilisearchMasterKey123!
   JWT_SECRET=<SAME as server>
   COOKIE_SECRET=<SAME as server>
   MEDUSA_WORKER_MODE=worker
   MEDUSA_DISABLE_ADMIN=true
   NODE_ENV=production
   ```
4. Click **Deploy** → Wait 5-10 min

### Step 4 — Deploy Storefront

1. Docker Compose → **Create Service** → Name: `medusa-storefront`
2. Upload: `docker-compose.storefront.yml`
3. Set env var:
   ```
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
   ```
4. Click **Deploy** → Wait 5-8 min
5. Add domain: `yourdomain.com` → Port 3000 → Enable HTTPS

### Step 5 — Create Admin User

```bash
# SSH into your server:
docker exec -it $(docker ps -q -f "name=medusa-server") \
  pnpm medusa user --email admin@yourdomain.com --password Admin123!
```

Login at `https://admin.yourdomain.com`

---

## Detailed Guide

For full environment variable reference, troubleshooting, and build optimization: **[DOKPLOY-DEPLOYMENT.md](./DOKPLOY-DEPLOYMENT.md)**

## Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Monorepo (all-in-one) |
| `docker-compose.infra.yml` | Infrastructure (postgres, redis, meilisearch) |
| `docker-compose.server.yml` | Medusa Server |
| `docker-compose.worker.yml` | Medusa Worker |
| `docker-compose.storefront.yml` | Next.js Storefront |
| `apps/backend/Dockerfile` | Generic build (monorepo) |
| `apps/backend/Dockerfile.server` | Server build |
| `apps/backend/Dockerfile.worker` | Worker build |
| `apps/backend/medusa-config.ts` | Medusa configuration |
| `.env.example` | Environment variables template |
| `DOKPLOY-DEPLOYMENT.md` | Full deployment guide |

## Documentation

- [Dokploy Deployment Guide](./DOKPLOY-DEPLOYMENT.md) — Full setup instructions
- [Medusa v2 Docs](https://docs.medusajs.com/) — Official documentation
- [Dokploy Docs](https://docs.dokploy.com/) — Platform documentation

## License

MIT
