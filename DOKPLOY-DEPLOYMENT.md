# Medusa 2.0 Multi-Vendor — Dokploy Deployment Guide

## Overview

This guide covers deploying the Medusa 2.0 multi-vendor e-commerce platform on Dokploy.
Both **monorepo** (all services in one compose) and **individual services** (separate deploys) are supported.

**Package manager**: pnpm (2-3x faster than npm, stricter dependency resolution).

---

## ⚡ Recommended: Individual Services (Step-by-Step)

Deploy 4 separate Docker Compose services in order. Each service is independent and can be updated separately.

**Deploy order**: infra → server → worker + storefront

---

### Step 1: Deploy Infrastructure (postgres + redis + meilisearch)

This is the FIRST thing to deploy. It runs 3 containers that your app services need.

#### 1.1 Create the service

1. Log in to Dokploy dashboard
2. Click **Docker Compose** in the left sidebar
3. Click **Create Service**
4. Fill in:
   - **Service Name**: `medusa-infra`
   - **Description**: `PostgreSQL, Redis, Meilisearch`

#### 1.2 Upload the compose file

1. Click the **Compose** tab (or "Docker Compose" section)
2. Click **Upload** and select `docker-compose.infra.yml` from this repo
3. OR paste the contents of `docker-compose.infra.yml` directly

#### 1.3 Set environment variables

Click the **Environment Variables** tab (or **Env** section) and add these **exact values**:

```bash
# ---- PostgreSQL ----
POSTGRES_USER=medusa
POSTGRES_PASSWORD=YourStrongPassword123!
POSTGRES_DB=medusa_store

# ---- Meilisearch ----
MEILISEARCH_ADMIN_KEY=YourMeilisearchMasterKey123!
```

> ⚠️ **IMPORTANT**: Replace the passwords/keys above with your own strong values. Remember these — you'll need them again for Steps 2-4.

> 💡 **Tip**: Generate strong random values with: `openssl rand -base64 32`

#### 1.4 Deploy

1. Click **Deploy**
2. Wait 1-2 minutes
3. Go to **Logs** tab — you should see:
   - PostgreSQL: `database system is ready to accept connections`
   - Redis: `Ready to accept connections`
   - Meilisearch: `Server listening on: http://0.0.0.0:7700`

#### 1.5 Find the hostnames (CRITICAL — needed for Steps 2-4)

After deployment, you need the Docker hostnames for postgres, redis, and meilisearch. These are the addresses your server/worker use to connect to the databases.

**Method 1 — SSH into your server** (recommended):
```bash
docker ps | grep -E "postgres|redis|meilisearch"
docker network ls | grep medusa
docker network inspect <network-name> | grep "Name"
```

**Method 2 — Dokploy Docker Terminal**:
1. Click on the `medusa-infra` service in Dokploy
2. Click **Terminal** tab
3. Run: `cat /etc/hosts`
4. Look for lines like:
   - `172.18.0.2  medusa-infra-postgres`
   - `172.18.0.3  medusa-infra-redis`
   - `172.18.0.4  medusa-infra-meilisearch`

**Common hostnames** (may vary):
- PostgreSQL: `medusa-infra-postgres`
- Redis: `medusa-infra-redis`
- Meilisearch: `medusa-infra-meilisearch`

> ⚠️ **Note**: Docker is NOT available inside containers. You cannot run `docker ps` from the Dokploy Docker Terminal. Use SSH instead.

**Write these hostnames down** — you'll need them for Steps 2, 3, and 4.

---

### Step 2: Deploy Medusa Server (API + Admin Dashboard)

Deploy the Medusa server AFTER infrastructure is healthy.

#### 2.1 Create the service

1. Go to **Docker Compose** → **Create Service**
2. Fill in:
   - **Service Name**: `medusa-server`
   - **Description**: `Medusa API + Admin Dashboard`

#### 2.2 Upload the compose file

1. Click **Upload** and select `docker-compose.server.yml`
2. OR paste its contents

#### 2.3 Set environment variables

Click **Environment Variables** and add these **exact values**:

```bash
# ---- Database Connection ----
DATABASE_URL=postgresql://medusa:YourStrongPassword123!@medusa-infra-postgres:5432/medusa_store

# ---- Redis Connection ----
REDIS_URL=redis://medusa-infra-redis:6379

# ---- Meilisearch Connection ----
MEILISEARCH_HOST=http://medusa-infra-meilisearch:7700
MEILISEARCH_ADMIN_KEY=YourMeilisearchMasterKey123!

# ---- Security Secrets (CHANGE THESE!) ----
JWT_SECRET=generate-a-random-32-char-string
COOKIE_SECRET=generate-another-random-32-char-string

# ---- Server Mode ----
MEDUSA_WORKER_MODE=server
MEDUSA_DISABLE_ADMIN=false

# ---- Backend URL (your public API domain) ----
BACKEND_URL=https://api.yourdomain.com

# ---- CORS (set to your actual domain URLs) ----
STORE_CORS=https://yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://yourdomain.com,https://admin.yourdomain.com

# ---- Node Environment ----
NODE_ENV=production
```

> ⚠️ **You MUST replace these values**:
> - `YourStrongPassword123!` → your actual PostgreSQL password (from Step 1.3)
> - `medusa-infra-postgres` → the actual hostname from Step 1.5
> - `medusa-infra-redis` → the actual hostname from Step 1.5
> - `medusa-infra-meilisearch` → the actual hostname from Step 1.5
> - `YourMeilisearchMasterKey123!` → your actual Meilisearch key (from Step 1.3)
> - `generate-a-random-32-char-string` → generate with `openssl rand -base64 32`
> - `yourdomain.com` → your actual domain
> - `api.yourdomain.com` → your API subdomain

#### 2.4 Deploy

1. Click **Deploy**
2. First build takes **10-15 minutes** (pnpm install + medusa build)
3. Go to **Logs** and wait for:
   ```
   Medusa Server Starting
   Waiting for PostgreSQL... PostgreSQL is ready!
   Waiting for Redis... Redis is ready!
   Running database migrations...
   Starting Medusa server on port 9000...
   Server listening on port 9000
   ```

> ⏱️ **Expected timeline**:
> - 0-5 min: Docker build + pnpm install
> - 5-10 min: medusa build (TypeScript compilation)
> - 10-12 min: post-build.js (production deps install)
> - 12-15 min: Container start + DB wait + migrations

#### 2.5 Test the server

After deployment succeeds:
1. Go to **Domains** tab in Dokploy
2. Add a domain:
   - **Domain**: `api.yourdomain.com`
   - **Port**: `9000`
   - **HTTPS**: ✅ Enable (Let's Encrypt)
3. Wait for SSL certificate
4. Visit `https://api.yourdomain.com/health` → should return JSON `{"status":"ok"}`
5. Visit `https://api.yourdomain.com/admin` → should show admin login page

---

### Step 3: Deploy Medusa Worker (Background Jobs)

Deploy the worker AFTER server is running.

#### 3.1 Create the service

1. Go to **Docker Compose** → **Create Service**
2. Fill in:
   - **Service Name**: `medusa-worker`
   - **Description**: `Medusa Background Jobs`

#### 3.2 Upload the compose file

1. Click **Upload** and select `docker-compose.worker.yml`
2. OR paste its contents

#### 3.3 Set environment variables

Click **Environment Variables** and add these **exact values**:

```bash
# ---- Database Connection ----
DATABASE_URL=postgresql://medusa:YourStrongPassword123!@medusa-infra-postgres:5432/medusa_store

# ---- Redis Connection ----
REDIS_URL=redis://medusa-infra-redis:6379

# ---- Meilisearch Connection ----
MEILISEARCH_HOST=http://medusa-infra-meilisearch:7700
MEILISEARCH_ADMIN_KEY=YourMeilisearchMasterKey123!

# ---- Security Secrets (SAME as server!) ----
JWT_SECRET=generate-a-random-32-char-string
COOKIE_SECRET=generate-another-random-32-char-string

# ---- Worker Mode ----
MEDUSA_WORKER_MODE=worker
MEDUSA_DISABLE_ADMIN=true

# ---- Node Environment ----
NODE_ENV=production
```

> ⚠️ **Critical requirements**:
> - `JWT_SECRET` and `COOKIE_SECRET` must be **the SAME values** as the server (Step 2.3)
> - `DATABASE_URL`, `REDIS_URL`, `MEILISEARCH_HOST` must use the **same hostnames** as the server
> - `MEDUSA_WORKER_MODE=worker` (NOT `server`)
> - `MEDUSA_DISABLE_ADMIN=true` (worker doesn't need admin)

#### 3.4 Deploy

1. Click **Deploy**
2. Wait 5-10 minutes
3. Go to **Logs** — you should see:
   ```
   Medusa Worker Starting
   Waiting for PostgreSQL... PostgreSQL is ready!
   Waiting for Redis... Redis is ready!
   Starting Medusa worker...
   ```

---

### Step 4: Deploy Next.js Storefront

Deploy the storefront AFTER server is running.

#### 4.1 Create the service

1. Go to **Docker Compose** → **Create Service**
2. Fill in:
   - **Service Name**: `medusa-storefront`
   - **Description**: `Next.js Storefront`

#### 4.2 Upload the compose file

1. Click **Upload** and select `docker-compose.storefront.yml`
2. OR paste its contents

#### 4.3 Set environment variables

Click **Environment Variables** and add:

```bash
# ---- Backend URL (your server's public API address) ----
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
```

> ⚠️ **Important**:
> - This must be the **public URL** of your Medusa server (with `https://` if SSL is enabled)
> - This is a **build-time variable** — Next.js inlines it during build. Changing it requires a rebuild/redeploy.

#### 4.4 Deploy

1. Click **Deploy**
2. Wait 5-8 minutes
3. Go to **Logs** — you should see `Ready in Xs`

#### 4.5 Configure storefront domain

1. Go to **Domains** tab
2. Add domain:
   - **Domain**: `yourdomain.com`
   - **Port**: `3000`
   - **HTTPS**: ✅ Enable
3. Visit `https://yourdomain.com` — should show your storefront

---

### Step 5: Create Admin User

After server is running, create an admin user:

1. SSH into your Oracle Cloud server
2. Find the server container:
   ```bash
   docker ps | grep medusa-server
   ```
3. Create admin user:
   ```bash
   docker exec -it <server-container-id> \
     pnpm medusa user --email admin@yourdomain.com --password Admin123!
   ```
4. Login at `https://admin.yourdomain.com` with these credentials

---

### Step 6: Configure SSL & DNS

#### DNS Records

Set up DNS on your domain registrar:
```
Type  Name              Value
A     api               YOUR_SERVER_IP
A     @                 YOUR_SERVER_IP
```

#### SSL Certificates

In Dokploy, go to each service → Domains:

1. **Server** (`api.yourdomain.com`):
   - Port: 9000
   - ✅ Enable HTTPS (Let's Encrypt)
   - ✅ Enable "Skip DNS Check" if using Cloudflare

2. **Storefront** (`yourdomain.com`):
   - Port: 3000
   - ✅ Enable HTTPS

After SSL is active, **update these environment variables** on the server service:
```
BACKEND_URL=https://api.yourdomain.com
STORE_CORS=https://yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://yourdomain.com,https://admin.yourdomain.com
```

And on the storefront service:
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
```

Then **redeploy** both services.

---

## Alternative: Monorepo Deploy (All-in-One)

Single deploy for all 6 services. Simpler but slower.

### Setup

1. Go to **Docker Compose** → **Create Service**
2. **Service Name**: `medusa-multivendor`
3. Upload `docker-compose.yml`
4. Set environment variables (same as individual, but all in one service)
5. Click **Deploy**
6. Wait 15-25 minutes

### Monorepo Environment Variables

```bash
# ---- PostgreSQL ----
POSTGRES_USER=medusa
POSTGRES_PASSWORD=YourStrongPassword123!
POSTGRES_DB=medusa_store

# ---- Meilisearch ----
MEILISEARCH_ADMIN_KEY=YourMeilisearchMasterKey123!

# ---- Security ----
JWT_SECRET=your-32-char-random-string-here
COOKIE_SECRET=your-32-char-random-string-here

# ---- Domains ----
BACKEND_URL=https://api.yourdomain.com
STORE_CORS=https://yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://yourdomain.com,https://admin.yourdomain.com

# ---- Storefront Build ----
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com

# ---- Ports ----
STOREFRONT_PORT=8000
MEDUSA_PORT=9000
```

---

## Build Optimization

### How Docker Caching Works

The Dockerfiles use a **3-phase build** pattern:

```
Phase 1 (deps)     → Install ~800 packages (cached by BuildKit)
Phase 2 (builder)  → Compile TypeScript + medusa build
Phase 3 (runner)   → Minimal production image
```

**Docker BuildKit cache mounts** persist the pnpm store across builds:
- First build: **10-15 minutes** (downloading all packages)
- Subsequent builds: **30-60 seconds** (cache hit, packages already on disk)
- After code changes: **3-5 minutes** (skip phase 1, rebuild phases 2-3)

### Build Times

| Service | First Build | Cached Build | After Code Change |
|---------|------------|-------------|-------------------|
| Infrastructure | 1-2 min | 10-30s | N/A (no build) |
| Server | 10-15 min | 30-60s | 3-5 min |
| Worker | 10-15 min | 30-60s | 3-5 min |
| Storefront | 5-8 min | 30-60s | 2-3 min |

---

## Environment Variables — Complete Reference

### PostgreSQL (Infrastructure)
| Variable | Value | Notes |
|----------|-------|-------|
| `POSTGRES_USER` | `medusa` | Database username |
| `POSTGRES_PASSWORD` | `YourStrongPassword123!` | Change this! |
| `POSTGRES_DB` | `medusa_store` | Database name |

### Meilisearch (Infrastructure)
| Variable | Value | Notes |
|----------|-------|-------|
| `MEILISEARCH_ADMIN_KEY` | `YourMeilisearchMasterKey123!` | Same key used in server/worker |

### Medusa Server & Worker
| Variable | Server Value | Worker Value | Notes |
|----------|-------------|-------------|-------|
| `DATABASE_URL` | `postgresql://medusa:pass@host:5432/medusa_store` | Same | Must match |
| `REDIS_URL` | `redis://host:6379` | Same | Must match |
| `MEILISEARCH_HOST` | `http://host:7700` | Same | Must match |
| `MEILISEARCH_ADMIN_KEY` | `your-key` | Same | Must match infra |
| `JWT_SECRET` | `random-32-chars` | Same | **Must match server!** |
| `COOKIE_SECRET` | `random-32-chars` | Same | **Must match server!** |
| `MEDUSA_WORKER_MODE` | `server` | `worker` | Different per service |
| `MEDUSA_DISABLE_ADMIN` | `false` | `true` | Worker doesn't need admin |
| `BACKEND_URL` | `https://api.yourdomain.com` | — | Server only |
| `STORE_CORS` | `https://yourdomain.com` | — | Server only |
| `ADMIN_CORS` | `https://admin.yourdomain.com` | — | Server only |
| `AUTH_CORS` | `https://yourdomain.com,...` | — | Server only |
| `NODE_ENV` | `production` | `production` | Always production |

### Next.js Storefront
| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://api.yourdomain.com` | Build-time! Must rebuild to change |

---

## Troubleshooting

### Server Fails to Start
**Symptoms**: Container exits immediately or shows "database not ready"
**Fix**: Check infrastructure is running and hostnames are correct.

### Build Fails with 429 Rate Limit
**Symptoms**: `ERR_PNPM_FETCH_429` or `Too Many Requests`
**Fix**: Wait 10-60 min, deploy one service at a time.

### ts-node Not Found
**Symptoms**: "Cannot find module ts-node"
**Fix**: Redeploy — the Dockerfile handles this.

### Health Check Fails
**Symptoms**: "health check failed" in Dokploy
**Fix**: First deploy takes 10-15 min. Wait and check logs.

### Worker Crashes Repeatedly
**Symptoms**: Worker container keeps restarting
**Fix**: Ensure JWT_SECRET, COOKIE_SECRET match server. Check DATABASE_URL hostname.

### Storefront Blank/Error
**Symptoms**: Storefront loads but shows nothing
**Fix**: Verify NEXT_PUBLIC_MEDUSA_BACKEND_URL is correct and server is accessible.

---

## Updating Services

### Individual Services
1. Push changes to GitHub
2. In Dokploy, click **Deploy** on the specific service
3. Docker cache makes rebuild fast (30-60s)

### Monorepo
1. Push changes to GitHub
2. Click **Deploy** — all services restart

---

## File Structure

```
├── apps/
│   ├── backend/
│   │   ├── Dockerfile              # Monorepo Docker build
│   │   ├── Dockerfile.server       # Server Docker build
│   │   ├── Dockerfile.worker       # Worker Docker build
│   │   ├── package.json
│   │   ├── medusa-config.ts
│   │   └── src/scripts/
│   │       ├── start-server.sh
│   │       ├── start-worker.sh
│   │       ├── start-monorepo.sh
│   │       └── post-build.js
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
├── DOKPLOY-DEPLOYMENT.md
└── README.md
```
