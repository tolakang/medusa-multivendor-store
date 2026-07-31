# =============================================================================
# Medusa 2.0 Multi-Vendor Backend — Production Dockerfile
# Based on patterns from rpuls/medusajs-2.0-for-railway-boilerplate + official docs
# =============================================================================
FROM node:20-alpine AS base

# ---- deps stage: install ALL dependencies (including dev for build) ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./

# Configure npm with retry logic for rate limits
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    for i in 1 2 3 4 5; do \
      echo "Attempt $i: npm install..." && \
      npm install && \
      echo "Attempt $i succeeded" && \
      break || \
      echo "Attempt $i failed, waiting 60s before retry..." && \
      sleep 60; \
    done

# ---- builder stage: run medusa build + post-build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# medusa build creates .medusa/server/ with compiled JS, config, admin, and package.json
# post-build.js copies lockfile + installs production deps in .medusa/server/
RUN npm run build

# ---- runner stage: production image ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

# Copy the entire .medusa/server/ build output
# This contains: compiled JS, medusa-config.js, admin dashboard, package.json, node_modules
COPY --from=builder /app/.medusa/server ./

# Ensure correct permissions
RUN chown -R medusa:nodejs /app

USER medusa

EXPOSE 9000

ENV PORT=9000

# Start command: run migrations then start Medusa server
# Worker instances skip migrations by setting MEDUSA_WORKER_MODE=worker
CMD ["sh", "-c", "if [ \"$MEDUSA_WORKER_MODE\" != \"worker\" ]; then npx medusa db:migrate; fi && npx medusa start --verbose"]
