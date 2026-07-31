# Dokploy Deployment Guide — Medusa 2.0 Multi-Vendor Store

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dokploy (Ubuntu/Oracle Cloud)              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐             │
│  │ Postgres │  │  Redis   │  │ Meilisearch  │             │
│  │  :5432   │  │  :6379   │  │    :7700     │             │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘             │
│       │              │               │                       │
│  ┌────┴──────────────┴───────────────┴───────┐             │
│  │         Medusa Server (:9000)              │             │
│  │  - API routes    - Admin dashboard         │             │
│  │  - Scheduled jobs - WORKER_MODE=server     │             │
│  └────────────────────┬───────────────────────┘             │
│                       │                                      │
│  ┌────────────────────┴───────────────────────┐             │
│  │         Medusa Worker (no port)             │             │
│  │  - Background jobs    - Event processing    │             │
│  │  - WORKER_MODE=worker                       │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │       Next.js Storefront (:8000)            │             │
│  │  - Product browsing   - Cart & checkout     │             │
│  │  - Customer accounts                        │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Push to GitHub

```bash
git add -A
git commit -m "Deploy to Dokploy"
git push origin main
```

### 2. Create Docker Compose Service in Dokploy

1. Go to **Dokploy Dashboard** → **Projects** → Create/Select Project
2. Click **Create Service** → **Docker Compose**
3. Set:
   - **Service Name**: `medusa-store`
   - **Git Repository**: `https://github.com/tolakang/medusa-multivendor-store.git`
   - **Branch**: `main`
   - **Build Context**: `./`
   - **Compose File**: `./docker-compose.yml`

### 3. Configure Environment Variables

Set these in the Dokploy service **Environment** tab:

```env
# Database
POSTGRES_USER=medusa
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_DB=medusa_store

# Redis
REDIS_URL=redis://redis:6379

# Meilisearch
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_ADMIN_KEY=your_meilisearch_master_key

# Medusa Server
JWT_SECRET=your_random_32_char_string
COOKIE_SECRET=another_random_32_char_string
BACKEND_URL=https://your-backend-domain.com
MEDUSA_WORKER_MODE=server
MEDUSA_DISABLE_ADMIN=false

# CORS (set to your actual domains)
STORE_CORS=https://your-storefront-domain.com
ADMIN_CORS=https://your-admin-domain.com
AUTH_CORS=https://your-storefront-domain.com,https://your-admin-domain.com
```

### 4. Configure Domains

In Dokploy, go to **Domains** tab and add:

| Service | Domain | Port | Internal Port |
|---------|--------|------|---------------|
| medusa-server | your-admin-domain.com | 443/80 | 9000 |
| medusa-storefront | your-storefront-domain.com | 443/80 | 3000 |

### 5. Deploy

Click **Deploy** in Dokploy.

### 6. Create Admin User

After deployment, run in Dokploy terminal:

```bash
docker compose exec medusa-server npx medusa user -e admin@yourdomain.com -p password
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `medusa` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `strong_password` |
| `POSTGRES_DB` | PostgreSQL database name | `medusa_store` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` |
| `MEILISEARCH_HOST` | Meilisearch URL | `http://meilisearch:7700` |
| `MEILISEARCH_ADMIN_KEY` | Meilisearch master key | `your_master_key` |
| `JWT_SECRET` | JWT token secret | `random_32_chars` |
| `COOKIE_SECRET` | Cookie signing secret | `random_32_chars` |
| `BACKEND_URL` | Backend public URL | `https://admin.example.com` |
| `MEDUSA_WORKER_MODE` | `server`, `worker`, or `shared` | `server` |
| `MEDUSA_DISABLE_ADMIN` | `true` to disable admin | `false` |
| `STORE_CORS` | Storefront origin | `https://store.example.com` |
| `ADMIN_CORS` | Admin dashboard origin | `https://admin.example.com` |
| `AUTH_CORS` | Auth endpoints origin | Both domains comma-separated |

## CORS Configuration

When you have custom domains, update CORS to match:

```env
STORE_CORS=https://your-storefront.com
ADMIN_CORS=https://your-admin.com
AUTH_CORS=https://your-storefront.com,https://your-admin.com
```

## Troubleshooting

### Build Fails with node_modules Error

```bash
# Clear Docker build cache in Dokploy
docker builder prune -af
```

### Services Won't Start

```bash
# Check logs
docker compose logs medusa-server
docker compose logs medusa-worker
```

### Database Connection Issues

Ensure PostgreSQL is healthy before server starts:
```bash
docker compose ps postgres
```

### Meilisearch Connection Issues

Check Meilisearch health:
```bash
docker compose exec meilisearch wget -qO- http://localhost:7700/health
```

## Production Checklist

- [ ] Set strong `JWT_SECRET` and `COOKIE_SECRET`
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Set strong `MEILISEARCH_ADMIN_KEY`
- [ ] Configure CORS with actual domains
- [ ] Set `BACKEND_URL` to your backend domain
- [ ] Create admin user after first deploy
- [ ] Test storefront ↔ server connectivity
- [ ] Verify Meilisearch indexing works
