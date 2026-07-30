# Dokploy Deployment Guide

This guide walks you through deploying the Medusa 2.0 Multi-Vendor Store on Dokploy.

## Architecture Overview

**Single Docker Compose Deployment** — All 6 services run together in ONE Dokploy application:

```
┌─────────────────────────────────────────────────────────┐
│  Dokploy Application (medusa-multivendor)               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  postgres (port 5432)                             │  │
│  │  redis (port 6379)                                │  │
│  │  meilisearch (port 7700)                          │  │
│  │  medusa-server (port 9000)                        │  │
│  │  medusa-worker (no exposed port)                  │  │
│  │  medusa-storefront (port 8080)                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

> **Important**: You do NOT need to create separate Dokploy applications for each service. One Docker Compose deployment handles all services with automatic dependency ordering and health checks.

## Step 1: Prepare Your Repository

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Medusa 2.0 multi-vendor store"
   git remote add origin https://github.com/your-username/medusa-multivendor-store.git
   git push -u origin main
   ```

## Step 2: Create Dokploy Application

1. Log into your Dokploy dashboard
2. Click **"Create New"** → **"Docker Compose"**
3. Enter a name for your application (e.g., `medusa-multivendor`)
4. Connect your GitHub repository

## Step 3: Configure the Docker Compose

In the Dokploy Docker Compose editor, paste the contents of your `docker-compose.yml` file.

## Step 4: Set Environment Variables

Go to the **Environment** tab and add the following variables:

### Database
```
POSTGRES_USER=medusa
POSTGRES_DB=medusa-store
POSTGRES_PASSWORD=your-secure-password-here
```

### Medusa Backend
```
JWT_SECRET=your-super-secret-jwt-key-change-this
COOKIE_SECRET=your-super-secret-cookie-key-change-this
DISABLE_MEDUSA_ADMIN=false
```

### CORS (update with your actual domains)

The CORS variables control which domains can access your Medusa API. Use your actual domain names in production.

**Example with subdomains:**
```
STORE_CORS=https://store.yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://store.yourdomain.com,https://admin.yourdomain.com
```

**Example with single domain:**
```
STORE_CORS=https://yourdomain.com
ADMIN_CORS=https://yourdomain.com
AUTH_CORS=https://yourdomain.com
```

**Important notes:**
- Always use `https://` in production
- Separate multiple origins with commas (no spaces)
- No trailing slashes

### Meilisearch
```
MEILISEARCH_MASTER_KEY=your-meilisearch-master-key-change-this
```

### Storefront
```
MEDUSA_PUBLISHABLE_KEY=pk_your-publishable-key
```

## Step 5: Configure Domains

1. Go to the **Domains** tab
2. Add your domains:
   - **Medusa Server**: `api.yourdomain.com` (port 9000)
   - **Storefront**: `store.yourdomain.com` (port 3000)
   - **Meilisearch**: `search.yourdomain.com` (port 7700, optional)

## Step 6: Deploy

1. Click **"Deploy"** button
2. Monitor the deployment logs
3. Wait for all services to be healthy

## Step 7: Post-Deployment

### Create Admin User

Access your Medusa server container and run:

```bash
medusa user -e admin@yourdomain.com -p your-secure-password
```

### Access Services

- **Admin Dashboard**: `https://admin.yourdomain.com/app`
- **Storefront**: `https://store.yourdomain.com`
- **API**: `https://api.yourdomain.com`
- **Meilisearch Dashboard**: `https://search.yourdomain.com` (if exposed)

### Set Up Vendors

1. Log into the Medusa Admin dashboard
2. Go to **Settings** → **Sales Channels**
3. Create a Sales Channel for each vendor
4. Add products and assign them to vendor-specific Sales Channels

## Updating

To update your deployment:

1. Push changes to your GitHub repository
2. Dokploy will automatically deploy (if auto-deploy is enabled)
3. Or manually trigger a deployment from the Dokploy dashboard

## Troubleshooting

### Services Not Starting
- Check logs in Dokploy's Logs tab
- Verify all environment variables are set correctly
- Ensure PostgreSQL and Redis are healthy

### CORS Errors
- Update `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS` with your actual domain URLs
- Separate multiple origins with commas

### Database Connection Issues
- Verify `POSTGRES_PASSWORD` matches across all services
- Check that PostgreSQL is running and accessible

### Meilisearch Issues
- Ensure `MEILISEARCH_MASTER_KEY` is set
- Check Meilisearch logs for connection errors

## Scaling

For production workloads, consider:

1. **Multiple Workers**: Deploy multiple `medusa-worker` instances
2. **Database Replication**: Set up PostgreSQL read replicas
3. **Redis Cluster**: Use Redis Cluster for high availability
4. **Load Balancing**: Configure Traefik load balancing in Dokploy

## Backup

Dokploy supports volume backups. Configure backups for:

- `postgres_data` - Database data
- `redis_data` - Redis cache data
- `meilisearch_data` - Search indices

Go to **Volume Backups** in Dokploy to configure automatic backups to S3 or other storage.
