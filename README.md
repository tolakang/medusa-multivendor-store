# Medusa 2.0 Multi-Vendor Store

A multi-vendor e-commerce platform built with Medusa 2.0, designed for deployment on Dokploy.

## Architecture

This project uses Medusa 2.0's modular architecture with the following services:

- **Medusa Server** (`medusa-server`): Handles API requests, serves admin dashboard, manages storefront
- **Medusa Worker** (`medusa-worker`): Handles background jobs, workflows, and event processing
- **PostgreSQL** (`postgres`): Primary database
- **Redis** (`redis`): Caching, event bus, and workflow engine
- **Meilisearch** (`meilisearch`): Search engine for products
- **Next.js Storefront** (`medusa-storefront`): Customer-facing storefront

## Project Structure

```
medusa-multivendor-store/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── api/           # API routes
│   │   │   ├── models/        # Data models (Vendor, etc.)
│   │   │   ├── services/      # Business logic services
│   │   │   ├── middlewares/   # Custom middleware
│   │   │   └── subscribers/   # Event subscribers
│   │   ├── medusa-config.ts   # Medusa configuration
│   │   ├── package.json
│   │   └── Dockerfile
│   └── storefront/
│       ├── src/
│       ├── package.json
│       └── Dockerfile
├── docker-compose.yml         # Dokploy deployment config
├── .env                       # Environment variables
└── README.md
```

## Deployment on Dokploy

### Prerequisites

1. Dokploy installed on your Ubuntu server
2. Docker and Docker Compose installed
3. Access to your Dokploy dashboard

### Deployment Steps

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Medusa 2.0 multi-vendor store"
   git remote add origin https://github.com/your-username/medusa-multivendor-store.git
   git push -u origin main
   ```

2. **Create Dokploy Application**:
   - Go to your Dokploy dashboard
   - Click "Create New" → "Docker Compose"
   - Name your application (e.g., `medusa-multivendor`)
   - Connect your GitHub repository

3. **Configure Environment Variables**:
   In Dokploy, go to the Environment tab and add:
   ```
   POSTGRES_USER=medusa
   POSTGRES_DB=medusa-store
   POSTGRES_PASSWORD=your-secure-password
   JWT_SECRET=your-secure-jwt-secret
   COOKIE_SECRET=your-secure-cookie-secret
   MEILISEARCH_MASTER_KEY=your-meilisearch-master-key
   STORE_CORS=https://your-storefront-domain.com
   ADMIN_CORS=https://your-admin-domain.com
   AUTH_CORS=https://your-storefront-domain.com,https://your-admin-domain.com
   ```

4. **Deploy**:
   - Click "Deploy" in Dokploy
   - Wait for the build to complete
   - Access your services at the provided URLs

### Multi-Vendor Features

This setup includes:

- **Vendor Management**: Custom Vendor entity for managing sellers
- **Sales Channel Segmentation**: Products organized by vendor via Sales Channels
- **Inventory Management**: Multi-location inventory support
- **Vendor API Routes**: RESTful API for vendor operations
- **Search Integration**: Meilisearch for fast product search

### Post-Deployment

1. **Create Admin User**:
   ```bash
   # Run in the medusa-server container
   medusa user -e admin@example.com -p your-password
   ```

2. **Set up Vendors**:
   - Log into the Medusa Admin dashboard
   - Create Sales Channels for each vendor
   - Add products to vendor-specific Sales Channels

3. **Configure Storefront**:
   - Update `NEXT_PUBLIC_MEDUSA_BACKEND_URL` to your server URL
   - Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` with your API key

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Or use Docker Compose
docker-compose up
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:server` - Start in server mode
- `npm run start:worker` - Start in worker mode
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgres://medusa:medusa-secret-pw@postgres:5432/medusa-store` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` |
| `JWT_SECRET` | JWT token secret | Required |
| `COOKIE_SECRET` | Cookie secret | Required |
| `MEDUSA_WORKER_MODE` | Worker mode (`server`/`worker`/`shared`) | `server` |
| `DISABLE_MEDUSA_ADMIN` | Disable admin dashboard | `false` |
| `STORE_CORS` | Storefront CORS origin | `http://localhost:8000` |
| `ADMIN_CORS` | Admin CORS origin | `http://localhost:9000` |
| `MEILISEARCH_HOST` | Meilisearch URL | `http://meilisearch:7700` |
| `MEILISEARCH_MASTER_KEY` | Meilisearch master key | Required |

## License

MIT
