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
   - **Service Name**: `medusainfra`
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
# ⚠️ IMPORTANT: Do NOT run docker ps inside a container!
# Docker is NOT installed inside containers.
# Use the Dokploy Docker Terminal instead (see below).
```

---

### Step 2: Find Service Hostnames (CRITICAL)

After infrastructure is deployed, you need the **exact hostnames** for PostgreSQL, Redis, and Meilisearch.

#### Method 1: Docker Terminal (Recommended)

1. Go to **Dokploy** → **Docker** → **Containers**
2. You'll see containers like:
   ```
   medusa-js-medusainfra-ubpc7h-postgres-1
   medusa-js-medusainfra-ubpc7h-redis-1
   medusa-js-medusainfra-ubpc7h-meilisearch-1
   ```
3. Click on **postgres** container → **Docker Terminal**
4. Run these commands to find the hostname:

```bash
# Find this container's hostname
hostname

# Find all hostnames this container can reach
cat /etc/hosts
```

5. The hostname you need is usually the **service name** from the compose file:
   - `postgres` (from docker-compose.infra.yml)
   - `redis` (from docker-compose.infra.yml)
   - `meilisearch` (from docker-compose.infra.yml)

6. **Test connectivity** from the postgres container:

```bash
# Test if redis is reachable
ping redis

# Test if meilisearch is reachable
ping meilisearch
```

7. If `ping` isn't available, use `cat /etc/hosts` to see all resolvable names.

#### Method 2: Check Docker Networks

1. In Dokploy, go to **Docker** → **Networks**
2. Find the network for your infrastructure service
3. Click on it to see all connected containers and their IPs

#### Method 3: Use the Actual Container Name

If service names don't work, try the full container name:
```
medusa-js-medusainfra-ubpc7h-postgres-1
```

**Write down the correct hostnames** — you'll need them for the server and worker.

---

### Step 3: Deploy Medusa Server

1. **Dokploy** → **Create Service** → **Docker Compose**
2. Fill in:
   - **Service Name**: `medusaserver`
   - **Compose File**: `docker-compose.server.yml`
   - **Build Context**: `./`
3. **Environment** tab — set ALL of these:

```env
# ─── Database ───
POSTGRES_USER=medusa
POSTGRES_PASSWORD=CHANGE_ME_strong_password
POSTGRES_DB=medusa_store

# ─── Host Discovery (use hostnames from Step 2) ───
POSTGRES_HOST=postgres
REDIS_HOST=redis
MEILISEARCH_HOST=meilisearch

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

### Step 4: Deploy Medusa Worker

1. **Dokploy** → **Create Service** → **Docker Compose**
2. Fill in:
   - **Service Name**: `medusaworker`
   - **Compose File**: `docker-compose.worker.yml`
3. **Environment** tab — set (same DB/Redis/Meilisearch as server):

```env
# ─── Database ───
POSTGRES_USER=medusa
POSTGRES_PASSWORD=CHANGE_ME_strong_password
POSTGRES_DB=medusa_store

# ─── Host Discovery (same as server) ───
POSTGRES_HOST=postgres
REDIS_HOST=redis
MEILISEARCH_HOST=meilisearch

# ─── Medusa ───
JWT_SECRET=CHANGE_ME_random_32_char_string_here
COOKIE_SECRET=CHANGE_ME_another_random_32_chars
MEDUSA_WORKER_MODE=worker
MEDUSA_DISABLE_ADMIN=true
```

4. Click **Deploy**

---

### Step 5: Deploy Storefront

1. **Dokploy** → **Create Service** → **Docker Compose**
2. Fill in:
   - **Service Name**: `medusastorefront`
   - **Compose File**: `docker-compose.storefront.yml`
3. **Environment** tab:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-admin-domain.com
NEXT_PUBLIC_BASE_URL=https://your-storefront-domain.com
STORE_NAME=Medusa Multi-Vendor Store
```

4. Click **Deploy**

---

### Step 6: Configure Domains

In Dokploy → each service → **Domains** tab:

| Service | Domain | Port | Internal Port |
|---------|--------|------|---------------|
| server | `admin.example.com` | 443 | 9000 |
| storefront | `store.example.com` | 443 | 3000 |

**Enable SSL:** Toggle **SSL** → **Let's Encrypt** for each domain.

---

### Step 7: Create Admin User

In Dokploy → Docker Terminal → select the **server** container:

```bash
npx medusa user -e admin@example.com -p password
```

---

## 🔍 Finding Service Hostnames — Detailed Guide

### Why `docker ps` Doesn't Work

The Docker Terminal in Dokploy connects you **inside a container**. Containers are isolated — they don't have Docker installed. So commands like `docker ps`, `docker inspect`, etc. won't work.

### What to Run Instead

Inside any container, run:

```bash
# 1. Find this container's hostname
hostname
# Output: something like "87adfb3fc351" or "postgres"

# 2. Find all hostnames this container can reach
cat /etc/hosts
# Output shows all resolvable hostnames and IPs

# 3. Test if another service is reachable
ping redis
ping meilisearch
ping postgres

# 4. If ping isn't available, test the port directly
# (from inside the postgres container)
nc -zv redis 6379
nc -zv meilisearch 7700
```

### Dokploy Hostname Patterns

Dokploy uses Docker Compose internally. Service names follow these patterns:

| Your Compose Service Name | Likely Hostname |
|---------------------------|-----------------|
| `postgres` | `postgres` |
| `redis` | `redis` |
| `meilisearch` | `meilisearch` |
| `medusainfra-postgres` | `medusainfra-postgres` |
| `medusainfra-redis` | `medusainfra-redis` |

**Always verify with `cat /etc/hosts` and `ping` before deploying!**

---

## ⚠️ Common Issues & Fixes

### 1. "Host not found" / Connection Refused

**Cause:** Wrong hostname for PostgreSQL/Redis/Meilisearch.

**Fix:**
```bash
# Inside the server container, test:
ping postgres
ping redis
ping meilisearch

# If ping fails, try the full container name:
ping medusa-js-medusainfra-ubpc7h-postgres-1
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

**Fix:** Ensure infrastructure is healthy BEFORE deploying server. Check in Dokploy Docker Terminal:
```bash
# Inside postgres container
pg_isready -U medusa
# Should show "accepting connections"
```

### 4. Worker Can't Process Jobs

**Cause:** Worker and server have different `JWT_SECRET` or `COOKIE_SECRET`.

**Fix:** Ensure worker and server use the EXACT same values for:
- `JWT_SECRET`
- `COOKIE_SECRET`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `POSTGRES_HOST`, `REDIS_HOST`, `MEILISEARCH_HOST`

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

### 7. Log Tail Error (Cannot Open .log File)

**Cause:** Dokploy platform bug — colon in timestamp creates invalid file path.

**Impact:** None — this is a display issue only. Your deployment is working fine.

**Workaround:** Ignore the error. Check service health via the Containers tab.

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

---

## 📋 Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `POSTGRES_USER` | PostgreSQL username | `medusa` | ✅ |
| `POSTGRES_PASSWORD` | PostgreSQL password | `strong_password` | ✅ |
| `POSTGRES_DB` | Database name | `medusa_store` | ✅ |
| `POSTGRES_HOST` | PostgreSQL hostname | `postgres` | ✅ |
| `POSTGRES_PORT` | PostgreSQL port | `5432` | Optional |
| `REDIS_HOST` | Redis hostname | `redis` | ✅ |
| `REDIS_PORT` | Redis port | `6379` | Optional |
| `MEILISEARCH_HOST` | Meilisearch hostname | `meilisearch` | ✅ |
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
