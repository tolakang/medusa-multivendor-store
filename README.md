# Medusa 2.0 Multi-Vendor E-Commerce Platform

A complete Medusa 2.0 multi-vendor e-commerce platform deployed with Docker Compose on Dokploy.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dokploy (Ubuntu)                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐             │
│  │ Postgres │  │  Redis   │  │ Meilisearch  │             │
│  │  :5432   │  │  :6379   │  │    :7700     │             │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘             │
│       │              │               │                       │
│  ┌────┴──────────────┴───────────────┴───────┐             │
│  │           Medusa Server (:9000)            │             │
│  │  - API routes                              │             │
│  │  - Admin dashboard                         │             │
│  │  - Scheduled jobs                          │             │
│  └────────────────────┬───────────────────────┘             │
│                       │                                      │
│  ┌────────────────────┴───────────────────────┐             │
│  │           Medusa Worker (no port)           │             │
│  │  - Background jobs                          │             │
│  │  - Event processing                         │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │         Next.js Storefront (:8000)          │             │
│  │  - Product browsing                         │             │
│  │  - Cart & checkout                          │             │
│  │  - Customer accounts                        │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & event bus |
| Meilisearch | 7700 | Product search |
| Medusa Server | 9000 | API & admin |
| Medusa Worker | - | Background jobs |
| Next.js Storefront | 8000 | Customer-facing UI |

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/tolakang/medusa-multivendor-store.git
cd medusa-multivendor-store
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Deploy with Docker Compose

```bash
docker compose up -d
```

### 4. Create Admin User

```bash
docker compose exec medusa-server npx medusa user -e admin@yourdomain.com -p password
```

### 5. Access Services

- **Storefront**: http://localhost:8000
- **Admin**: http://localhost:9000
- **API**: http://localhost:9000

## Dokploy Deployment

See [DOKPLOY-DEPLOYMENT.md](./DOKPLOY-DEPLOYMENT.md) for detailed deployment instructions.

### Quick Dokploy Setup

1. Push to GitHub
2. Create Docker Compose service in Dokploy
3. Set build context: `./`
4. Set compose file: `./docker-compose.yml`
5. Configure environment variables
6. Deploy

## Development

```bash
# Start all services
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
│   ├── backend/           # Medusa 2.0 server
│   │   ├── src/           # Source code
│   │   ├── Dockerfile     # Multi-stage build
│   │   ├── package.json   # Dependencies
│   │   └── medusa-config.ts  # Configuration
│   └── storefront/        # Next.js storefront
│       ├── src/           # Source code
│       ├── Dockerfile     # Multi-stage build
│       └── package.json   # Dependencies
├── docker-compose.yml     # Service orchestration
├── .env.example           # Environment template
└── DOKPLOY-DEPLOYMENT.md  # Deployment guide
```

## Environment Variables

See `.env.example` for all required variables.

### Key Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `MEILISEARCH_HOST` | Meilisearch URL |
| `WORKER_MODE` | `server`, `worker`, or `shared` |
| `STORE_CORS` | Storefront origin |
| `ADMIN_CORS` | Admin dashboard origin |

## Troubleshooting

### Build Fails

```bash
# Clear Docker cache
docker builder prune -af

# Rebuild without cache
docker compose up -d --build --force-recreate
```

### Service Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check health
docker compose ps
```

### Database Issues

```bash
# Run migrations
docker compose exec medusa-server npx medusa db:migrate

# Reset database
docker compose exec postgres psql -U medusa -d medusa_store -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## License

MIT
