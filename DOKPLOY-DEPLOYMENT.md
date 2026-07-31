# Dokploy Deployment Guide — Medusa 2.0 Multi-Vendor Store

## Two Deployment Options

### Option A: Individual Services (Recommended for Dokploy)
Deploy each service separately for faster builds and independent updates.

### Option B: Monorepo (All-in-One)
Deploy everything in a single Docker Compose. Slower but simpler.

---

## Option A: Individual Services (Recommended)

### Deployment Order

```
1. Infrastructure (PostgreSQL, Redis, Meilisearch)
         ↓
2. Medusa Server (API + Admin)
         ↓
3. Medusa Worker (Background Jobs)
4. Storefront (Next.js)  ← can deploy in parallel with worker
```

### Step 1: Deploy Infrastructure

1. **Dokploy** → Create Service → **Docker Compose**
2. Service Name: `medusa-infra`
3. Git Repository: `https://github.com/tolakang/medusa-multivendor-store.git`
4. Branch: `main`
5. Build Context: `./`
6. Compose File: `./docker-compose.infra.yml`
7. Set environment variables:

```env
POSTGRES_USER=medusa
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=medusa_store
MEILISEARCH_ADMIN_KEY=your_meilisearch_master_key
```

8. **Deploy** and wait for all 3 services to be healthy

### Step 2: Deploy Medusa Server

1. **Dokploy** → Create Service → **Docker Compose**
2. Service Name: `medusa-server`
3. Compose File: `./docker-compose.server.yml`
4. Set environment variables:

```env
# Database (must match infrastructure)
POSTGRES_USER=medusa
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=medusa_store
POSTGRES_HOST=medusa-infra-postgres
POSTGRES_PORT=5432

# Redis
REDIS_HOST=medusa-infra-redis
REDIS_PORT=6379

# Meilisearch
MEILISEARCH_HOST=medusa-infra-meilisearch
MEILISEARCH_PORT=7700
MEILISEARCH_ADMIN_KEY=your_meilisearch_master_key

# Medusa
JWT_SECRET=your_random_32_char_string
COOKIE_SECRET=another_random_32_char_string
BACKEND_URL=https://your-admin-domain.com
MEDUSA_WORKER_MODE=server
MEDUSA_DISABLE_ADMIN=false

# CORS
STORE_CORS=https://your-storefront-domain.com
ADMIN_CORS=https://your-admin-domain.com
AUTH_CORS=https://your-storefront-domain.com,https://your-admin-domain.com
```

5. **Deploy** and wait for health check to pass

### Step 3: Deploy Medusa Worker

1. **Dokploy** → Create Service → **Docker Compose**
2. Service Name: `medusa-worker`
3. Compose File: `./docker-compose.worker.yml`
4. Set environment variables (same database/redis/meilisearch as server):

```env
POSTGRES_USER=medusa
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=medusa_store
POSTGRES_HOST=medusa-infra-postgres
POSTGRES_PORT=5432
REDIS_HOST=medusa-infra-redis
REDIS_PORT=6379
MEILISEARCH_HOST=medusa-infra-meilisearch
MEILISEARCH_PORT=7700
MEILISEARCH_ADMIN_KEY=your_meilisearch_master_key
JWT_SECRET=your_random_32_char_string
COOKIE_SECRET=another_random_32_char_string
MEDUSA_WORKER_MODE=worker
MEDUSA_DISABLE_ADMIN=true
```

5. **Deploy**

### Step 4: Deploy Storefront

1. **Dokploy** → Create Service → **Docker Compose**
2. Service Name: `medusa-storefront`
3. Compose File: `./docker-compose.storefront.yml`
4. Set environment variables:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-admin-domain.com
NEXT_PUBLIC_BASE_URL=https://your-storefront-domain.com
STORE_NAME=Medusa Multi-Vendor Store
```

5. **Deploy**

### Step 5: Configure Domains

In Dokploy **Domains** tab for each service:

| Service | Domain | Internal Port |
|---------|--------|---------------|
| medusa-server | admin.example.com | 9000 |
| medusa-storefront | store.example.com | 3000 |

### Step 6: Create Admin User

In Dokploy terminal:
```bash
docker compose exec medusa-server npx medusa user -e admin@example.com -p password
```

---

## Option B: Monorepo (All-in-One)

### Quick Deploy

1. **Dokploy** → Create Service → **Docker Compose**
2. Service Name: `medusa-store`
3. Compose File: `./docker-compose.yml`
4. Set all environment variables (see `.env.example`)
5. **Deploy**

---

## Service Communication

When using individual services, they communicate via Docker networking:

```
┌─────────────────────────────────────────────────┐
│              Dokploy Project Network              │
│                                                   │
│  medusa-infra-postgres ←─── medusa-server         │
│  medusa-infra-redis   ←─── medusa-server         │
│  medusa-infra-meilisearch ← medusa-server        │
│                                                   │
│  medusa-infra-postgres ←─── medusa-worker         │
│  medusa-infra-redis   ←─── medusa-worker         │
│  medusa-infra-meilisearch ← medusa-worker        │
│                                                   │
│  medusa-server ←───────── medusa-storefront       │
└─────────────────────────────────────────────────┘
```

**Important:** Service names in Dokploy follow the pattern:
- `{project-name}-{service-name}-{component}`
- Example: If project is `medusa` and service is `medusa-infra`, the PostgreSQL host is `medusa-medusa-infra-postgres`

Check actual service names in Dokploy's **Docker** → **Containers** tab.

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `medusa` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `strong_password` |
| `POSTGRES_DB` | Database name | `medusa_store` |
| `POSTGRES_HOST` | PostgreSQL host | `medusa-infra-postgres` |
| `REDIS_HOST` | Redis host | `medusa-infra-redis` |
| `MEILISEARCH_HOST` | Meilisearch host | `medusa-infra-meilisearch` |
| `MEILISEARCH_ADMIN_KEY` | Meilisearch master key | `your_master_key` |
| `JWT_SECRET` | JWT token secret | `random_32_chars` |
| `COOKIE_SECRET` | Cookie signing secret | `random_32_chars` |
| `BACKEND_URL` | Backend public URL | `https://admin.example.com` |
| `MEDUSA_WORKER_MODE` | `server`, `worker`, or `shared` | `server` |
| `MEDUSA_DISABLE_ADMIN` | `true` to disable admin | `false` |
| `STORE_CORS` | Storefront origin | `https://store.example.com` |
| `ADMIN_CORS` | Admin dashboard origin | `https://admin.example.com` |
| `AUTH_CORS` | Auth endpoints origin | Both domains comma-separated |

---

## Troubleshooting

### Individual Services Can't Connect

1. Check all services are in the same Dokploy project
2. Verify service names in Docker Containers tab
3. Use correct host format: `{project}-{service}-{component}`

### Build Fails

```bash
# In Dokploy terminal
docker builder prune -af
```

### Server Won't Start

```bash
# Check if infrastructure is healthy
docker compose -f docker-compose.infra.yml ps

# Check server logs
docker compose -f docker-compose.server.yml logs medusa-server
```

### Worker Can't Connect to Server

Worker doesn't connect to server directly — they share the same database and Redis. Ensure:
- Same `DATABASE_URL`
- Same `REDIS_URL`
- Same `JWT_SECRET` and `COOKIE_SECRET`
