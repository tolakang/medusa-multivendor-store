# Dokploy Deployment Guide — Medusa 2.0 Multi-Vendor Store

## Two Deployment Options

### Option A: Individual Services (Recommended for Dokploy)
Deploy each service separately for faster builds and independent updates.

### Option B: Monorepo (All-in-One)
Deploy everything in a single Docker Compose. Slower but simpler.

---

## ⚡ Quick Reference — File Paths for Dokploy

| Service | Compose File | Build Context | Dockerfile |
|---------|-------------|---------------|------------|
| Infrastructure | `docker-compose.infra.yml` | `./` | Pre-built images |
| Server | `docker-compose.server.yml` | `./` | `./apps/backend/Dockerfile.server` |
| Worker | `docker-compose.worker.yml` | `./` | `./apps/backend/Dockerfile.worker` |
| Storefront | `docker-compose.storefront.yml` | `./` | `./apps/storefront/Dockerfile` |
| All-in-One | `docker-compose.yml` | `./` | `./apps/backend/Dockerfile` |

---

## Option A: Individual Services (Recommended)

### Deployment Order

```
1. Infrastructure (PostgreSQL, Redis, Meilisearch)
         ↓ wait for healthy
2. Medusa Server (API + Admin)
         ↓ wait for healthy
3. Medusa Worker (Background Jobs)
4. Storefront (Next.js)  ← can deploy in parallel with worker
```

---

### Step 1: Deploy Infrastructure

1. **Dokploy** → **Projects** → Select/Create Project
2. Click **Create Service** → **Docker Compose**
3. Fill in:
   - **Service Name**: `infra` (or `medusa-infra`)
   - **Git Repository**: `https://github.com/tolakang/medusa-multivendor-store.git`
   - **Branch**: `main`
   - **Build Context**: `./`
   - **Compose File**: `docker-compose.infra.yml`
4. Go to **Environment** tab and set:

```env
POSTGRES_USER=medusa
POSTGRES_PASSWORD=CHANGE_ME_strong_password
POSTGRES_DB=medusa_store
MEILISEARCH_ADMIN_KEY=CHANGE_ME_master_key
```

5. Click **Deploy**
6. ⏳ Wait for all 3 services to show healthy in **Docker** → **Containers**

**Verify infrastructure is ready:**
```bash
# In Dokploy terminal
docker ps | grep -E "postgres|redis|meilisearch"
```

---

### Step 2: Deploy Medusa Server

1. **Dokploy** → **Create Service** → **Docker Compose**
2. Fill in:
   - **Service Name**: `server` (or `medusa-server`)
   - **Compose File**: `docker-compose.server.yml`
   - **Build Context**: `./`
3. **Environment** tab — set ALL of these:

```env
# ─── Database ───
POSTGRES_USER=medusa
POSTGRES_PASSWORD=CHANGE_ME_strong_password
POSTGRES_DB=medusa_store

# ─── Host Discovery (CRITICAL - see below) ───
POSTGRES_HOST=infra-postgres
REDIS_HOST=infra-redis
MEILISEARCH_HOST=infra-meilisearch

# ─── Medusa ───
JWT_SECRET=CHANGE_ME_random_32_char_string_here
COOKIE_SECRET=CHANGE_ME_another_random_32_chars
BACKEND_URL=https://your-admin-domain.com
MEDUSA_WORKER_MODE=server
MEDUSA_DISABLE_ADMIN=false

# ─── CORS (set to your actual domains) ───
STORE_CORS=https://your-storefront-domain.com
ADMIN_CORS=https://your-admin-domain.com
AUTH_CORS=https://your-storefront-domain.com,https://your-admin-domain.com
```

4. Click **Deploy**
5. ⏳ Wait for health check to pass (~90 seconds)

---

### Step 3: Deploy Medusa Worker

1. **Dokploy** → **Create Service** → **Docker Compose**
2. Fill in:
   - **Service Name**: `worker` (or `medusa-worker`)
   - **Compose File**: `docker-compose.worker.yml`
3. **Environment** tab — set (same DB/Redis/Meilisearch as server):

```env
# ─── Database ───
POSTGRES_USER=medusa
POSTGRES_PASSWORD=CHANGE_ME_strong_password
POSTGRES_DB=medusa_store

# ─── Host Discovery ───
POSTGRES_HOST=infra-postgres
REDIS_HOST=infra-redis
MEILISEARCH_HOST=infra-meilisearch

# ─── Medusa ───
JWT_SECRET=CHANGE_ME_random_32_char_string_here
COOKIE_SECRET=CHANGE_ME_another_random_32_chars
MEDUSA_WORKER_MODE=worker
MEDUSA_DISABLE_ADMIN=true
```

4. Click **Deploy**

---

### Step 4: Deploy Storefront

1. **Dokploy** → **Create Service** → **Docker Compose**
2. Fill in:
   - **Service Name**: `storefront` (or `medusa-storefront`)
   - **Compose File**: `docker-compose.storefront.yml`
3. **Environment** tab:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-admin-domain.com
NEXT_PUBLIC_BASE_URL=https://your-storefront-domain.com
STORE_NAME=Medusa Multi-Vendor Store
```

4. Click **Deploy**

---

### Step 5: Configure Domains

In Dokploy → each service → **Domains** tab:

| Service | Domain | Port | Internal Port |
|---------|--------|------|---------------|
| server | `admin.example.com` | 443 | 9000 |
| storefront | `store.example.com` | 443 | 3000 |

**Enable SSL:** Toggle **SSL** → **Let's Encrypt** for each domain.

---

### Step 6: Create Admin User

In Dokploy terminal:
```bash
# Find the server container name
docker ps | grep server

# Create admin user (replace container name)
docker exec -it <server-container-name> npx medusa user -e admin@example.com -p password
```

---

## 🔍 Finding Service Hostnames (CRITICAL)

When using individual services, you need the **exact Docker hostnames**. Here's how to find them:

### Method 1: Docker Networks (Recommended)

```bash
# List all networks
docker network ls

# Find your project network (usually named after your Dokploy project)
docker network inspect <network-name> | grep -A5 "Name"

# Or list all containers with their IPs
docker ps --format "{{.Names}}\t{{.Networks}}"
```

### Method 2: Docker Compose Service Discovery

In Dokploy, service names in the same project are accessible as:
- `{service-name}-{component}` (most common)
- `{project}-{service}-{component}` (if project prefix is used)

**Examples:**
| If your service name is... | PostgreSQL host | Redis host | Meilisearch host |
|---------------------------|-----------------|------------|------------------|
| `infra` | `infra-postgres` | `infra-redis` | `infra-meilisearch` |
| `medusa-infra` | `medusa-infra-postgres` | `medusa-infra-redis` | `medusa-infra-meilisearch` |

### Method 3: Check Running Containers

```bash
# List all running containers with their hostnames
docker inspect --format '{{.Name}} -> {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q)
```

### Method 4: Test Connectivity

```bash
# From inside a running container, test if host is reachable
docker exec -it <server-container> sh -c "ping infra-postgres"
docker exec -it <server-container> sh -c "nc -zv infra-postgres 5432"
```

---

## ⚠️ Common Issues & Fixes

### 1. "Host not found" / Connection Refused

**Cause:** Wrong hostname for PostgreSQL/Redis/Meilisearch.

**Fix:**
```bash
# Find actual container names
docker ps --format "{{.Names}}"

# Test connection from server container
docker exec -it <server-container> sh -c "ping <actual-redis-hostname>"
```

Then update the environment variables with correct hostnames.

### 2. Build Fails with node_modules Error

**Fix:** Clear Docker build cache:
```bash
docker builder prune -af
```
Then redeploy.

### 3. Server Starts but Health Check Fails

**Cause:** Server might be waiting for database to be ready.

**Fix:** Ensure infrastructure is healthy BEFORE deploying server. Check:
```bash
docker ps | grep postgres
# Should show "(healthy)" not "(starting)"
```

### 4. Worker Can't Process Jobs

**Cause:** Worker and server have different `JWT_SECRET` or `COOKIE_SECRET`.

**Fix:** Ensure worker and server use the EXACT same values for:
- `JWT_SECRET`
- `COOKIE_SECRET`
- `DATABASE_URL` (same PostgreSQL)

### 5. Storefront Shows "Connection Refused"

**Cause:** `NEXT_PUBLIC_MEDUSA_BACKEND_URL` points to wrong host.

**Fix:** This should be your PUBLIC backend URL (with SSL), not the internal Docker hostname:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://admin.example.com
```

### 6. CORS Errors in Browser

**Cause:** CORS variables don't match your actual domains.

**Fix:** Set CORS to your actual domain URLs:
```env
STORE_CORS=https://store.example.com
ADMIN_CORS=https://admin.example.com
AUTH_CORS=https://store.example.com,https://admin.example.com
```

---

## 🔐 SSL / HTTPS Setup

### In Dokploy:

1. Go to service → **Domains** tab
2. Add domain with your domain name
3. Toggle **SSL** → **Let's Encrypt**
4. Wait for certificate to be issued

### Update Environment Variables:

After SSL is set up, update these to use `https://`:
```env
BACKEND_URL=https://admin.example.com
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://admin.example.com
STORE_CORS=https://store.example.com
ADMIN_CORS=https://admin.example.com
AUTH_CORS=https://store.example.com,https://admin.example.com
```

### DNS Configuration:

Point your domains to your Dokploy server:
```
admin.example.com  → YOUR_SERVER_IP
store.example.com  → YOUR_SERVER_IP
```

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dokploy (Ubuntu/Oracle Cloud)              │
│                                                              │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐           │
│  │   infra-     │ │  infra-  │ │   infra-     │           │
│  │   postgres   │ │  redis   │ │  meilisearch │           │
│  │   :5432      │ │  :6379   │ │   :7700      │           │
│  └──────┬───────┘ └────┬─────┘ └──────┬───────┘           │
│         │               │              │                     │
│  ┌──────┴───────────────┴──────────────┴───────┐           │
│  │              server (:9000)                   │           │
│  │  MEDUSA_WORKER_MODE=server                   │           │
│  │  MEDUSA_DISABLE_ADMIN=false                  │           │
│  └──────────────────────┬───────────────────────┘           │
│                         │                                    │
│  ┌──────────────────────┴───────────────────────┐           │
│  │              worker (no port)                  │           │
│  │  MEDUSA_WORKER_MODE=worker                   │           │
│  │  MEDUSA_DISABLE_ADMIN=true                   │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │         storefront (:8000 → :3000)          │             │
│  │  NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://... │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `POSTGRES_USER` | PostgreSQL username | `medusa` | ✅ |
| `POSTGRES_PASSWORD` | PostgreSQL password | `strong_password` | ✅ |
| `POSTGRES_DB` | Database name | `medusa_store` | ✅ |
| `POSTGRES_HOST` | PostgreSQL hostname | `infra-postgres` | ✅ |
| `POSTGRES_PORT` | PostgreSQL port | `5432` | Optional |
| `REDIS_HOST` | Redis hostname | `infra-redis` | ✅ |
| `REDIS_PORT` | Redis port | `6379` | Optional |
| `MEILISEARCH_HOST` | Meilisearch hostname | `infra-meilisearch` | ✅ |
| `MEILISEARCH_PORT` | Meilisearch port | `7700` | Optional |
| `MEILISEARCH_ADMIN_KEY` | Meilisearch master key | `your_master_key` | ✅ |
| `JWT_SECRET` | JWT token secret (32+ chars) | `random_string` | ✅ |
| `COOKIE_SECRET` | Cookie signing secret | `random_string` | ✅ |
| `BACKEND_URL` | Backend public URL | `https://admin.example.com` | ✅ |
| `MEDUSA_WORKER_MODE` | `server` / `worker` / `shared` | `server` | ✅ |
| `MEDUSA_DISABLE_ADMIN` | `true` to disable admin UI | `false` | ✅ |
| `STORE_CORS` | Storefront origin URL | `https://store.example.com` | ✅ |
| `ADMIN_CORS` | Admin dashboard origin | `https://admin.example.com` | ✅ |
| `AUTH_CORS` | Auth endpoints origin | Both domains comma-separated | ✅ |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Backend URL for storefront | `https://admin.example.com` | ✅ |
| `NEXT_PUBLIC_BASE_URL` | Storefront public URL | `https://store.example.com` | ✅ |

---

## Option B: Monorepo (All-in-One)

1. **Dokploy** → **Create Service** → **Docker Compose**
2. Service Name: `medusa-store`
3. Compose File: `docker-compose.yml`
4. Build Context: `./`
5. Set all environment variables (see `.env.example`)
6. **Deploy**

---

## 🔄 Redeployment

### Individual Service (Fast)
```bash
# Only rebuild the service you changed
# In Dokploy: click service → Deploy
```

### Full Rebuild (Slow)
```bash
# In Dokploy terminal
docker builder prune -af
# Then redeploy all services
```

---

## 📝 Post-Deployment Checklist

- [ ] All infrastructure services are healthy
- [ ] Server health check passes (`http://localhost:9000/health`)
- [ ] Worker is running (check logs for job processing)
- [ ] Storefront loads in browser
- [ ] Admin dashboard accessible at `https://admin.example.com`
- [ ] Create admin user via CLI
- [ ] CORS errors resolved
- [ ] SSL certificates issued
- [ ] Meilisearch indexing works (search products)
