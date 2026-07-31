# Medusa 2.0 Multi-Vendor E-Commerce Platform

A complete Medusa 2.0 multi-vendor e-commerce platform for deployment on Dokploy.

## Quick Start

### Option A: Individual Services (Recommended)

Deploy each service separately for faster builds and independent updates:

```bash
# 1. Deploy infrastructure first
# Use: docker-compose.infra.yml

# 2. Deploy server
# Use: docker-compose.server.yml

# 3. Deploy worker + storefront (can be parallel)
# Use: docker-compose.worker.yml + docker-compose.storefront.yml
```

See [DOKPLOY-DEPLOYMENT.md](./DOKPLOY-DEPLOYMENT.md) for detailed instructions.

### Option B: Monorepo (All-in-One)

Deploy everything at once:

```bash
docker compose up -d
```

## Services

| Service | Compose File | Port | Description |
|---------|-------------|------|-------------|
| PostgreSQL | `docker-compose.infra.yml` | 5432 | Database |
| Redis | `docker-compose.infra.yml` | 6379 | Cache & events |
| Meilisearch | `docker-compose.infra.yml` | 7700 | Product search |
| Medusa Server | `docker-compose.server.yml` | 9000 | API & admin |
| Medusa Worker | `docker-compose.worker.yml` | - | Background jobs |
| Storefront | `docker-compose.storefront.yml` | 8000 | Next.js UI |
| All Services | `docker-compose.yml` | - | Monorepo deploy |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dokploy (Ubuntu)                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐             │
│  │ Postgres │  │  Redis   │  │ Meilisearch  │             │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘             │
│       │              │               │                       │
│  ┌────┴──────────────┴───────────────┴───────┐             │
│  │         Medusa Server (:9000)              │             │
│  │  WORKER_MODE=server                        │             │
│  └────────────────────┬───────────────────────┘             │
│                       │                                      │
│  ┌────────────────────┴───────────────────────┐             │
│  │         Medusa Worker (no port)             │             │
│  │  WORKER_MODE=worker                        │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │       Next.js Storefront (:8000)            │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Development

```bash
# Start all services locally
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild after changes
docker compose up -d --build
```

## Project Structure

```
medusa-multivendor-store/
├── apps/
│   ├── backend/
│   │   ├── Dockerfile.server    # Server-specific build
│   │   ├── Dockerfile.worker    # Worker-specific build
│   │   ├── Dockerfile           # Generic build (monorepo)
│   │   ├── src/                 # Source code
│   │   ├── package.json
│   │   └── medusa-config.ts
│   └── storefront/
│       ├── Dockerfile
│       ├── src/
│       └── package.json
├── docker-compose.yml           # All-in-one
├── docker-compose.infra.yml     # PostgreSQL, Redis, Meilisearch
├── docker-compose.server.yml    # Medusa Server
├── docker-compose.worker.yml    # Medusa Worker
├── docker-compose.storefront.yml # Storefront
├── .env.example                 # Environment template
└── DOKPLOY-DEPLOYMENT.md        # Deployment guide
```

## Environment Variables

See `.env.example` for all required variables.

## License

MIT
