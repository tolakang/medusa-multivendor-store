# Medusa 2.0 Multi-Vendor E-Commerce Store

> **Medusa v2** multi-vendor e-commerce platform deployed on **Dokploy** (self-hosted PaaS).

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

## Deployment Options

### ⚡ Individual Services (Recommended)
Faster builds, independent updates. See: [DOKPLOY-DEPLOYMENT.md](./DOKPLOY-DEPLOYMENT.md)

```
Deploy: infra → server → worker + storefront
```

### 🐳 Monorepo (All-in-One)
Single deploy, but slower. See: [DOKPLOY-DEPLOYMENT.md](./DOKPLOY-DEPLOYMENT.md)

## Quick Start

### Prerequisites
- Dokploy installed on Ubuntu
- Domain name pointed to your server
- Git access to this repository

### Deploy Individual Services
```bash
# 1. Create 4 Docker Compose services in Dokploy:
#    - infra  (docker-compose.infra.yml)
#    - server (docker-compose.server.yml)
#    - worker (docker-compose.worker.yml)
#    - storefront (docker-compose.storefront.yml)

# 2. Deploy in order: infra → server → worker + storefront

# 3. Configure domains in Dokploy:
#    - server:      admin.example.com  → port 9000
#    - storefront:  store.example.com  → port 3000

# 4. Create admin user:
docker exec -it <server-container> npx medusa user -e admin@example.com -p password
```

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

## Environment Variables

See [`.env.example`](./.env.example) for all variables. Key ones:

```env
# Database
POSTGRES_HOST=infra-postgres
REDIS_HOST=infra-redis
MEILISEARCH_HOST=infra-meilisearch

# Medusa
JWT_SECRET=your_32_char_random_string
COOKIE_SECRET=your_32_char_random_string
BACKEND_URL=https://admin.example.com
MEDUSA_WORKER_MODE=server  # or "worker" for worker service

# CORS
STORE_CORS=https://store.example.com
ADMIN_CORS=https://admin.example.com
```

## Documentation

- [Dokploy Deployment Guide](./DOKPLOY-DEPLOYMENT.md) — Full setup instructions
- [Medusa v2 Docs](https://docs.medusajs.com/) — Official documentation
- [Dokploy Docs](https://docs.dokploy.com/) — Platform documentation

## License

MIT
