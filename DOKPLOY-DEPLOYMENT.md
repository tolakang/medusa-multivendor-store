# Medusa 2.0 Multi-Vendor — Dokploy Deployment Guide

## Overview

This guide covers deploying the Medusa 2.0 multi-vendor e-commerce platform on Dokploy.
Both **monorepo** (all services in one compose) and **individual services** (separate deploys) are supported.

**Package manager**: pnpm (2-3x faster than npm, stricter dependency resolution).

## Quick Start

### 1. Deploy Individual Services (Recommended)

Deploy infrastructure first, then app services. This is faster and allows independent updates.

#### Step 1: Deploy Infrastructure

In Dokploy:
1. Go to **Docker Compose**
2. Upload `docker-compose.infra.yml` or paste its contents
3. Name it: `medusa-infra`
4. Click **Deploy**

**Wait for all 3 services to be healthy** before proceeding:
- Check Dokploy → Docker Compose → your `medusa-infra` service → Logs
- You should see Meilisearch listening on `0.0.0.0:7700`
- PostgreSQL and Redis should show "ready to accept connections"

#### Step 2: Deploy Server

1. Create a new Docker Compose service in Dokploy
2. Upload `docker-compose.server.yml`
3. Name it: `medusa-server`
4. Click **Deploy**
5. Wait 5-15 minutes for first build (pnpm install + medusa build)

#### Step 3: Deploy Worker

1. Create another Docker Compose service
2. Upload `docker-compose.worker.yml`
3. Name it: `medusa-worker`
4. Click **Deploy**

#### Step 4: Deploy Storefront

1. Create another Docker Compose service
2. Upload `docker-compose.storefront.yml`
3. Name it: `medusa-storefront`
4. Click **Deploy**

#### Step 5: Get Service Hostnames

Run in Dokploy Docker Terminal for each service:
```bash
# For postgres, redis, meilisearch hostnames:
# Click the infrastructure service in Dokploy → Docker Terminal → run:
cat /etc/hosts | head -5
```

Common hostnames:
- PostgreSQL: `medusa-infra-postgres` or `medusa-js-medusainfra-xxx-postgres-1`
- Redis: `medusa-infra-redis` or `medusa-js-medusainfra-xxx-redis-1`
- Meilisearch: `medusa-infra-meilisearch`

> **Note:** Docker is NOT available inside containers. You cannot run `docker ps` from the Dokploy Docker Terminal. Use `cat /etc/hosts` or `hostname` instead.

#### Step 6: Configure Domains

In Dokploy, go to each service → Domains:
- **Server**: `api.yourdomain.com` → Port 9000
- **Storefront**: `yourdomain.com` → Port 3000

Enable "Use HTTPS" (Let's Encrypt).

---

### 2. Deploy Monorepo (All-in-One)

1. In Dokploy, go to **Docker Compose**
2. Upload `docker-compose.yml`
3. Set all environment variables (see below)
4. Click **Deploy**
5. Wait 10-20 minutes

---

## Environment Variables

### Infrastructure Variables (for medusa-infra)

```bash
# PostgreSQL
POSTGRES_USER=medusa
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=medusa

# Meilisearch
MEILI_MASTER_KEY=your-meilisearch-master-key-here
MEILI_ENV=production
```

### Server/Worker Variables (for medusa-server and medusa-worker)

```bash
# Database
DATABASE_URL=postgresql://medusa:your-secure-password@medusa-infra-postgres:5432/medusa

# Redis
REDIS_URL=redis://medusa-infra-redis:6379

# Meilisearch
MEILISEARCH_HOST=http://medusa-infra-meilisearch:7700
MEILISEARCH_API_KEY=your-meilisearch-master-key-here

# Admin
MEDUSA_DISABLE_ADMIN=false
ADMIN_EMAIL=admin@yourdomain.com

# Secrets (change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this
COOKIE_SECRET=your-super-secret-cookie-key-change-this

# Worker Mode
MEDUSA_WORKER_MODE=server

# Node.js
NODE_ENV=production

# CORS (set to your storefront URL)
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:7001
```

### Storefront Variables (for medusa-storefront)

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your-publishable-key-here
```

> **Important:** `NEXT_PUBLIC_*` variables are set in `build: args:` because Next.js inlines them at build time.

---

## Build Times (Expected)

| Service | First Build | Cached Build |
|---------|------------|-------------|
| Infrastructure (postgres/redis/meilisearch) | 1-2 minutes | 10-30 seconds |
| Medusa Server | 5-15 minutes | 1-3 minutes |
| Medusa Worker | 5-15 minutes | 1-3 minutes |
| Storefront | 3-5 minutes | 30-60 seconds |

First builds are slow due to `pnpm install` (downloading + installing ~500-800 packages) and TypeScript compilation. Subsequent builds use Docker cache.

---

## Troubleshooting

### Server Fails to Start

**Symptoms**: Container exits immediately or shows "database not ready"
**Fix**: Ensure infrastructure services are running and hostnames are correct. Check:
- Database URL uses correct hostname
- Redis URL uses correct hostname
- PostgreSQL is accepting connections

### Build Fails During npm install

**Symptoms**: E429 (rate limit) or ERESOLVE (peer dep conflict)
**Fix**: pnpm handles this much better than npm. If it still fails:
- Check internet connectivity on your server
- Try again (rate limits are temporary)

### Storefront Shows "Something went wrong"

**Symptoms**: Storefront loads but shows error
**Fix**: Check:
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is set correctly
- Server domain has HTTPS enabled
- CORS is configured properly

### Slow First Deployment

**Symptoms**: Server deployment takes 15+ minutes
**Cause**: pnpm install downloads all packages from scratch. This is normal.
**Fix**: Wait for completion. Subsequent deploys will be much faster (1-3 min) due to Docker cache.

### ts-node Not Found

**Symptoms**: "Cannot find module ts-node" or "Failed to load medusa-config.ts"
**Fix**: Ensure `ts-node` is in `dependencies` (not `devDependencies`) and `NODE_ENV=development` is set in the builder stage.

### Health Check Fails (180s timeout)

**Symptoms**: "health check failed" in Dokploy
**Cause**: Server is still starting up (pnpm install + medusa build + migrations)
**Fix**: Increase health check `start_period` or wait longer. First deploy may take up to 15 minutes.

---

## SSL / HTTPS Setup

1. **In Dokploy → Domains**:
   - Add domain (e.g., `api.yourdomain.com`)
   - Port: 9000
   - Enable "Use HTTPS" (Let's Encrypt)
   - Repeat for storefront (port 3000)

2. **Update CORS**:
   ```bash
   STORE_CORS=https://yourdomain.com
   ADMIN_CORS=https://admin.yourdomain.com
   ```

---

## DNS Configuration

Set up DNS records for your domains:
```
A  api.yourdomain.com     → Your Oracle Cloud IP
A  yourdomain.com         → Your Oracle Cloud IP
```

---

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Server/Worker | PostgreSQL connection string |
| `REDIS_URL` | Server/Worker | Redis connection string |
| `MEILISEARCH_HOST` | Server/Worker | Meilisearch URL |
| `MEILISEARCH_API_KEY` | Server/Worker | Meilisearch master key |
| `JWT_SECRET` | Server/Worker | JWT signing secret |
| `COOKIE_SECRET` | Server/Worker | Cookie signing secret |
| `MEDUSA_WORKER_MODE` | Server/Worker | `server`, `worker`, or `shared` |
| `MEDUSA_DISABLE_ADMIN` | Server | `false` to enable admin |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Storefront | Backend API URL (build-time) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Storefront | API publishable key (build-time) |
| `POSTGRES_USER` | Infrastructure | PostgreSQL username |
| `POSTGRES_PASSWORD` | Infrastructure | PostgreSQL password |
| `POSTGRES_DB` | Infrastructure | Database name |
| `MEILI_MASTER_KEY` | Infrastructure | Meilisearch master key |
| `MEILI_ENV` | Infrastructure | `production` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Dokploy Host                         │
│                    (Oracle Cloud Ubuntu)                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Infrastructure Services                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │   │
│  │  │PostgreSQL│ │  Redis   │ │   Meilisearch     │   │   │
│  │  │  :5432   │ │  :6379   │ │      :7700        │   │   │
│  │  └──────────┘ └──────────┘ └───────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Application Services                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │    Server     │  │    Worker    │  │Storefront│  │   │
│  │  │    :9000      │  │    (none)    │  │   :3000  │  │   │
│  │  │  API + Admin  │  │ Async Jobs   │  │  Next.js │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Docker Network (shared)                 │   │
│  │  All services can reach each other by hostname       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Service Dependencies

- **Server** → PostgreSQL, Redis, Meilisearch
- **Worker** → PostgreSQL, Redis, Meilisearch
- **Storefront** → Server (via HTTP)
- **Infrastructure** → None (independent)

## Creating Admin User

After server is running:
```bash
# Use Docker Terminal in Dokploy on the server service, or SSH into host:
docker exec -it <server-container> npx medusa user --email admin@yourdomain.com --password admin123
```

## Updating Services

### Individual Services
Update and redeploy each service independently. Server and Worker share the same codebase but run in different modes.

### Monorepo
Redeploy the single compose service. All services restart.

## File Structure

```
├── apps/
│   ├── backend/
│   │   ├── Dockerfile              # Monorepo Docker build
│   │   ├── Dockerfile.server       # Server-specific Docker build
│   │   ├── Dockerfile.worker       # Worker-specific Docker build
│   │   ├── package.json
│   │   ├── medusa-config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── scripts/
│   │           ├── start-server.sh
│   │           ├── start-worker.sh
│   │           ├── start-monorepo.sh
│   │           └── post-build.js
│   └── storefront/
│       ├── Dockerfile
│       ├── package.json
│       ├── next.config.js
│       └── tsconfig.json
├── docker-compose.yml              # Monorepo (all-in-one)
├── docker-compose.infra.yml        # Infrastructure only
├── docker-compose.server.yml       # Server only
├── docker-compose.worker.yml       # Worker only
├── docker-compose.storefront.yml   # Storefront only
├── .env.example
├── .dockerignore
├── .gitignore
├── DOKPLOY-DEPLOYMENT.md
└── README.md
```
