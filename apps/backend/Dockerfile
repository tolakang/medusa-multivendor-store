# =============================================================================
# Medusa 2.0 Multi-Vendor Backend — Production Dockerfile (Monorepo)
# =============================================================================
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
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

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install curl and nc for health checks and wait logic
RUN apk add --no-cache curl netcat-openbsd

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

# Copy the entire .medusa/server/ build output
COPY --from=builder /app/.medusa/server ./

# Copy the monorepo start script
COPY --from=builder /app/src/scripts/start-monorepo.sh ./start-monorepo.sh
RUN chmod +x ./start-monorepo.sh && chown -R medusa:nodejs /app

USER medusa

EXPOSE 9000

ENV PORT=9000

# Use the start script which waits for DB, then conditionally runs migrations
CMD ["./start-monorepo.sh"]
