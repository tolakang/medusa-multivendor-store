# Medusa 2.0 Multi-Vendor Backend

This is the backend service for the Medusa 2.0 multi-vendor e-commerce platform.

## Architecture

- **Server**: Handles API requests, admin dashboard, and scheduled jobs
- **Worker**: Processes background jobs (order fulfillment, notifications, etc.)
- Both use the same Docker image but run in different modes via `WORKER_MODE`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `MEILISEARCH_HOST` | Meilisearch URL | Required |
| `MEILISEARCH_API_KEY` | Meilisearch API key | Required |
| `JWT_SECRET` | Secret for JWT tokens | Required |
| `COOKIE_SECRET` | Secret for cookies | Required |
| `WORKER_MODE` | `server`, `worker`, or `shared` | `server` |
| `ADMIN_DISABLED` | `true` to disable admin dashboard | `false` |
| `STORE_CORS` | Storefront origin for CORS | Required |
| `ADMIN_CORS` | Admin dashboard origin for CORS | Required |
| `AUTH_CORS` | Auth endpoints origin for CORS | Required |

## Multi-Vendor Implementation

The multi-vendor functionality needs to be implemented using Medusa v2's data model system:

1. **Vendor Model**: Define using Medusa's data model (not TypeORM decorators)
2. **Vendor Service**: Implement using Medusa's service pattern
3. **API Routes**: Add vendor CRUD endpoints
4. **Subscribers**: Add vendor-specific event handlers

See [Medusa v2 Data Model Docs](https://docs.medusajs.com/learn/data-models) for implementation details.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run migrations
npm run migrate
```

## Docker

The Dockerfile uses a multi-stage build:

1. **deps**: Installs all dependencies
2. **builder**: Runs `medusa build` to create `.medusa/server/`
3. **runner**: Production image with compiled output

The build output goes to `.medusa/server/` (NOT `dist/`).
